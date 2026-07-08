from django.db import models
from core.models import BaseModel

class TenantSubscription(BaseModel):
    PLAN_CHOICES = [
        ("FREE", "Free Tier"),
        ("PRO", "Pro Tier"),
        ("ENTERPRISE", "Enterprise Tier"),
    ]

    STATUS_CHOICES = [
        ("PENDING", "Pending Payment"),
        ("PROCESSING", "Processing Payment"),
        ("SUCCESS", "Active / Paid"),
        ("FAILED", "Payment Failed"),
        ("CANCELLED", "Subscription Cancelled"),
        ("REFUNDED", "Subscription Refunded"),
        ("EXPIRED", "Subscription Expired"),
        ("DISPUTED", "Subscription Disputed"),
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
    
    # Expiry & billing states
    expires_at = models.DateTimeField(null=True, blank=True)
    payment_status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default="SUCCESS"
    )

    class Meta:
        db_table = "tenant_subscriptions"

    def __str__(self):
        return f"{self.organization.name} - {self.plan_tier}"


class Payment(BaseModel):
    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("PROCESSING", "Processing"),
        ("SUCCESS", "Success"),
        ("FAILED", "Failed"),
        ("CANCELLED", "Cancelled"),
        ("REFUNDED", "Refunded"),
        ("EXPIRED", "Expired"),
        ("DISPUTED", "Disputed"),
    ]

    receipt_number = models.CharField(max_length=100, unique=True)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="payments"
    )
    subscription = models.ForeignKey(
        TenantSubscription,
        on_delete=models.CASCADE,
        related_name="payments"
    )
    stripe_payment_intent = models.CharField(max_length=255, blank=True, null=True)
    stripe_invoice = models.CharField(max_length=255, blank=True, null=True)
    checkout_session = models.CharField(max_length=255, blank=True, null=True)
    transaction_id = models.CharField(max_length=255, blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default="USD")
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    gst = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    coupon = models.CharField(max_length=100, blank=True, null=True)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    plan = models.CharField(max_length=50)
    billing_cycle = models.CharField(max_length=50, default="monthly")
    payment_method = models.CharField(max_length=100, blank=True, null=True)
    gateway = models.CharField(max_length=50, default="STRIPE")
    payment_status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="PENDING")
    paid_at = models.DateTimeField(null=True, blank=True)
    invoice_pdf = models.FileField(upload_to="invoices/", null=True, blank=True)

    class Meta:
        db_table = "tenant_payments"

    def __str__(self):
        return f"{self.receipt_number} - {self.organization.name} - ${self.amount}"


class ProcessedWebhookEvent(BaseModel):
    stripe_event_id = models.CharField(max_length=255, unique=True)
    processed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "processed_webhook_events"

    def __str__(self):
        return self.stripe_event_id


class PaymentAuditLog(BaseModel):
    ip_address = models.CharField(max_length=100, blank=True, null=True)
    browser = models.CharField(max_length=255, blank=True, null=True)
    user = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    webhook_event = models.CharField(max_length=255, blank=True, null=True)
    old_plan = models.CharField(max_length=50, blank=True, null=True)
    new_plan = models.CharField(max_length=50, blank=True, null=True)
    gateway_response = models.TextField(blank=True, null=True)
    event_id = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = "payment_audit_logs"

    def __str__(self):
        return f"{self.webhook_event} - {self.organization.name if self.organization else 'N/A'}"
