from django.db import models
from core.models import BaseModel
from projects.models import Project

class SWOTAnalysis(models.Model):
    """
    SWOTAnalysis model capturing project Strengths, Weaknesses, Opportunities, and Threats.
    Each project has at most one SWOT analysis grid.
    """
    project = models.OneToOneField(
        Project,
        on_delete=models.CASCADE,
        related_name="swot_analysis"
    )
    strengths = models.TextField(blank=True, default="")
    weaknesses = models.TextField(blank=True, default="")
    opportunities = models.TextField(blank=True, default="")
    threats = models.TextField(blank=True, default="")

    class Meta:
        db_table = "swot_analyses"
        verbose_name = "SWOT Analysis"
        verbose_name_plural = "SWOT Analyses"

    def __str__(self):
        return f"SWOT for {self.project.name}"


class GapAnalysis(BaseModel):
    """
    GapAnalysis model tracing current vs. future state and bridge action plans.
    """
    STATUS_CHOICES = [
        ("IDENTIFIED", "Identified"),
        ("IN_PROGRESS", "In Progress"),
        ("RESOLVED", "Resolved"),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="gap_analyses"
    )
    title = models.CharField(max_length=255)
    current_state = models.TextField()
    future_state = models.TextField()
    gap_description = models.TextField()
    action_plan = models.TextField()
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default="IDENTIFIED"
    )

    class Meta:
        db_table = "gap_analyses"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Gap: {self.title} (Status: {self.status})"
