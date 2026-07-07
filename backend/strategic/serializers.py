from rest_framework import serializers
from .models import SWOTAnalysis, GapAnalysis, KnowledgeNode, KnowledgeEdge, WorkflowExecution

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


class KnowledgeNodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeNode
        fields = [
            "id",
            "project",
            "node_key",
            "title",
            "node_type",
            "content",
            "status",
            "meta_data",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class KnowledgeEdgeSerializer(serializers.ModelSerializer):
    source_key = serializers.CharField(source="source.node_key", read_only=True)
    target_key = serializers.CharField(source="target.node_key", read_only=True)
    source_type = serializers.CharField(source="source.node_type", read_only=True)
    target_type = serializers.CharField(source="target.node_type", read_only=True)

    class Meta:
        model = KnowledgeEdge
        fields = [
            "id",
            "project",
            "source",
            "target",
            "source_key",
            "target_key",
            "source_type",
            "target_type",
            "relation_type",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class WorkflowExecutionSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = WorkflowExecution
        fields = [
            "id",
            "project",
            "project_name",
            "user",
            "username",
            "status",
            "current_step",
            "input_data",
            "steps_progress",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]

