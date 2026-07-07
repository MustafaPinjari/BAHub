from django.db import models
from django.conf import settings
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


class AIJob(BaseModel):
    """
    Model representing asynchronous AI processing requests.
    """
    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("PROCESSING", "Processing"),
        ("SUCCESS", "Success"),
        ("FAILED", "Failed"),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="ai_jobs"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ai_jobs"
    )
    job_type = models.CharField(max_length=100)
    prompt = models.TextField()
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default="PENDING"
    )
    result = models.TextField(blank=True, default="")
    error_message = models.TextField(blank=True, default="")

    class Meta:
        db_table = "ai_jobs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"AI Job {self.id} - Type: {self.job_type} ({self.status})"


class KnowledgeNode(BaseModel):
    """
    Model representing a node in the Project Knowledge Graph.
    Can be a structured item (e.g. Requirement) or a general artifact (e.g. API model).
    """
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="knowledge_nodes"
    )
    node_key = models.CharField(max_length=100)  # e.g., "REQ-001", "US-005", "API-002", "DB-001"
    title = models.CharField(max_length=255)
    node_type = models.CharField(max_length=100)  # "Meeting", "Requirement", "UserStory", "BPMN", "API", "Database", "TestCase", "Risk", "UIScreen"
    content = models.TextField(blank=True, default="")  # Stored JSON schema or raw Markdown
    status = models.CharField(max_length=50, default="DRAFT")
    meta_data = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "knowledge_nodes"
        unique_together = ("project", "node_key")

    def __str__(self):
        return f"[{self.node_type}] {self.node_key}: {self.title}"


class KnowledgeEdge(BaseModel):
    """
    Model representing a connection between two nodes in the Project Knowledge Graph.
    """
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="knowledge_edges"
    )
    source = models.ForeignKey(
        KnowledgeNode,
        on_delete=models.CASCADE,
        related_name="outgoing_edges"
    )
    target = models.ForeignKey(
        KnowledgeNode,
        on_delete=models.CASCADE,
        related_name="incoming_edges"
    )
    relation_type = models.CharField(max_length=100, default="relates_to")

    class Meta:
        db_table = "knowledge_edges"
        unique_together = ("project", "source", "target", "relation_type")

    def __str__(self):
        return f"{self.source.node_key} → {self.target.node_key} ({self.relation_type})"


class WorkflowExecution(BaseModel):
    """
    Model documenting the live progress and output details of multi-agent pipeline runs.
    """
    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("RUNNING", "Running"),
        ("SUCCESS", "Success"),
        ("FAILED", "Failed"),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="workflow_executions"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workflow_executions"
    )
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default="PENDING"
    )
    current_step = models.CharField(max_length=100, blank=True, default="")
    input_data = models.TextField()
    steps_progress = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = "workflow_executions"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Workflow {self.id} for {self.project.name} ({self.status})"

