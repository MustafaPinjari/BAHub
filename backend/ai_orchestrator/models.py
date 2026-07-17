from django.db import models
from django.conf import settings

class AIProviderConfig(models.Model):
    provider_name = models.CharField(max_length=50, unique=True, choices=[
        ('OPENAI', 'OpenAI'),
        ('GEMINI', 'Google Gemini'),
        ('CLAUDE', 'Anthropic Claude')
    ])
    api_key = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    priority = models.IntegerField(default=1, help_text="Lower number means higher priority")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.provider_name} Config"

class AIFeatureConfig(models.Model):
    FEATURE_CHOICES = [
        ('GRAMMAR', 'Grammar Fix'),
        ('REWRITE', 'Rewrite'),
        ('CHAT', 'AI Chat'),
        ('REQUIREMENT_EXTRACTION', 'Requirement Extraction'),
        ('ACCEPTANCE_CRITERIA', 'Acceptance Criteria'),
        ('USER_STORIES', 'User Stories'),
        ('UML_DIAGRAM', 'UML Diagram'),
        ('PROCESS_FLOW', 'Process Flow'),
        ('RISK_ANALYSIS', 'Risk Analysis'),
        ('GAP_ANALYSIS', 'Gap Analysis'),
        ('MEETING_ANALYSIS', 'Meeting Analysis'),
        ('PDF_ANALYSIS', 'PDF Analysis'),
        ('BRD_GENERATION', 'BRD Generation'),
        ('FRD_GENERATION', 'FRD Generation'),
        ('IEEE_SRS', 'IEEE SRS Generation'),
        ('LARGE_PDF', 'Large PDF Analysis'),
        ('COMPLEX_LOGIC', 'Complex Business Logic'),
    ]

    feature_name = models.CharField(max_length=100, choices=FEATURE_CHOICES, unique=True)
    credit_cost = models.IntegerField(default=1)
    preferred_model = models.CharField(max_length=100, default="gpt-4o-mini", help_text="Model to route this feature to by default")
    preferred_provider = models.CharField(max_length=50, choices=[
        ('OPENAI', 'OpenAI'),
        ('GEMINI', 'Google Gemini'),
        ('CLAUDE', 'Anthropic Claude'),
        ('AUTO', 'Auto-route (Cheapest/Fastest)')
    ], default='AUTO')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.feature_name} - {self.credit_cost} credits"

class AITransactionLog(models.Model):
    workspace = models.ForeignKey("organizations.Organization", on_delete=models.CASCADE, related_name="ai_logs")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="ai_logs")
    feature = models.CharField(max_length=100)
    provider = models.CharField(max_length=50)
    model = models.CharField(max_length=100)
    input_tokens = models.IntegerField(default=0)
    output_tokens = models.IntegerField(default=0)
    credits_deducted = models.IntegerField(default=0)
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=6, default=0.0, help_text="Estimated cost in USD")
    latency = models.FloatField(default=0.0, help_text="Latency in seconds")
    status = models.CharField(max_length=20, choices=[
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
        ('CACHED', 'Cached')
    ], default='SUCCESS')
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.timestamp}] {self.workspace} - {self.feature} - {self.credits_deducted} credits"
