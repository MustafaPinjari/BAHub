from django.db import models
from core.models import BaseModel
from organizations.models import Organization
from django.conf import settings

class Team(BaseModel):
    """
    Team model representing groups of users collaborating on projects within an organization.
    """
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="teams"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    lead = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="led_teams"
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="teams_joined",
        blank=True
    )

    class Meta:
        db_table = "teams"
        ordering = ["name"]
        unique_together = ("organization", "name")

    def __str__(self):
        return f"{self.name} ({self.organization.name})"
