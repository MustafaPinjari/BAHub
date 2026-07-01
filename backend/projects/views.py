from rest_framework import viewsets, permissions, status
from rest_framework.permissions import IsAuthenticated
from .models import Project, ProjectMember
from .serializers import ProjectSerializer, ProjectMemberSerializer
from core.responses import api_success
from core.exceptions import ValidationError
from rest_framework.decorators import action

class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet handling Project CRUD operations.
    - Admins see all projects in their organization.
    - Standard roles only see projects in their organization where they are a member.
    """
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return Project.objects.none()

        if user.role in ["ADMIN", "BUSINESS_ANALYST", "PRODUCT_OWNER"]:
            return Project.objects.filter(organization_id=user.organization_id)

        # Standard users get projects where they are listed as members
        return Project.objects.filter(
            organization_id=user.organization_id,
            project_members__user=user
        ).distinct()

    def perform_create(self, serializer):
        user = self.request.user
        if not user.organization:
            raise ValidationError("You must belong to an organization to create a project.")
        
        # Save project and automatically register creator as a project manager!
        project = serializer.save(organization=user.organization)
        ProjectMember.objects.get_or_create(
            project=project,
            user=user,
            defaults={"role": "PROJECT_MANAGER"}
        )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Projects retrieved successfully.")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_success(data=serializer.data, message="Project details retrieved successfully.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return api_success(
            data=serializer.data,
            message="Project created successfully.",
            status_code=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return api_success(data=serializer.data, message="Project updated successfully.")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return api_success(message="Project soft-deleted successfully.")

    @action(detail=True, methods=["get"], url_path="report")
    def report(self, request, pk=None):
        project = self.get_object()
        
        # 1. Requirements
        reqs = project.requirements.all()
        reqs_total = reqs.count()
        reqs_by_status = {}
        for r in reqs:
            reqs_by_status[r.status] = reqs_by_status.get(r.status, 0) + 1
        reqs_by_category = {}
        for r in reqs:
            reqs_by_category[r.req_type] = reqs_by_category.get(r.req_type, 0) + 1

        # 2. User Stories
        from stories.models import UserStory
        stories = UserStory.objects.filter(requirement__project=project)
        stories_total = stories.count()
        stories_by_status = {}
        total_points = 0
        for s in stories:
            stories_by_status[s.status] = stories_by_status.get(s.status, 0) + 1
            if s.points:
                total_points += s.points

        # 3. Risks
        risks = project.risks.all()
        risks_total = risks.count()
        risks_by_prob = {}
        risks_by_impact = {}
        risks_by_status = {}
        for r in risks:
            risks_by_prob[r.probability] = risks_by_prob.get(r.probability, 0) + 1
            risks_by_impact[r.impact] = risks_by_impact.get(r.impact, 0) + 1
            risks_by_status[r.status] = risks_by_status.get(r.status, 0) + 1

        # 4. Change Requests
        crs = project.change_requests.all()
        crs_total = crs.count()
        crs_by_status = {}
        for c in crs:
            crs_by_status[c.status] = crs_by_status.get(c.status, 0) + 1

        # 5. Meetings & Action Items
        meetings_count = project.meetings.count()
        from meetings.models import ActionItem
        actions = ActionItem.objects.filter(meeting__project=project)
        actions_total = actions.count()
        actions_open = actions.filter(status="OPEN").count() + actions.filter(status="IN_PROGRESS").count()
        actions_completed = actions.filter(status="COMPLETED").count()

        data = {
            "requirements": {
                "total": reqs_total,
                "by_status": reqs_by_status,
                "by_category": reqs_by_category,
            },
            "stories": {
                "total": stories_total,
                "by_status": stories_by_status,
                "total_points": total_points,
            },
            "risks": {
                "total": risks_total,
                "by_probability": risks_by_prob,
                "by_impact": risks_by_impact,
                "by_status": risks_by_status,
            },
            "changes": {
                "total": crs_total,
                "by_status": crs_by_status,
            },
            "meetings": {
                "total": meetings_count,
                "action_items_total": actions_total,
                "action_items_open": actions_open,
                "action_items_completed": actions_completed,
            }
        }
        
        return api_success(data=data, message="Project strategic report compiled successfully.")

class ProjectMemberViewSet(viewsets.ModelViewSet):
    """
    ViewSet mapping Users to Projects.
    """
    serializer_class = ProjectMemberSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.organization_id:
            return ProjectMember.objects.filter(project__organization_id=user.organization_id)
        return ProjectMember.objects.none()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Project members retrieved successfully.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return api_success(
            data=serializer.data,
            message="Member assigned to project successfully.",
            status_code=status.HTTP_201_CREATED
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()  # Hard-delete mapping junction is fine
        return api_success(message="Member removed from project successfully.")
