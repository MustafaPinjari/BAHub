from rest_framework import serializers
from .models import Project, ProjectMember
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
