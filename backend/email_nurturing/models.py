from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from core.models import BaseModel

User = get_user_model()


class EmailTemplate(BaseModel):
    """Email templates for automated campaigns."""
    TEMPLATE_TYPES = [
        ("WELCOME", "Welcome Series"),
        ("ONBOARDING", "Onboarding"),
        ("FEATURE_ANNOUNCEMENT", "Feature Announcement"),
        ("NEWSLETTER", "Newsletter"),
        ("RE_ENGAGEMENT", "Re-engagement"),
        ("PROMOTIONAL", "Promotional"),
    ]

    name = models.CharField(max_length=255)
    template_type = models.CharField(max_length=50, choices=TEMPLATE_TYPES)
    subject = models.CharField(max_length=255)
    html_content = models.TextField()
    text_content = models.TextField(blank=True)
    variables = models.JSONField(default=dict, help_text="Available template variables")
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "email_templates"
        ordering = ["name"]

    def __str__(self):
        return self.name


class EmailCampaign(BaseModel):
    """Email campaigns for user nurturing."""
    STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("SCHEDULED", "Scheduled"),
        ("SENDING", "Sending"),
        ("COMPLETED", "Completed"),
        ("PAUSED", "Paused"),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    template = models.ForeignKey(EmailTemplate, on_delete=models.CASCADE, related_name="campaigns")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="DRAFT")
    scheduled_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    target_segment = models.CharField(max_length=100, blank=True, help_text="User segment to target")
    total_recipients = models.IntegerField(default=0)
    sent_count = models.IntegerField(default=0)
    opened_count = models.IntegerField(default=0)
    clicked_count = models.IntegerField(default=0)

    class Meta:
        db_table = "email_campaigns"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class EmailEvent(BaseModel):
    """Track email events (sent, opened, clicked, etc.)."""
    EVENT_TYPES = [
        ("SENT", "Sent"),
        ("DELIVERED", "Delivered"),
        ("OPENED", "Opened"),
        ("CLICKED", "Clicked"),
        ("BOUNCED", "Bounced"),
        ("UNSUBSCRIBED", "Unsubscribed"),
        ("COMPLAINED", "Complained"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="email_events")
    campaign = models.ForeignKey(EmailCampaign, on_delete=models.CASCADE, related_name="events", null=True)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    email_address = models.EmailField()
    metadata = models.JSONField(default=dict, blank=True)
    occurred_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "email_events"
        ordering = ["-occurred_at"]
        indexes = [
            models.Index(fields=["user", "event_type"]),
            models.Index(fields=["campaign", "event_type"]),
        ]

    def __str__(self):
        return f"{self.event_type} - {self.email_address}"


class EmailList(BaseModel):
    """Email lists for segmentation."""
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    users = models.ManyToManyField(User, blank=True, related_name="email_lists")
    is_active = models.BooleanField(default=True)
    subscriber_count = models.IntegerField(default=0)

    class Meta:
        db_table = "email_lists"
        ordering = ["name"]

    def __str__(self):
        return self.name

    def update_subscriber_count(self):
        self.subscriber_count = self.users.count()
        self.save(update_fields=["subscriber_count"])


class Unsubscribe(BaseModel):
    """Track unsubscribe requests."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="unsubscribes", null=True)
    email_address = models.EmailField()
    campaign = models.ForeignKey(EmailCampaign, on_delete=models.SET_NULL, null=True, related_name="unsubscribes")
    reason = models.TextField(blank=True)
    unsubscribed_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "unsubscribes"
        ordering = ["-unsubscribed_at"]

    def __str__(self):
        return f"{self.email_address} - {self.unsubscribed_at}"


class EmailPreference(BaseModel):
    """User email preferences."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="email_preferences")
    marketing_emails = models.BooleanField(default=True)
    product_updates = models.BooleanField(default=True)
    newsletter = models.BooleanField(default=True)
    onboarding_emails = models.BooleanField(default=True)
    weekly_digest = models.BooleanField(default=False)

    class Meta:
        db_table = "email_preferences"

    def __str__(self):
        return f"Preferences for {self.user.email}"
