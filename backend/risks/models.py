from django.db import models
from core.models import BaseModel
from projects.models import Project
from django.conf import settings

class Risk(BaseModel):
    """
    Risk model representing identified project risks, probabilities, and mitigation steps.
    """
    LEVEL_CHOICES = [
        ("HIGH", "High"),
        ("MEDIUM", "Medium"),
        ("LOW", "Low"),
    ]

    STATUS_CHOICES = [
        ("IDENTIFIED", "Identified"),
        ("MITIGATED", "Mitigated"),
        ("OCCURRED", "Occurred"),
        ("CLOSED", "Closed"),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="risks"
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    probability = models.CharField(
        max_length=50,
        choices=LEVEL_CHOICES,
        default="MEDIUM"
    )
    impact = models.CharField(
        max_length=50,
        choices=LEVEL_CHOICES,
        default="MEDIUM"
    )
    mitigation = models.TextField()
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default="IDENTIFIED"
    )

    class Meta:
        db_table = "risks"
        ordering = ["-probability", "-impact"]

    def __str__(self):
        return f"{self.title} (Status: {self.status})"


class ChangeRequest(BaseModel):
    """
    Change Request model tracking scope changes and approval reviews.
    """
    STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("REVIEW", "Under Review"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="change_requests"
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    reason = models.TextField()
    impact_analysis = models.TextField()
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default="DRAFT"
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="requested_changes",
        null=True
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="reviewed_changes",
        null=True,
        blank=True
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "change_requests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"CR: {self.title} (Status: {self.status})"
