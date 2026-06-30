from django.db import models
from core.models import BaseModel
from organizations.models import Organization
from django.conf import settings

class Project(BaseModel):
    """
    Project model scoped within an Organization, representing a collaboration environment.
    """
    STATUS_CHOICES = [
        ("ACTIVE", "Active"),
        ("COMPLETED", "Completed"),
        ("ARCHIVED", "Archived"),
    ]

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="projects"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default="ACTIVE"
    )
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "projects"
        ordering = ["-created_at"]
        unique_together = ("organization", "name")

    def __str__(self):
        return f"{self.name} ({self.organization.name})"

class ProjectMember(BaseModel):
    """
    Junction model mapping Users to Projects, defining project-specific workspace roles.
    """
    ROLE_CHOICES = [
        ("PROJECT_MANAGER", "Project Manager"),
        ("CONTRIBUTOR", "Contributor"),
        ("VIEWER", "Viewer"),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="project_members"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_assignments"
    )
    role = models.CharField(
        max_length=50,
        choices=ROLE_CHOICES,
        default="CONTRIBUTOR"
    )

    class Meta:
        db_table = "project_members"
        unique_together = ("project", "user")

    def __str__(self):
        return f"{self.user.username} - {self.project.name} ({self.get_role_display()})"
