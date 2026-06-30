from django.db import models
from core.models import BaseModel
from projects.models import Project
from stakeholders.models import Stakeholder
from django.conf import settings

class Requirement(BaseModel):
    """
    Requirement model capturing functional, non-functional, or technical specifications.
    Includes auto-incrementing IDs per project and source stakeholder traceability links.
    """
    TYPE_CHOICES = [
        ("FUNCTIONAL", "Functional Requirement"),
        ("NON_FUNCTIONAL", "Non-Functional Requirement"),
        ("TECHNICAL", "Technical Requirement"),
        ("UI", "User Interface"),
    ]

    STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("REVIEW", "In Review"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    ]

    PRIORITY_CHOICES = [
        ("HIGH", "High"),
        ("MEDIUM", "Medium"),
        ("LOW", "Low"),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="requirements"
    )
    req_id = models.CharField(max_length=50, blank=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    req_type = models.CharField(
        max_length=50,
        choices=TYPE_CHOICES,
        default="FUNCTIONAL"
    )
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default="DRAFT"
    )
    priority = models.CharField(
        max_length=50,
        choices=PRIORITY_CHOICES,
        default="MEDIUM"
    )
    version = models.CharField(max_length=20, default="1.0")
    source_stakeholder = models.ForeignKey(
        Stakeholder,
        on_delete=models.SET_NULL,
        related_name="submitted_requirements",
        null=True,
        blank=True
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="created_requirements",
        null=True,
        blank=True
    )

    class Meta:
        db_table = "requirements"
        ordering = ["req_id"]
        unique_together = ("project", "req_id")

    def save(self, *args, **kwargs):
        if not self.req_id:
            # Count existing records in the project, including soft-deleted ones, to guarantee unique IDs
            count = Requirement.objects.all_with_deleted().filter(project=self.project).count()
            self.req_id = f"REQ-{count + 1:03d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.req_id}: {self.title} ({self.project.name})"
