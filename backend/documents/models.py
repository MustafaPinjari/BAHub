from django.db import models
from core.models import BaseModel
from projects.models import Project
from django.conf import settings

class BusinessDocument(BaseModel):
    """
    Business Document model representing BRD/FRD documents.
    Captures version, approval, and official sign-off states.
    """
    TYPE_CHOICES = [
        ("BRD", "Business Requirements Document"),
        ("FRD", "Functional Requirements Document"),
    ]

    STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("REVIEW", "Under Review"),
        ("APPROVED", "Approved"),
        ("SIGNED_OFF", "Signed Off"),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="business_documents"
    )
    doc_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default="BRD"
    )
    title = models.CharField(max_length=255)
    version = models.CharField(max_length=20, default="1.0")
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default="DRAFT"
    )
    content = models.TextField()
    confluence_page_id = models.CharField(max_length=100, blank=True, null=True)
    confluence_page_url = models.URLField(max_length=512, blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="created_documents",
        null=True
    )
    signed_off_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="signed_documents",
        null=True,
        blank=True
    )
    signed_off_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "business_documents"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.doc_type} - {self.title} ({self.project.name})"
