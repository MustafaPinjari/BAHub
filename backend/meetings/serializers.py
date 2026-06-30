from rest_framework import serializers
from .models import Meeting, ActionItem
from django.contrib.auth import get_user_model
from users.serializers import UserSerializer
from projects.models import Project

User = get_user_model()

class ActionItemSerializer(serializers.ModelSerializer):
    assignee_detail = UserSerializer(source="assignee", read_only=True)
    meeting_title = serializers.CharField(source="meeting.title", read_only=True)

    class Meta:
        model = ActionItem
        fields = [
            "id",
            "meeting",
            "meeting_title",
            "description",
            "assignee",
            "assignee_detail",
            "due_date",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        meeting = attrs.get("meeting")
        assignee = attrs.get("assignee")

        if not meeting and self.instance:
            meeting = self.instance.meeting

        if assignee and meeting:
            if assignee.organization != meeting.project.organization:
                raise serializers.ValidationError(
                    {"assignee": "Assigned user must belong to the meeting's organization."}
                )

        return attrs


class MeetingSerializer(serializers.ModelSerializer):
    attendees_detail = UserSerializer(source="attendees", many=True, read_only=True)
    action_items = ActionItemSerializer(many=True, read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = Meeting
        fields = [
            "id",
            "project",
            "project_name",
            "title",
            "date",
            "time",
            "objective",
            "notes",
            "attendees",
            "attendees_detail",
            "action_items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "action_items", "created_at", "updated_at"]

    def validate(self, attrs):
        request = self.context.get("request")
        project = attrs.get("project")

        if not project and self.instance:
            project = self.instance.project

        if not project:
            raise serializers.ValidationError("A project context must be specified for the meeting.")

        # Ensure project organization matches user organization
        if request and request.user.is_authenticated:
            org = request.user.organization
            if project.organization != org:
                raise serializers.ValidationError("Cannot create or update a meeting for a project outside your organization.")

        return attrs

    def validate_attendees(self, value):
        # Ensure all attendees belong to the project's organization
        project_id = self.initial_data.get("project")
        if not project_id and self.instance:
            project = self.instance.project
        elif project_id:
            try:
                project = Project.objects.get(id=project_id)
            except Project.DoesNotExist:
                return value
        else:
            return value

        for attendee in value:
            if attendee.organization != project.organization:
                raise serializers.ValidationError(
                    f"Attendee @{attendee.username} does not belong to the project's organization."
                )

        return value
