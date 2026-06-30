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
