from rest_framework import serializers
from .models import Project, ProjectMember, ProjectAttachment, ActivityLog
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email", "role"]

class ProjectMemberSerializer(serializers.ModelSerializer):
    user_detail = UserSimpleSerializer(source="user", read_only=True)

    class Meta:
        model = ProjectMember
        fields = ["id", "project", "user", "user_detail", "role"]
        read_only_fields = ["id"]

    def validate(self, attrs):
        user = attrs.get("user")
        project = attrs.get("project")

        if user and project and user.organization != project.organization:
            raise serializers.ValidationError("Cannot assign a member from outside the project's organization.")

        return attrs

class ProjectSerializer(serializers.ModelSerializer):
    members_detail = ProjectMemberSerializer(source="project_members", many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "organization",
            "name",
            "description",
            "status",
            "start_date",
            "end_date",
            "members_detail",
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
            raise serializers.ValidationError("An organization must be specified for the project.")

        return attrs

class ProjectAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.CharField(source="uploaded_by.username", read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ProjectAttachment
        fields = [
            "id",
            "project",
            "name",
            "file",
            "file_url",
            "size_str",
            "uploaded_by",
            "uploaded_by_username",
            "created_at"
        ]
        read_only_fields = ["id", "uploaded_by", "size_str", "created_at"]

    def get_file_url(self, obj):
        request = self.context.get("request")
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        elif obj.file:
            return obj.file.url
        return None

class ActivityLogSerializer(serializers.ModelSerializer):
    user_detail = UserSimpleSerializer(source="user", read_only=True)
    created_at_human = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = [
            "id",
            "project",
            "user",
            "user_detail",
            "action",
            "created_at",
            "created_at_human"
        ]
        read_only_fields = ["id", "user", "created_at"]

    def get_created_at_human(self, obj):
        from django.utils.timezone import now
        diff = now() - obj.created_at
        if diff.days > 0:
            return f"{diff.days}d ago"
        seconds = diff.seconds
        hours = seconds // 3600
        if hours > 0:
            return f"{hours}h ago"
        minutes = seconds // 60
        if minutes > 0:
            return f"{minutes}m ago"
        return "just now"
