from rest_framework import serializers
from .models import Risk, ChangeRequest
from users.serializers import UserSerializer

class RiskSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = Risk
        fields = [
            "id",
            "project",
            "project_name",
            "title",
            "description",
            "probability",
            "impact",
            "mitigation",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        request = self.context.get("request")
        project = attrs.get("project")

        if not project and self.instance:
            project = self.instance.project

        if not project:
            raise serializers.ValidationError("A project context must be specified for the risk.")

        if request and request.user.is_authenticated:
            org = request.user.organization
            if project.organization != org:
                raise serializers.ValidationError("Cannot create or update a risk for a project outside your organization.")

        return attrs


class ChangeRequestSerializer(serializers.ModelSerializer):
    requested_by_username = serializers.CharField(source="requested_by.username", read_only=True)
    reviewed_by_username = serializers.CharField(source="reviewed_by.username", read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = ChangeRequest
        fields = [
            "id",
            "project",
            "project_name",
            "title",
            "description",
            "reason",
            "impact_analysis",
            "status",
            "requested_by",
            "requested_by_username",
            "reviewed_by",
            "reviewed_by_username",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", 
            "requested_by", 
            "reviewed_by", 
            "reviewed_at", 
            "created_at", 
            "updated_at"
        ]

    def validate(self, attrs):
        request = self.context.get("request")
        project = attrs.get("project")

        if not project and self.instance:
            project = self.instance.project

        if not project:
            raise serializers.ValidationError("A project context must be specified for the change request.")

        if request and request.user.is_authenticated:
            org = request.user.organization
            if project.organization != org:
                raise serializers.ValidationError("Cannot create or update a change request for a project outside your organization.")

        return attrs
