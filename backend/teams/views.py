from rest_framework import viewsets, permissions, status
from rest_framework.permissions import IsAuthenticated
from .models import Team
from .serializers import TeamSerializer
from core.responses import api_success
from core.exceptions import ValidationError

class IsTeamManagerOrReadOnly(permissions.BasePermission):
    """
    Permission check:
    - Safe methods (GET, HEAD, OPTIONS) are allowed for any authenticated user in the organization.
    - Write methods (POST, PUT, PATCH, DELETE) are allowed only for ADMIN, BUSINESS_ANALYST, or PRODUCT_OWNER.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role in ["ADMIN", "BUSINESS_ANALYST", "PRODUCT_OWNER"]

    def has_object_permission(self, request, view, obj):
        # Must belong to the same organization
        return request.user.organization_id == obj.organization_id

class TeamViewSet(viewsets.ModelViewSet):
    """
    ViewSet handling Team CRUD operations within organization boundaries.
    """
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated, IsTeamManagerOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.organization_id:
            return Team.objects.filter(organization_id=user.organization_id)
        return Team.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if not user.organization:
            raise ValidationError("You must belong to an organization to create a team.")
        # Automatically inject organization boundaries
        serializer.save(organization=user.organization)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Teams retrieved successfully.")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_success(data=serializer.data, message="Team details retrieved successfully.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return api_success(
            data=serializer.data, 
            message="Team created successfully.",
            status_code=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return api_success(data=serializer.data, message="Team updated successfully.")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return api_success(message="Team soft-deleted successfully.", status_code=status.HTTP_200_OK)
