from rest_framework import viewsets, permissions, status
from rest_framework.permissions import IsAuthenticated
from .models import Project, ProjectMember
from .serializers import ProjectSerializer, ProjectMemberSerializer
from core.responses import api_success
from core.exceptions import ValidationError

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
