from rest_framework import viewsets, permissions, status
from rest_framework.permissions import IsAuthenticated
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Requirement
from .serializers import RequirementSerializer
from core.responses import api_success
from core.exceptions import ValidationError

class RequirementViewSet(viewsets.ModelViewSet):
    """
    ViewSet handling Requirement CRUD operations.
    Enforces tenant isolation, maps records to active project context, and broadcasts real-time updates.
    """
    serializer_class = RequirementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return Requirement.objects.none()

        queryset = Requirement.objects.filter(project__organization_id=user.organization_id)
        
        # Support ?project=uuid query filtering
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
            
        return queryset

    def _broadcast_change(self, instance, action):
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"project_{instance.project_id}_requirements",
                {
                    "type": "requirement.update",
                    "action": action,
                    "requirement_id": str(instance.id),
                    "user": self.request.user.username if self.request.user.is_authenticated else "system",
                }
            )

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
        self._broadcast_change(serializer.instance, "create")
        from projects.models import log_activity
        log_activity(
            serializer.instance.project,
            self.request.user,
            f"created requirement {serializer.instance.req_id}"
        )

    def perform_update(self, serializer):
        serializer.save()
        self._broadcast_change(serializer.instance, "update")
        from projects.models import log_activity
        log_activity(
            serializer.instance.project,
            self.request.user,
            f"modified requirement {serializer.instance.req_id}"
        )

    def perform_destroy(self, instance):
        project = instance.project
        req_id_str = instance.req_id
        project_id = instance.project_id
        req_id = instance.id
        instance.delete()
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"project_{project_id}_requirements",
                {
                    "type": "requirement.update",
                    "action": "delete",
                    "requirement_id": str(req_id),
                    "user": self.request.user.username if self.request.user.is_authenticated else "system",
                  }
              )
        from projects.models import log_activity
        log_activity(
            project,
            self.request.user,
            f"deleted requirement {req_id_str}"
        )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Requirements retrieved successfully.")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_success(data=serializer.data, message="Requirement details retrieved successfully.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return api_success(
            data=serializer.data,
            message="Requirement created successfully.",
            status_code=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return api_success(data=serializer.data, message="Requirement updated successfully.")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return api_success(message="Requirement deleted successfully.", status_code=status.HTTP_200_OK)
