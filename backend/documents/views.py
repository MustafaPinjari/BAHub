import datetime
from rest_framework import viewsets, permissions, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from .models import BusinessDocument
from .serializers import BusinessDocumentSerializer
from projects.models import Project
from core.responses import api_success, api_error
from core.exceptions import ValidationError

class BusinessDocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet handling BusinessDocument CRUD operations.
    Supports automated BRD/FRD generation and official sign-off workflows.
    """
    serializer_class = BusinessDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return BusinessDocument.objects.none()

        queryset = BusinessDocument.objects.filter(project__organization_id=user.organization_id)
        
        # Support ?project=uuid query filtering
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
            
        # Support ?doc_type=BRD query filtering
        doc_type = self.request.query_params.get("doc_type")
        if doc_type:
            queryset = queryset.filter(doc_type=doc_type)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["post"], url_path="generate")
    def generate_document(self, request):
        """
        Synthesizes a markdown BRD/FRD template.
        Gathers all stakeholders, requirements, and user stories.
        """
        project_id = request.data.get("project")
        doc_type = request.data.get("doc_type", "BRD")
        if not project_id:
            return api_error(message="Project ID is required.")

        try:
            project = Project.objects.get(
                id=project_id,
                organization_id=request.user.organization_id
            )
        except Project.DoesNotExist:
            return api_error(message="Project not found in your organization.")

        stakeholders = project.stakeholders.all()
        requirements = project.requirements.all()

        # Build markdown template
        content = f"# Business Document: {doc_type} - {project.name}\n\n"
        content += "## 1. Document Control & Scope\n"
        content += f"- **Project Scope**: {project.name}\n"
        content += f"- **Workspace Organisation**: {project.organization.name}\n"
        content += f"- **Document Schema Type**: {doc_type}\n"
        content += f"- **Author**: @{request.user.username}\n"
        content += "- **Status**: DRAFT\n"
        content += f"- **Scope Description**: {project.description or 'No scope definition provided.'}\n\n"

        content += "## 2. Key Stakeholder Registry\n"
        if not stakeholders.exists():
            content += "*No stakeholders registered in this project.*\n\n"
        else:
            content += "| Name | Title | Department | Power / Interest |\n"
            content += "| --- | --- | --- | --- |\n"
            for s in stakeholders:
                content += f"| {s.name} | {s.title} | {s.department or 'N/A'} | {s.power} / {s.interest} |\n"
            content += "\n"

        content += "## 3. Business & Technical Specifications Catalog\n"
        if not requirements.exists():
            content += "*No specifications recorded in project backlog.*\n\n"
        else:
            content += "| ID | Title | Priority | Type | Status |\n"
            content += "| --- | --- | --- | --- | --- |\n"
            for r in requirements:
                content += f"| {r.req_id} | {r.title} | {r.priority} | {r.req_type} | {r.status} |\n"
            content += "\n"

        if doc_type == "FRD":
            content += "## 4. Agile Backlog & User Stories Traceability\n"
            from stories.models import UserStory
            stories = UserStory.objects.filter(requirement__project=project)
            if not stories.exists():
                content += "*No user story mappings found in backlog.*\n\n"
            else:
                content += "| Story ID | Title | Estimation | Status | Traced Requirement |\n"
                content += "| --- | --- | --- | --- | --- |\n"
                for s in stories:
                    content += f"| {s.story_id} | {s.title} | {s.points} pts | {s.status} | {s.requirement.req_id} |\n"
                content += "\n"

        title = f"{doc_type} - {project.name} - Version 1.0"

        data = {
            "project": str(project.id),
            "doc_type": doc_type,
            "title": title,
            "version": "1.0",
            "status": "DRAFT",
            "content": content,
        }

        return api_success(data=data, message="Document synthesized successfully.")

    @action(detail=True, methods=["post"], url_path="sign-off")
    def sign_off(self, request, pk=None):
        """
        Transitions document status to SIGNED_OFF.
        Restricted to Admins, Product Owners, and Project Managers.
        """
        doc = self.get_object()

        if request.user.role not in ["ADMIN", "PRODUCT_OWNER", "PROJECT_MANAGER"]:
            return api_error(message="Only Product Owners, Project Managers, and Admins can sign off documents.")

        from django.utils import timezone
        doc.status = "SIGNED_OFF"
        doc.signed_off_by = request.user
        doc.signed_off_at = timezone.now()
        doc.save()

        serializer = self.get_serializer(doc)
        return api_success(data=serializer.data, message="Document signed off successfully.")

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Documents retrieved successfully.")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_success(data=serializer.data, message="Document details retrieved.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return api_success(
            data=serializer.data,
            message="Document created successfully.",
            status_code=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return api_success(data=serializer.data, message="Document updated successfully.")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return api_success(message="Document deleted successfully.", status_code=status.HTTP_200_OK)
