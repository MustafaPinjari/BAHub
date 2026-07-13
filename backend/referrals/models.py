from django.db import models
from django.conf import settings
import uuid
import secrets


class ReferralCode(models.Model):
    """Referral codes for user invitation programs."""
    
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        EXPIRED = 'expired', 'Expired'
        REVOKED = 'revoked', 'Revoked'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='referral_codes'
    )
    code = models.CharField(max_length=20, unique=True, db_index=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )
    credits_earned = models.IntegerField(default=0)
    max_uses = models.IntegerField(default=10)
    uses_count = models.IntegerField(default=0)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'referral_codes'
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['status']),
            models.Index(fields=['user', 'status']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.code}"
    
    @classmethod
    def generate_code(cls, user):
        """Generate a unique referral code for a user."""
        while True:
            code = secrets.token_urlsafe(8).upper()[:12]
            if not cls.objects.filter(code=code).exists():
                return cls.objects.create(user=user, code=code)
    
    def is_valid(self):
        """Check if the referral code is still valid."""
        if self.status != self.Status.ACTIVE:
            return False
        if self.expires_at and self.expires_at < timezone.now():
            return False
        if self.uses_count >= self.max_uses:
            return False
        return True


class Referral(models.Model):
    """Track successful referrals and credit allocations."""
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    referral_code = models.ForeignKey(
        ReferralCode,
        on_delete=models.CASCADE,
        related_name='referrals'
    )
    referred_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_referrals'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    credits_awarded = models.IntegerField(default=0)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'referrals'
        indexes = [
            models.Index(fields=['referral_code', 'status']),
            models.Index(fields=['referred_user']),
        ]
    
    def __str__(self):
        return f"{self.referred_user.username} referred by {self.referral_code.user.username}"
    
    def complete_referral(self, credits=50):
        """Mark referral as completed and award credits."""
        from django.utils import timezone
        self.status = self.Status.COMPLETED
        self.credits_awarded = credits
        self.completed_at = timezone.now()
        self.save()
        
        # Update referral code stats
        self.referral_code.uses_count += 1
        self.referral_code.credits_earned += credits
        self.referral_code.save()
        
        # Award credits to referrer
        from billing.models import TenantSubscription
        subscription = TenantSubscription.objects.filter(
            organization=self.referral_code.user.organization
        ).first()
        if subscription:
            subscription.ai_credits_limit += credits
            subscription.save()
