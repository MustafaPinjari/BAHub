from django.db import models
from django.conf import settings
from core.models import BaseModel
from projects.models import Project
from stakeholders.models import Stakeholder
from requirements.models import Requirement
from stories.models import UserStory
from risks.models import Risk, ChangeRequest
from meetings.models import Meeting

class Diagram(BaseModel):
    """
    Core Diagram model. Stores the current canvas representation (nodes/edges) as JSON
    and holds locking information for collaborative control.
    """
    STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("REVIEW", "In Review"),
        ("APPROVED", "Approved"),
        ("ARCHIVED", "Archived"),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="diagrams"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    diagram_type = models.CharField(max_length=100)  # e.g., "BPMN", "USE_CASE", "ERD"
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default="DRAFT"
    )
    version = models.CharField(max_length=50, default="1.0")
    canvas_json = models.JSONField(default=dict, blank=True)
    documentation = models.TextField(blank=True, default="")
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="created_diagrams",
        null=True,
        blank=True
    )
    
    # Locking Mechanism for collaboration
    is_locked = models.BooleanField(default=False)
    locked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="locked_diagrams",
        null=True,
        blank=True
    )
    locked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "diagrams"
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.name} ({self.diagram_type}) - {self.project.name}"


class DiagramVersion(BaseModel):
    """
    Stores historical snapshots (checkpoints) of diagrams for full version control history.
    """
    diagram = models.ForeignKey(
        Diagram,
        on_delete=models.CASCADE,
        related_name="versions"
    )
    version = models.CharField(max_length=50)
    canvas_json = models.JSONField(default=dict)
    documentation = models.TextField(blank=True, default="")
    status = models.CharField(max_length=50, default="DRAFT")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="created_diagram_versions",
        null=True,
        blank=True
    )
    checkpoint_name = models.CharField(max_length=255, blank=True, default="")
    change_description = models.TextField(blank=True, default="")

    class Meta:
        db_table = "diagram_versions"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.diagram.name} - v{self.version} ({self.checkpoint_name or 'Auto-save'})"


class DiagramObjectLink(BaseModel):
    """
    Traceability Links between specific shapes (nodes) on the canvas
    and workspace entities (Requirements, Stakeholders, User Stories, etc.).
    """
    diagram = models.ForeignKey(
        Diagram,
        on_delete=models.CASCADE,
        related_name="object_links"
    )
    node_id = models.CharField(max_length=100)  # React Flow node ID
    node_name = models.CharField(max_length=255)
    node_type = models.CharField(max_length=100) # e.g. "Actor", "Database", "Gateway"

    # Mapped core items
    requirement = models.ForeignKey(
        Requirement,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="diagram_links"
    )
    stakeholder = models.ForeignKey(
        Stakeholder,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="diagram_links"
    )
    user_story = models.ForeignKey(
        UserStory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="diagram_links"
    )
    risk = models.ForeignKey(
        Risk,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="diagram_links"
    )
    meeting = models.ForeignKey(
        Meeting,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="diagram_links"
    )
    change_request = models.ForeignKey(
        ChangeRequest,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="diagram_links"
    )
    
    # Text-based mappings for items without separate tables
    task = models.CharField(max_length=255, blank=True, default="")
    business_goal = models.CharField(max_length=255, blank=True, default="")
    business_rule = models.CharField(max_length=255, blank=True, default="")
    acceptance_criteria = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        db_table = "diagram_object_links"
        unique_together = ("diagram", "node_id")

    def __str__(self):
        return f"Link: {self.node_name} in {self.diagram.name}"


class DiagramComment(BaseModel):
    """
    Collaborative comments attached to a diagram or specific nodes.
    Supports nested threads and resolution tracking.
    """
    diagram = models.ForeignKey(
        Diagram,
        on_delete=models.CASCADE,
        related_name="comments"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="diagram_comments"
    )
    text = models.TextField()
    node_id = models.CharField(max_length=100, blank=True, default="")  # Empty if general diagram comment
    
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="replies"
    )
    
    resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resolved_comments"
    )
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "diagram_comments"
        ordering = ["created_at"]

    def __str__(self):
        return f"Comment by {self.user.username} on {self.diagram.name}"


class DiagramApproval(BaseModel):
    """
    Formal sign-offs, reviews, and approval audits for diagram releases.
    """
    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    ]

    diagram = models.ForeignKey(
        Diagram,
        on_delete=models.CASCADE,
        related_name="approvals"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="diagram_approvals"
    )
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default="PENDING"
    )
    comments = models.TextField(blank=True, default="")
    version = models.CharField(max_length=50)

    class Meta:
        db_table = "diagram_approvals"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Approval v{self.version} by {self.user.username} ({self.status})"
