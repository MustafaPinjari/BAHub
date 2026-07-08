from django.db import models
from core.models import BaseModel

class TenantSubscription(BaseModel):
    PLAN_CHOICES = [
        ("FREE", "Free Tier"),
        ("PRO", "Pro Tier"),
        ("ENTERPRISE", "Enterprise Tier"),
    ]

    organization = models.OneToOneField(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="subscription"
    )
    stripe_customer_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_subscription_id = models.CharField(max_length=255, blank=True, null=True)
    plan_tier = models.CharField(
        max_length=50,
        choices=PLAN_CHOICES,
        default="FREE"
    )
    seats_limit = models.IntegerField(default=5) # 5 users limit for FREE tier
    is_active = models.BooleanField(default=True)
    plan_verified = models.BooleanField(default=True)
    verification_token = models.UUIDField(null=True, blank=True)
    ai_credits_used = models.IntegerField(default=0)
    ai_credits_limit = models.IntegerField(default=100)

    class Meta:
        db_table = "tenant_subscriptions"

    def __str__(self):
        return f"{self.organization.name} - {self.plan_tier}"
