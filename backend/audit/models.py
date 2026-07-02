from django.db import models
from django.conf import settings
from core.models import BaseModel
from organizations.models import Organization
from projects.models import Project

class AuditLog(BaseModel):
    """
    AuditLog model auditing creates, updates, and deletes on core resources.
    Identifies mutations, diff changes in JSON, and captures metadata like IP and User-Agent.
    """
    ACTION_CHOICES = [
        ("CREATE", "Create"),
        ("UPDATE", "Update"),
        ("DELETE", "Delete"),
        ("LOGIN", "Login"),
        ("LOGOUT", "Logout"),
    ]

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="audit_logs"
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.SET_NULL,
        related_name="audit_logs",
        null=True,
        blank=True
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="audit_logs",
        null=True,
        blank=True
    )
    user_username = models.CharField(max_length=150, blank=True)
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    resource_type = models.CharField(max_length=100)
    resource_id = models.CharField(max_length=255)
    resource_name = models.CharField(max_length=255, blank=True, null=True)
    changes = models.JSONField(blank=True, null=True)  # Format: { "field": { "old": "val", "new": "val" } }
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "audit_logs"
        ordering = ["-created_at"]

    def __str__(self):
        user_str = self.user_username or "system"
        return f"{user_str} - {self.action} {self.resource_type} ({self.created_at})"
