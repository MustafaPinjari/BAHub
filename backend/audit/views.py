from rest_framework import viewsets, permissions
from rest_framework.permissions import IsAuthenticated
from .models import AuditLog
from .serializers import AuditLogSerializer
from core.responses import api_success

from billing.permissions import IsEnterprise

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for retrieving database audit logs.
    Strictly isolates queries to the user's organization context.
    """
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsEnterprise]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return AuditLog.objects.none()

        queryset = AuditLog.objects.filter(organization_id=user.organization_id)

        # Filters
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        action = self.request.query_params.get("action")
        if action:
            queryset = queryset.filter(action=action)

        resource_type = self.request.query_params.get("resource_type")
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type)

        user_id = self.request.query_params.get("user")
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Audit logs retrieved successfully.")
