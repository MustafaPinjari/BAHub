from rest_framework import serializers
from .models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "organization",
            "project",
            "project_name",
            "user",
            "user_name",
            "user_username",
            "action",
            "resource_type",
            "resource_id",
            "resource_name",
            "changes",
            "ip_address",
            "user_agent",
            "created_at",
        ]
        read_only_fields = fields
