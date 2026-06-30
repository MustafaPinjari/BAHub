from rest_framework import viewsets, permissions, status
from rest_framework.permissions import IsAuthenticated
from .models import Permission, Role, UserRole, UserPermissionOverride
from .serializers import (
    PermissionSerializer,
    RoleSerializer,
    UserRoleSerializer,
    UserPermissionOverrideSerializer,
)
from core.responses import api_success
from core.exceptions import ValidationError

class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly ViewSet listing all system-wide registered permissions.
    """
    queryset = Permission.objects.filter(is_deleted=False)
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated]

class RoleViewSet(viewsets.ModelViewSet):
    """
    ViewSet handling Organization Roles.
    """
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.organization_id:
            return Role.objects.filter(organization_id=user.organization_id)
        return Role.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if not user.organization:
            raise ValidationError("You must belong to an organization to create a role.")
        serializer.save(organization=user.organization)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Organization roles retrieved successfully.")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_success(data=serializer.data, message="Role details retrieved successfully.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return api_success(
            data=serializer.data, 
            message="Role created successfully.",
            status_code=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return api_success(data=serializer.data, message="Role updated successfully.")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return api_success(message="Role deleted successfully.", status_code=status.HTTP_200_OK)

class UserRoleViewSet(viewsets.ModelViewSet):
    """
    ViewSet mapping Users to organization Roles.
    """
    serializer_class = UserRoleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.organization_id:
            return UserRole.objects.filter(role__organization_id=user.organization_id)
        return UserRole.objects.none()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="User roles mappings retrieved successfully.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return api_success(
            data=serializer.data,
            message="User role assigned successfully.",
            status_code=status.HTTP_201_CREATED
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()  # Junction table hard-delete is fine
        return api_success(message="User role unassigned successfully.")

class UserPermissionOverrideViewSet(viewsets.ModelViewSet):
    """
    ViewSet handling custom user permission overrides.
    """
    serializer_class = UserPermissionOverrideSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.organization_id:
            return UserPermissionOverride.objects.filter(user__organization_id=user.organization_id)
        return UserPermissionOverride.objects.none()
