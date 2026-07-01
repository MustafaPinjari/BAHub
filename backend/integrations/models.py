from django.db import models
from core.models import BaseModel
from projects.models import Project

class IntegrationConfig(BaseModel):
    project = models.OneToOneField(
        Project,
        on_delete=models.CASCADE,
        related_name="integration_config"
    )
    
    # Jira Connection Details
    jira_url = models.URLField(max_length=255, blank=True, null=True)
    jira_username = models.CharField(max_length=255, blank=True, null=True)
    jira_api_token = models.CharField(max_length=255, blank=True, null=True)
    jira_project_key = models.CharField(max_length=50, blank=True, null=True)
    
    # Confluence Connection Details
    confluence_url = models.URLField(max_length=255, blank=True, null=True)
    confluence_username = models.CharField(max_length=255, blank=True, null=True)
    confluence_api_token = models.CharField(max_length=255, blank=True, null=True)
    confluence_space_key = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = "integration_configs"

    def __str__(self):
        return f"Integration Config - {self.project.name}"


class SyncLog(BaseModel):
    SYNC_TYPES = [
        ("JIRA_STORIES", "Jira User Stories Sync"),
        ("CONFLUENCE_DOC", "Confluence Document Publish"),
    ]
    STATUS_CHOICES = [
        ("SUCCESS", "Success"),
        ("FAILED", "Failed"),
    ]
    
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="sync_logs"
    )
    sync_type = models.CharField(max_length=50, choices=SYNC_TYPES)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES)
    message = models.TextField(blank=True)
    triggered_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="sync_logs"
    )
    
    class Meta:
        db_table = "integration_sync_logs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.sync_type} - {self.status} ({self.created_at})"
