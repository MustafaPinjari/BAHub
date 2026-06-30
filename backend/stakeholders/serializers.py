from rest_framework import serializers
from .models import Stakeholder
from projects.serializers import ProjectSerializer

class StakeholderSerializer(serializers.ModelSerializer):
    project_detail = ProjectSerializer(source="project", read_only=True)

    class Meta:
        model = Stakeholder
        fields = [
            "id",
            "organization",
            "project",
            "project_detail",
            "name",
            "title",
            "department",
            "email",
            "phone",
            "power",
            "interest",
            "influence",
            "impact",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "organization", "created_at", "updated_at"]

    def validate(self, attrs):
        request = self.context.get("request")
        if self.instance:
            org = self.instance.organization
        elif request and request.user.is_authenticated:
            org = request.user.organization
        else:
            org = attrs.get("organization")

        if not org:
            raise serializers.ValidationError("An organization must be specified for the stakeholder.")

        # Ensure project belongs to the same organization
        project = attrs.get("project")
        if project and project.organization != org:
            raise serializers.ValidationError(
                {"project": "Assigned project must belong to the stakeholder's organization."}
            )

        # Validate rating metrics range
        influence = attrs.get("influence", 3)
        if influence < 1 or influence > 5:
            raise serializers.ValidationError({"influence": "Influence rating must be between 1 and 5."})

        impact = attrs.get("impact", 3)
        if impact < 1 or impact > 5:
            raise serializers.ValidationError({"impact": "Impact rating must be between 1 and 5."})

        return attrs
