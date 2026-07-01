from rest_framework import serializers
from .models import SWOTAnalysis, GapAnalysis

class SWOTAnalysisSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = SWOTAnalysis
        fields = [
            "id",
            "project",
            "project_name",
            "strengths",
            "weaknesses",
            "opportunities",
            "threats",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        request = self.context.get("request")
        project = attrs.get("project")

        if not project and self.instance:
            project = self.instance.project

        if not project:
            raise serializers.ValidationError("A project context must be specified for the SWOT analysis.")

        if request and request.user.is_authenticated:
            org = request.user.organization
            if project.organization != org:
                raise serializers.ValidationError("Cannot create or update a SWOT analysis for a project outside your organization.")

        return attrs


class GapAnalysisSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = GapAnalysis
        fields = [
            "id",
            "project",
            "project_name",
            "title",
            "current_state",
            "future_state",
            "gap_description",
            "action_plan",
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
            raise serializers.ValidationError("A project context must be specified for the Gap analysis.")

        if request and request.user.is_authenticated:
            org = request.user.organization
            if project.organization != org:
                raise serializers.ValidationError("Cannot create or update a Gap analysis for a project outside your organization.")

        return attrs
