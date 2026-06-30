from django.db import models
from core.models import BaseModel
from organizations.models import Organization
from projects.models import Project

class Stakeholder(BaseModel):
    """
    Stakeholder model tracking profiles, departments, contact info, and Power/Interest matrix scores.
    """
    POWER_CHOICES = [
        ("HIGH", "High"),
        ("LOW", "Low"),
    ]
    
    INTEREST_CHOICES = [
        ("HIGH", "High"),
        ("LOW", "Low"),
    ]

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="stakeholders"
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="stakeholders",
        null=True,
        blank=True
    )
    name = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    department = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    power = models.CharField(
        max_length=50,
        choices=POWER_CHOICES,
        default="LOW"
    )
    interest = models.CharField(
        max_length=50,
        choices=INTEREST_CHOICES,
        default="LOW"
    )
    influence = models.IntegerField(default=3)  # 1 to 5
    impact = models.IntegerField(default=3)     # 1 to 5
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "stakeholders"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} - {self.title} ({self.organization.name})"
