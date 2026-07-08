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

from .models import OrganizationInvitation
from .serializers import OrganizationInvitationSerializer
from django.utils import timezone
import datetime
from rest_framework.exceptions import PermissionDenied

class OrganizationInvitationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for OrganizationInvitation operations.
    Allows Admins to invite users, view pending invites, and cancel invitations.
    """
    serializer_class = OrganizationInvitationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.organization_id:
            return OrganizationInvitation.objects.filter(
                organization_id=user.organization_id,
                is_used=False
            )
        return OrganizationInvitation.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != "ADMIN":
            raise PermissionDenied("Only administrators can create workspace invitations.")

        invite = serializer.save(
            organization=user.organization,
            expires_at=timezone.now() + datetime.timedelta(days=7)
        )

        from core.emails import send_organization_invitation_email
        send_organization_invitation_email(invite, user)
