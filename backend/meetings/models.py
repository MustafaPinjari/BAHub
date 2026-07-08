from django.db import models
from core.models import BaseModel
from projects.models import Project
from django.conf import settings

class Meeting(BaseModel):
    """
    Meeting model documenting scheduled discussions and Minutes of Meeting (MoM).
    """
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="meetings"
    )
    title = models.CharField(max_length=255)
    date = models.DateField()
    time = models.TimeField()
    objective = models.TextField()
    notes = models.TextField(blank=True)  # Minutes of Meeting (MoM)
    attendees = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="attended_meetings",
        blank=True
    )
    stakeholder_attendees = models.ManyToManyField(
        "stakeholders.Stakeholder",
        related_name="meetings",
        blank=True
    )

    class Meta:
        db_table = "meetings"
        ordering = ["-date", "-time"]

    def __str__(self):
        return f"{self.title} ({self.date})"


class ActionItem(BaseModel):
    """
    Action items tasks spawned from a Meeting.
    """
    STATUS_CHOICES = [
        ("OPEN", "Open"),
        ("IN_PROGRESS", "In Progress"),
        ("COMPLETED", "Completed"),
    ]

    meeting = models.ForeignKey(
        Meeting,
        on_delete=models.CASCADE,
        related_name="action_items"
    )
    description = models.TextField()
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="assigned_action_items",
        null=True,
        blank=True
    )
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default="OPEN"
    )

    class Meta:
        db_table = "action_items"
        ordering = ["due_date", "id"]

    def __str__(self):
        return f"Task: {self.description[:40]}... (Assignee: {self.assignee})"
