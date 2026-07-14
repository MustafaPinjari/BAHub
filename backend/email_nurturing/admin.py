from django.contrib import admin
from .models import EmailTemplate, EmailCampaign, EmailEvent, EmailList, Unsubscribe, EmailPreference


@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ["name", "template_type", "subject", "is_active"]
    list_filter = ["template_type", "is_active"]
    search_fields = ["name", "subject"]
    readonly_fields = ["variables"]


@admin.register(EmailCampaign)
class EmailCampaignAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "template",
        "status",
        "scheduled_at",
        "sent_at",
        "total_recipients",
        "sent_count",
        "opened_count",
        "clicked_count",
    ]
    list_filter = ["status", "template", "scheduled_at"]
    search_fields = ["name", "description"]
    date_hierarchy = "scheduled_at"
    readonly_fields = ["sent_count", "opened_count", "clicked_count"]


@admin.register(EmailEvent)
class EmailEventAdmin(admin.ModelAdmin):
    list_display = ["user", "email_address", "event_type", "campaign", "occurred_at"]
    list_filter = ["event_type", "campaign", "occurred_at"]
    search_fields = ["user__email", "email_address"]
    date_hierarchy = "occurred_at"
    readonly_fields = ["occurred_at"]


@admin.register(EmailList)
class EmailListAdmin(admin.ModelAdmin):
    list_display = ["name", "subscriber_count", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["name", "description"]
    filter_horizontal = ["users"]


@admin.register(Unsubscribe)
class UnsubscribeAdmin(admin.ModelAdmin):
    list_display = ["email_address", "user", "campaign", "unsubscribed_at"]
    list_filter = ["campaign", "unsubscribed_at"]
    search_fields = ["email_address", "user__email"]
    date_hierarchy = "unsubscribed_at"
    readonly_fields = ["unsubscribed_at"]


@admin.register(EmailPreference)
class EmailPreferenceAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "marketing_emails",
        "product_updates",
        "newsletter",
        "onboarding_emails",
        "weekly_digest",
    ]
    list_filter = [
        "marketing_emails",
        "product_updates",
        "newsletter",
        "onboarding_emails",
        "weekly_digest",
    ]
    search_fields = ["user__email"]
