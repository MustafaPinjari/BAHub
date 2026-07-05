from django.db.models.signals import post_save
from django.dispatch import receiver
from organizations.models import Organization
from .models import TenantSubscription

@receiver(post_save, sender=Organization)
def create_tenant_subscription(sender, instance, created, **kwargs):
    if kwargs.get('raw'):
        return
    if created:
        TenantSubscription.objects.get_or_create(
            organization=instance,
            defaults={
                "plan_tier": "FREE",
                "seats_limit": 5,
                "is_active": True,
                "ai_credits_limit": 100,
                "ai_credits_used": 0
            }
        )
