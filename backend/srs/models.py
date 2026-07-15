from django.db import models
from django.conf import settings
from core.models import BaseModel
from projects.models import Project

class SRSDocument(BaseModel):
    """
    Main SRS document model following IEEE 830 structure.
    Contains metadata, status, and project association.
    """
    STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("REVIEW", "In Review"),
        ("APPROVED", "Approved"),
        ("ARCHIVED", "Archived"),
    ]

    TEMPLATE_CHOICES = [
        ("BLANK_IEEE", "Blank IEEE Template"),
        ("AI_GENERATED", "AI Generated"),
        ("IMPORTED_DOCX", "Imported from DOCX"),
        ("IMPORTED_PDF", "Imported from PDF"),
        ("DUPLICATED", "Duplicated from Existing"),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="srs_documents",
        null=True,
        blank=True
    )
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default="DRAFT"
    )
    template_type = models.CharField(
        max_length=50,
        choices=TEMPLATE_CHOICES,
        default="BLANK_IEEE"
    )
    version = models.CharField(max_length=20, default="1.0")
    word_count = models.IntegerField(default=0)
    reading_time_minutes = models.IntegerField(default=0)
    is_ai_generated = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="srs_documents",
        null=True,
        blank=True
    )
    last_modified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="modified_srs_documents",
        null=True,
        blank=True
    )

    class Meta:
        db_table = "srs_documents"
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.title} (v{self.version})"


class SRSSection(BaseModel):
    """
    Individual sections of an SRS document.
    Supports hierarchical structure and collapsible sections.
    """
    SECTION_CHOICES = [
        ("INTRODUCTION", "1 Introduction"),
        ("INTRODUCTION_PURPOSE", "1.1 Purpose"),
        ("INTRODUCTION_SCOPE", "1.2 Scope"),
        ("INTRODUCTION_AUDIENCE", "1.3 Intended Audience"),
        ("INTRODUCTION_DEFINITIONS", "1.4 Definitions"),
        ("INTRODUCTION_REFERENCES", "1.5 References"),
        ("INTRODUCTION_OVERVIEW", "1.6 Document Overview"),
        ("OVERALL_DESCRIPTION", "2 Overall Description"),
        ("OVERALL_PERSPECTIVE", "2.1 Product Perspective"),
        ("OVERALL_FUNCTIONS", "2.2 Product Functions"),
        ("OVERALL_USERS", "2.3 User Classes"),
        ("OVERALL_ENVIRONMENT", "2.4 Operating Environment"),
        ("OVERALL_CONSTRAINTS", "2.5 Constraints"),
        ("OVERALL_ASSUMPTIONS", "2.6 Assumptions"),
        ("EXTERNAL_INTERFACE", "3 External Interface Requirements"),
        ("EXTERNAL_UI", "3.1 User Interface"),
        ("EXTERNAL_HARDWARE", "3.2 Hardware Interface"),
        ("EXTERNAL_SOFTWARE", "3.3 Software Interface"),
        ("EXTERNAL_COMMUNICATION", "3.4 Communication Interface"),
        ("SYSTEM_FEATURES", "4 System Features"),
        ("FUNCTIONAL_REQUIREMENTS", "5 Functional Requirements"),
        ("NON_FUNCTIONAL_REQUIREMENTS", "6 Non Functional Requirements"),
        ("DATABASE_REQUIREMENTS", "7 Database Requirements"),
        ("DATA_DICTIONARY", "8 Data Dictionary"),
        ("USE_CASES", "9 Use Cases"),
        ("ACTIVITY_DIAGRAMS", "10 Activity Diagrams"),
        ("SEQUENCE_DIAGRAMS", "11 Sequence Diagrams"),
        ("CLASS_DIAGRAM", "12 Class Diagram"),
        ("ER_DIAGRAM", "13 ER Diagram"),
        ("STATE_DIAGRAM", "14 State Diagram"),
        ("SYSTEM_ARCHITECTURE", "15 System Architecture"),
        ("PERFORMANCE_REQUIREMENTS", "16 Performance Requirements"),
        ("SECURITY_REQUIREMENTS", "17 Security Requirements"),
        ("RISK_ANALYSIS", "18 Risk Analysis"),
        ("FUTURE_ENHANCEMENTS", "19 Future Enhancements"),
        ("APPENDIX", "20 Appendix"),
        ("BIBLIOGRAPHY", "21 Bibliography"),
        ("CUSTOM", "Custom Section"),
    ]

    document = models.ForeignKey(
        SRSDocument,
        on_delete=models.CASCADE,
        related_name="sections"
    )
    parent_section = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        related_name="child_sections",
        null=True,
        blank=True
    )
    section_type = models.CharField(
        max_length=100,
        choices=SECTION_CHOICES,
        default="CUSTOM"
    )
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    is_collapsed = models.BooleanField(default=False)
    is_locked = models.BooleanField(default=False)
    linked_diagram = models.ForeignKey(
        "diagrams.Diagram",
        on_delete=models.SET_NULL,
        related_name="srs_sections",
        null=True,
        blank=True
    )

    class Meta:
        db_table = "srs_sections"
        ordering = ["order"]

    def __str__(self):
        return f"{self.document.title} - {self.title}"


class SRSVersion(BaseModel):
    """
    Version history for SRS documents.
    Stores snapshots for restore and compare functionality.
    """
    document = models.ForeignKey(
        SRSDocument,
        on_delete=models.CASCADE,
        related_name="versions"
    )
    version_number = models.CharField(max_length=20)
    change_summary = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="srs_versions",
        null=True,
        blank=True
    )
    snapshot_data = models.JSONField(default=dict)

    class Meta:
        db_table = "srs_versions"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.document.title} - v{self.version_number}"


class SRSComment(BaseModel):
    """
    Comments and suggestions on SRS documents and sections.
    Supports collaboration and approval workflow.
    """
    document = models.ForeignKey(
        SRSDocument,
        on_delete=models.CASCADE,
        related_name="comments",
        null=True,
        blank=True
    )
    section = models.ForeignKey(
        SRSSection,
        on_delete=models.CASCADE,
        related_name="comments",
        null=True,
        blank=True
    )
    parent_comment = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        related_name="replies",
        null=True,
        blank=True
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="srs_comments",
        null=True,
        blank=True
    )
    content = models.TextField()
    is_resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="resolved_srs_comments",
        null=True,
        blank=True
    )
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "srs_comments"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Comment by {self.author.username if self.author else 'Unknown'}"


class SRSApproval(BaseModel):
    """
    Approval workflow for SRS documents.
    Tracks reviewer assignments and approval status.
    """
    STATUS_CHOICES = [
        ("PENDING", "Pending Review"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
        ("CHANGES_REQUESTED", "Changes Requested"),
    ]

    document = models.ForeignKey(
        SRSDocument,
        on_delete=models.CASCADE,
        related_name="approvals"
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="srs_approvals",
        null=True,
        blank=True
    )
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default="PENDING"
    )
    comments = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "srs_approvals"
        unique_together = ("document", "reviewer")

    def __str__(self):
        return f"{self.document.title} - {self.reviewer.username if self.reviewer else 'Unknown'}"


class SRSExport(BaseModel):
    """
    Export history for SRS documents.
    Tracks exports to different formats.
    """
    FORMAT_CHOICES = [
        ("PDF", "PDF"),
        ("DOCX", "DOCX"),
        ("MARKDOWN", "Markdown"),
        ("HTML", "HTML"),
        ("JSON", "JSON"),
    ]

    document = models.ForeignKey(
        SRSDocument,
        on_delete=models.CASCADE,
        related_name="exports"
    )
    format = models.CharField(
        max_length=50,
        choices=FORMAT_CHOICES
    )
    exported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="srs_exports",
        null=True,
        blank=True
    )
    file_path = models.CharField(max_length=512, blank=True)
    file_size = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = "srs_exports"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.document.title} - {self.format}"


class SRSImport(BaseModel):
    """
    Import history for SRS documents.
    Tracks imports from external files.
    """
    FORMAT_CHOICES = [
        ("DOCX", "DOCX"),
        ("MARKDOWN", "Markdown"),
        ("PDF", "PDF"),
        ("IEEE_SRS", "Existing IEEE SRS"),
    ]

    document = models.ForeignKey(
        SRSDocument,
        on_delete=models.CASCADE,
        related_name="imports"
    )
    format = models.CharField(
        max_length=50,
        choices=FORMAT_CHOICES
    )
    imported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="srs_imports",
        null=True,
        blank=True
    )
    original_filename = models.CharField(max_length=255)
    file_path = models.CharField(max_length=512, blank=True)
    import_status = models.CharField(
        max_length=50,
        default="SUCCESS"
    )
    error_message = models.TextField(blank=True)

    class Meta:
        db_table = "srs_imports"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.document.title} - Imported from {self.original_filename}"


class AIGenerationHistory(BaseModel):
    """
    History of AI generation operations for SRS documents.
    Tracks what was generated and from what source.
    """
    GENERATION_TYPE_CHOICES = [
        ("FULL_SRS", "Full IEEE SRS"),
        ("FUNCTIONAL_REQUIREMENTS", "Functional Requirements Only"),
        ("NON_FUNCTIONAL_REQUIREMENTS", "Non Functional Requirements Only"),
        ("USE_CASES", "Use Cases"),
        ("ACCEPTANCE_CRITERIA", "Acceptance Criteria"),
        ("DATABASE_DESIGN", "Database Design"),
        ("DATA_DICTIONARY", "Data Dictionary"),
        ("UML_DESCRIPTIONS", "UML Descriptions"),
        ("RISKS", "Risks"),
        ("FUTURE_SCOPE", "Future Scope"),
    ]

    SOURCE_TYPE_CHOICES = [
        ("MEETING_NOTES", "Meeting Notes"),
        ("PROJECT_DESCRIPTION", "Project Description"),
        ("BRD", "BRD"),
        ("FRD", "FRD"),
        ("USER_STORIES", "User Stories"),
        ("REQUIREMENTS", "Requirements"),
        ("UPLOADED_DOCUMENTS", "Uploaded Documents"),
        ("PROMPT", "Custom Prompt"),
    ]

    document = models.ForeignKey(
        SRSDocument,
        on_delete=models.CASCADE,
        related_name="ai_generations",
        null=True,
        blank=True
    )
    generation_type = models.CharField(
        max_length=100,
        choices=GENERATION_TYPE_CHOICES
    )
    source_type = models.CharField(
        max_length=100,
        choices=SOURCE_TYPE_CHOICES
    )
    source_id = models.CharField(max_length=255, blank=True)  # ID of source entity
    prompt = models.TextField(blank=True)
    generated_content = models.TextField(blank=True)
    ai_credits_used = models.IntegerField(default=0)
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="ai_generations",
        null=True,
        blank=True
    )

    class Meta:
        db_table = "ai_generation_history"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.generation_type} from {self.source_type}"
