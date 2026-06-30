from django.db import models
from core.models import BaseModel
from requirements.models import Requirement

class UserStory(BaseModel):
    """
    User Story model capturing Agile specifications.
    Traces back to a parent Requirement and sequentially increments IDs (e.g. US-001) per project.
    """
    STATUS_CHOICES = [
        ("TODO", "To Do"),
        ("IN_PROGRESS", "In Progress"),
        ("QA", "Ready for QA"),
        ("DONE", "Done"),
    ]

    POINTS_CHOICES = [
        (1, "1 Point"),
        (2, "2 Points"),
        (3, "3 Points"),
        (5, "5 Points"),
        (8, "8 Points"),
        (13, "13 Points"),
    ]

    requirement = models.ForeignKey(
        Requirement,
        on_delete=models.CASCADE,
        related_name="user_stories"
    )
    story_id = models.CharField(max_length=50, blank=True)
    title = models.CharField(max_length=255)
    role = models.CharField(max_length=255)       # As a...
    action = models.TextField()                    # I want to...
    benefit = models.TextField()                   # So that...
    acceptance_criteria = models.TextField(blank=True)
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default="TODO"
    )
    points = models.IntegerField(
        choices=POINTS_CHOICES,
        default=3
    )

    class Meta:
        db_table = "user_stories"
        ordering = ["story_id"]
        unique_together = ("requirement", "story_id")

    def save(self, *args, **kwargs):
        if not self.story_id:
            # Count existing user stories in the parent requirement's project boundaries
            count = UserStory.objects.all_with_deleted().filter(
                requirement__project=self.requirement.project
            ).count()
            self.story_id = f"US-{count + 1:03d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.story_id}: {self.title} (Parent: {self.requirement.req_id})"
