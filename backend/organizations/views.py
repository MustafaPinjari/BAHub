from rest_framework import viewsets, mixins, permissions
from rest_framework.permissions import IsAuthenticated
from organizations.models import Organization
from organizations.serializers import OrganizationSerializer
from core.responses import api_success

class IsOrganizationMember(permissions.BasePermission):
    """
    Permission class checking if the user is a member of the organization object.
    """
    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and request.user.organization_id == obj.id

class OrganizationViewSet(mixins.RetrieveModelMixin,
                          mixins.UpdateModelMixin,
                          viewsets.GenericViewSet):
    """
    ViewSet for Organization operations.
    Users can only view or update the Organization they belong to.
    Creation and deletion are handled via specific auth channels.
    """
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.organization_id:
            return Organization.objects.filter(id=user.organization_id)
        return Organization.objects.none()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_success(data=serializer.data, message="Organization details retrieved successfully.")

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return api_success(data=serializer.data, message="Organization profile updated successfully.")
