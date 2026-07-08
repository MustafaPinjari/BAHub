from rest_framework import serializers
from organizations.models import Organization

class OrganizationSerializer(serializers.ModelSerializer):
    """
    Serializer for listing, retrieving, and updating Organization profiles.
    """
    class Meta:
        model = Organization
        fields = [
            "id",
            "name",
            "logo",
            "description",
            "timezone",
            "email",
            "phone",
            "website",
            "address",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

from .models import OrganizationInvitation

class OrganizationInvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganizationInvitation
        fields = [
            "id",
            "organization",
            "email",
            "token",
            "role",
            "is_used",
            "expires_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "organization", "token", "is_used", "expires_at", "created_at", "updated_at"]
