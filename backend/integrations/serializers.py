from rest_framework import serializers
from .models import IntegrationConfig, SyncLog

class IntegrationConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntegrationConfig
        fields = [
            "id",
            "project",
            "jira_url",
            "jira_username",
            "jira_api_token",
            "jira_project_key",
            "confluence_url",
            "confluence_username",
            "confluence_api_token",
            "confluence_space_key",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_project(self, value):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            if value.organization != request.user.organization:
                raise serializers.ValidationError("Project does not belong to your organization.")
        return value


class SyncLogSerializer(serializers.ModelSerializer):
    triggered_by_username = serializers.CharField(source="triggered_by.username", read_only=True)
    
    class Meta:
        model = SyncLog
        fields = [
            "id",
            "project",
            "sync_type",
            "status",
            "message",
            "triggered_by",
            "triggered_by_username",
            "created_at",
        ]
        read_only_fields = ["id", "triggered_by", "triggered_by_username", "created_at"]
