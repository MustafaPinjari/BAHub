from rest_framework import serializers
from .models import Diagram, DiagramVersion, DiagramObjectLink, DiagramComment, DiagramApproval
from requirements.serializers import RequirementSerializer
from stakeholders.serializers import StakeholderSerializer
from stories.serializers import UserStorySerializer
from risks.serializers import RiskSerializer, ChangeRequestSerializer
from meetings.serializers import MeetingSerializer

class DiagramObjectLinkSerializer(serializers.ModelSerializer):
    requirement_detail = RequirementSerializer(source="requirement", read_only=True)
    stakeholder_detail = StakeholderSerializer(source="stakeholder", read_only=True)
    user_story_detail = UserStorySerializer(source="user_story", read_only=True)
    risk_detail = RiskSerializer(source="risk", read_only=True)
    meeting_detail = MeetingSerializer(source="meeting", read_only=True)
    change_request_detail = ChangeRequestSerializer(source="change_request", read_only=True)

    class Meta:
        model = DiagramObjectLink
        fields = [
            "id",
            "diagram",
            "node_id",
            "node_name",
            "node_type",
            "requirement",
            "requirement_detail",
            "stakeholder",
            "stakeholder_detail",
            "user_story",
            "user_story_detail",
            "risk",
            "risk_detail",
            "meeting",
            "meeting_detail",
            "change_request",
            "change_request_detail",
            "task",
            "business_goal",
            "business_rule",
            "acceptance_criteria",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class DiagramCommentSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source="user.username", read_only=True)
    user_role = serializers.CharField(source="user.role", read_only=True)
    resolved_by_username = serializers.CharField(source="resolved_by.username", read_only=True)

    class Meta:
        model = DiagramComment
        fields = [
            "id",
            "diagram",
            "user",
            "user_username",
            "user_role",
            "text",
            "node_id",
            "parent",
            "resolved",
            "resolved_by",
            "resolved_by_username",
            "resolved_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "resolved_by", "resolved_at", "created_at", "updated_at"]


class DiagramApprovalSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source="user.username", read_only=True)
    user_role = serializers.CharField(source="user.role", read_only=True)

    class Meta:
        model = DiagramApproval
        fields = [
            "id",
            "diagram",
            "user",
            "user_username",
            "user_role",
            "status",
            "comments",
            "version",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]


class DiagramVersionSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)

    class Meta:
        model = DiagramVersion
        fields = [
            "id",
            "diagram",
            "version",
            "canvas_json",
            "documentation",
            "status",
            "created_by",
            "created_by_username",
            "checkpoint_name",
            "change_description",
            "created_at",
        ]
        read_only_fields = ["id", "created_by", "created_at"]


class DiagramSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    locked_by_username = serializers.CharField(source="locked_by.username", read_only=True)
    object_links = DiagramObjectLinkSerializer(many=True, read_only=True)

    class Meta:
        model = Diagram
        fields = [
            "id",
            "project",
            "name",
            "description",
            "diagram_type",
            "status",
            "version",
            "canvas_json",
            "documentation",
            "created_by",
            "created_by_username",
            "is_locked",
            "locked_by",
            "locked_by_username",
            "locked_at",
            "object_links",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_by",
            "is_locked",
            "locked_by",
            "locked_at",
            "object_links",
            "created_at",
            "updated_at"
        ]

    def validate(self, attrs):
        request = self.context.get("request")
        project = attrs.get("project")

        if not project and self.instance:
            project = self.instance.project

        if not project:
            raise serializers.ValidationError("A project must be specified.")

        if request and request.user.is_authenticated:
            org = request.user.organization
            if project.organization != org:
                raise serializers.ValidationError("Cannot create or update a diagram for a project outside your organization.")

        return attrs
