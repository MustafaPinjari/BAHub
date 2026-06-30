from rest_framework import viewsets, permissions, status
from rest_framework.permissions import IsAuthenticated
from .models import Stakeholder
from .serializers import StakeholderSerializer
from core.responses import api_success
from core.exceptions import ValidationError

class StakeholderViewSet(viewsets.ModelViewSet):
    """
    ViewSet handling Stakeholder CRUD operations.
    Enforces multi-tenant organization isolation and offers optional project-based query filtering.
    """
    serializer_class = StakeholderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return Stakeholder.objects.none()

        queryset = Stakeholder.objects.filter(organization_id=user.organization_id)
        
        # Support ?project=uuid query filtering
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
            
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        if not user.organization:
            raise ValidationError("You must belong to an organization to register a stakeholder.")
        serializer.save(organization=user.organization)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Stakeholders retrieved successfully.")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_success(data=serializer.data, message="Stakeholder details retrieved successfully.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return api_success(
            data=serializer.data,
            message="Stakeholder created successfully.",
            status_code=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return api_success(data=serializer.data, message="Stakeholder profile updated successfully.")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return api_success(message="Stakeholder deleted successfully.", status_code=status.HTTP_200_OK)
