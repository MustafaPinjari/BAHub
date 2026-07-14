from rest_framework import viewsets, permissions, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from .models import UserStory
from .serializers import UserStorySerializer
from requirements.models import Requirement
from core.responses import api_success, api_error
from core.exceptions import ValidationError

class UserStoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet handling UserStory CRUD operations.
    Enforces multi-tenant workspace bounds and provides an AI generator tool.
    """
    serializer_class = UserStorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return UserStory.objects.none()

        queryset = UserStory.objects.filter(
            requirement__project__organization_id=user.organization_id
        ).select_related('requirement', 'requirement__project', 'requirement__created_by', 'requirement__source_stakeholder')
        
        # Support ?project=uuid query filtering
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(requirement__project_id=project_id)
            
        # Support ?requirement=uuid query filtering
        req_id = self.request.query_params.get("requirement")
        if req_id:
            queryset = queryset.filter(requirement_id=req_id)
            
        return queryset

    @action(detail=False, methods=["post"], url_path="generate")
    def generate_story(self, request):
        """
        AI User Story Generator.
        Reads a parent requirement and compiles a structured Agile story card.
        """
        requirement_id = request.data.get("requirement")
        if not requirement_id:
            return api_error(message="Requirement ID is required.")

        try:
            requirement = Requirement.objects.get(
                id=requirement_id,
                project__organization_id=request.user.organization_id
            )
        except Requirement.DoesNotExist:
            return api_error(message="Requirement not found in your organization.")

        title = requirement.title
        desc = requirement.description

        # Infer persona from requirement contents
        role = "Business Analyst"
        if "admin" in title.lower() or "admin" in desc.lower():
            role = "System Administrator"
        elif "customer" in title.lower() or "client" in title.lower():
            role = "Premium Customer"
        elif "developer" in title.lower() or "api" in title.lower() or "database" in title.lower():
            role = "Integration Developer"

        action_str = f"use the '{title}' feature interface"
        benefit_str = "ensure all business process logic runs in accordance with specifications"

        # Construct acceptance criteria
        criteria = (
            f"- **GIVEN** a user is logged in as a {role}\n"
            f"- **WHEN** they execute operations matching: '{title}'\n"
            f"- **THEN** the backend process validates constraints, updates state data, and returns HTTP 200 OK."
        )

        data = {
            "title": f"Story for {requirement.req_id} - {requirement.title}",
            "role": role,
            "action": action_str,
            "benefit": benefit_str,
            "acceptance_criteria": criteria,
            "requirement": str(requirement.id),
        }

        return api_success(data=data, message="Agile user story generated successfully.")

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="User stories retrieved successfully.")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_success(data=serializer.data, message="User story details retrieved.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return api_success(
            data=serializer.data,
            message="User story created successfully.",
            status_code=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return api_success(data=serializer.data, message="User story updated successfully.")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return api_success(message="User story deleted successfully.", status_code=status.HTTP_200_OK)
