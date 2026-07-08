from django.db import models
from django.conf import settings
from core.models import BaseModel
from projects.models import Project
from requirements.models import Requirement

class TestCase(BaseModel):
    """
    Test Case model mapping scenario, acceptance criteria, and UAT execution status.
    """
    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("PASSED", "Passed"),
        ("FAILED", "Failed"),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="test_cases"
    )
    requirement = models.ForeignKey(
        Requirement,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="test_cases"
    )
    title = models.CharField(max_length=255)
    scenario = models.TextField(blank=True)
    acceptance_criteria = models.TextField(blank=True)
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default="PENDING"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_test_cases"
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.status})"

class Defect(BaseModel):
    """
    Defect tracker logging bugs found during UAT test case execution.
    """
    SEVERITY_CHOICES = [
        ("LOW", "Low"),
        ("MEDIUM", "Medium"),
        ("HIGH", "High"),
        ("CRITICAL", "Critical"),
    ]

    STATUS_CHOICES = [
        ("OPEN", "Open"),
        ("IN_PROGRESS", "In Progress"),
        ("RESOLVED", "Resolved"),
        ("CLOSED", "Closed"),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="defects"
    )
    test_case = models.ForeignKey(
        TestCase,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="defects"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    severity = models.CharField(
        max_length=50,
        choices=SEVERITY_CHOICES,
        default="MEDIUM"
    )
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default="OPEN"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reported_defects"
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.status} - {self.severity})"
