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

class ProjectAttachment(BaseModel):
    """
    Project-associated related documents and specifications files.
    """
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="attachments"
    )
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to="project_attachments/")
    size_str = models.CharField(max_length=50, blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="uploaded_attachments"
    )

    class Meta:
        db_table = "project_attachments"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.project.name})"

class ActivityLog(BaseModel):
    """
    Project activity log auditing changes in requirements, stories, and uploads.
    """
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="activities"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="activities"
    )
    action = models.CharField(max_length=255)

    class Meta:
        db_table = "activity_logs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} - {self.action} ({self.project.name})"

def log_activity(project, user, action_message):
    try:
        ActivityLog.objects.create(
            project=project,
            user=user,
            action=action_message
        )
    except Exception as e:
        import logging
        logger = logging.getLogger("django")
        logger.warning(f"Failed to log activity: {e}")
