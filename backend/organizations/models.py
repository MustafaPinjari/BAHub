import uuid
from django.db import models
from django.conf import settings
from core.models import BaseModel

class Organization(BaseModel):
    """
    Organization model acting as the top-level container for all resources (multi-tenancy root).
    """
    name = models.CharField(max_length=255, unique=True)
    logo = models.ImageField(upload_to="org_logos/", blank=True, null=True)
    description = models.TextField(blank=True)
    timezone = models.CharField(max_length=100, default="UTC")
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    address = models.TextField(blank=True)

    class Meta:
        db_table = "organizations"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class OrganizationInvitation(BaseModel):
    """
    Model representing workspace join invitation tokens.
    """
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="invitations"
    )
    email = models.EmailField()
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    role = models.CharField(
        max_length=50,
        default="BUSINESS_ANALYST"
    )
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = "organization_invitations"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Invite for {self.email} to {self.organization.name} ({self.token})"
