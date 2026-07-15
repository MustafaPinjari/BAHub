from django.contrib import admin
from .models import TenantSubscription, Payment, ProcessedWebhookEvent, PaymentAuditLog

@admin.register(TenantSubscription)
class TenantSubscriptionAdmin(admin.ModelAdmin):
    list_display = ("organization", "plan_tier", "is_active", "plan_verified", "payment_status", "seats_limit", "expires_at")
    list_filter = ("plan_tier", "is_active", "plan_verified", "payment_status")
    search_fields = ("organization__name", "gateway_customer_id", "gateway_subscription_id")

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("receipt_number", "organization", "plan", "amount", "payment_status", "payment_method", "paid_at")
    list_filter = ("plan", "payment_status", "payment_method")
    search_fields = ("receipt_number", "organization__name", "gateway_payment_id", "gateway_invoice_id", "gateway_order_id")

@admin.register(ProcessedWebhookEvent)
class ProcessedWebhookEventAdmin(admin.ModelAdmin):
    list_display = ("gateway_event_id", "processed_at")
    search_fields = ("gateway_event_id",)

@admin.register(PaymentAuditLog)
class PaymentAuditLogAdmin(admin.ModelAdmin):
    list_display = ("organization", "webhook_event", "old_plan", "new_plan", "event_id", "created_at")
    list_filter = ("webhook_event", "old_plan", "new_plan")
    search_fields = ("organization__name", "event_id", "gateway_response")
