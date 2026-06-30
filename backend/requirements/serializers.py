from rest_framework import serializers
from .models import Requirement
from stakeholders.serializers import StakeholderSerializer

class RequirementSerializer(serializers.ModelSerializer):
    source_stakeholder_detail = StakeholderSerializer(source="source_stakeholder", read_only=True)
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)

    class Meta:
        model = Requirement
        fields = [
            "id",
            "project",
            "req_id",
            "title",
            "description",
            "req_type",
            "status",
            "priority",
            "version",
            "source_stakeholder",
            "source_stakeholder_detail",
            "created_by",
            "created_by_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "req_id", "created_by", "created_at", "updated_at"]

    def validate(self, attrs):
        request = self.context.get("request")
        project = attrs.get("project")

        # If updating, pull project from instance
        if not project and self.instance:
            project = self.instance.project

        if not project:
            raise serializers.ValidationError("A project must be specified for the requirement.")

        # Ensure project organization matches the user's organization
        if request and request.user.is_authenticated:
            org = request.user.organization
            if project.organization != org:
                raise serializers.ValidationError("Cannot create or update a requirement for a project outside your organization.")

        # Validate that the source stakeholder belongs to the same organization
        stakeholder = attrs.get("source_stakeholder")
        if stakeholder and stakeholder.organization != project.organization:
            raise serializers.ValidationError(
                {"source_stakeholder": "Assigned stakeholder must belong to the project's organization."}
            )

        return attrs
