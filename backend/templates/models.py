from django.db import models
from django.conf import settings
import uuid


class Template(models.Model):
    """Public templates for sharing and discovering project templates."""
    
    class Category(models.TextChoices):
        BRD = 'brd', 'Business Requirements'
        FRD = 'frd', 'Functional Requirements'
        UML = 'uml', 'UML Diagrams'
        BPMN = 'bpmn', 'BPMN Processes'
        SWOT = 'swot', 'SWOT Analysis'
        GAP = 'gap', 'Gap Analysis'
        RISK = 'risk', 'Risk Management'
        AGILE = 'agile', 'Agile/Scrum'
        COMPLIANCE = 'compliance', 'Compliance'
    
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        PUBLISHED = 'published', 'Published'
        ARCHIVED = 'archived', 'Archived'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=Category.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    
    # Template content (JSON structure)
    content = models.JSONField(default=dict)
    
    # Usage statistics
    views_count = models.IntegerField(default=0)
    uses_count = models.IntegerField(default=0)
    forks_count = models.IntegerField(default=0)
    
    # Creator information
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_templates'
    )
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='templates'
    )
    
    # Metadata
    tags = models.JSONField(default=list, blank=True)
    difficulty = models.CharField(
        max_length=20,
        choices=[('beginner', 'Beginner'), ('intermediate', 'Intermediate'), ('advanced', 'Advanced')],
        default='intermediate'
    )
    estimated_time = models.CharField(max_length=50, blank=True, help_text="e.g., '2 hours', '1 day'")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'templates'
        ordering = ['-views_count', '-uses_count', '-created_at']
        indexes = [
            models.Index(fields=['category', 'status']),
            models.Index(fields=['status', '-views_count']),
            models.Index(fields=['created_by']),
            models.Index(fields=['tags']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"
    
    def increment_views(self):
        """Increment view counter."""
        self.views_count += 1
        self.save(update_fields=['views_count'])
    
    def increment_uses(self):
        """Increment usage counter."""
        self.uses_count += 1
        self.save(update_fields=['uses_count'])


class TemplateReview(models.Model):
    """Reviews and ratings for templates."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(
        Template,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='template_reviews'
    )
    rating = models.IntegerField(choices=[(i, str(i)) for i in range(1, 6)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'template_reviews'
        unique_together = ['template', 'user']
        indexes = [
            models.Index(fields=['template', '-rating']),
            models.Index(fields=['user']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.template.name} ({self.rating}★)"
