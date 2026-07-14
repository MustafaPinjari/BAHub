from rest_framework import serializers
from .models import EmailTemplate, EmailCampaign, EmailEvent, EmailList, Unsubscribe, EmailPreference
from django.contrib.auth import get_user_model

User = get_user_model()


class EmailTemplateSerializer(serializers.ModelSerializer):
    """Serializer for email templates."""
    class Meta:
        model = EmailTemplate
        fields = [
            "id",
            "name",
            "template_type",
            "subject",
            "html_content",
            "text_content",
            "variables",
            "is_active",
        ]


class EmailCampaignSerializer(serializers.ModelSerializer):
    """Serializer for email campaigns."""
    template = EmailTemplateSerializer(read_only=True)
    template_id = serializers.UUIDField(write_only=True)
    open_rate = serializers.SerializerMethodField()
    click_rate = serializers.SerializerMethodField()

    class Meta:
        model = EmailCampaign
        fields = [
            "id",
            "name",
            "description",
            "template",
            "template_id",
            "status",
            "scheduled_at",
            "sent_at",
            "target_segment",
            "total_recipients",
            "sent_count",
            "opened_count",
            "clicked_count",
            "open_rate",
            "click_rate",
        ]

    def get_open_rate(self, obj):
        if obj.sent_count > 0:
            return round((obj.opened_count / obj.sent_count) * 100, 2)
        return 0

    def get_click_rate(self, obj):
        if obj.sent_count > 0:
            return round((obj.clicked_count / obj.sent_count) * 100, 2)
        return 0


class EmailEventSerializer(serializers.ModelSerializer):
    """Serializer for email events."""
    user_email = serializers.SerializerMethodField()

    class Meta:
        model = EmailEvent
        fields = [
            "id",
            "user",
            "user_email",
            "campaign",
            "event_type",
            "email_address",
            "metadata",
            "occurred_at",
        ]

    def get_user_email(self, obj):
        return obj.user.email if obj.user else obj.email_address


class EmailListSerializer(serializers.ModelSerializer):
    """Serializer for email lists."""
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = EmailList
        fields = [
            "id",
            "name",
            "description",
            "is_active",
            "subscriber_count",
            "user_count",
        ]

    def get_user_count(self, obj):
        return obj.users.count()


class UnsubscribeSerializer(serializers.ModelSerializer):
    """Serializer for unsubscribe records."""
    class Meta:
        model = Unsubscribe
        fields = [
            "id",
            "user",
            "email_address",
            "campaign",
            "reason",
            "unsubscribed_at",
        ]


class EmailPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for user email preferences."""
    user_email = serializers.SerializerMethodField()

    class Meta:
        model = EmailPreference
        fields = [
            "id",
            "user",
            "user_email",
            "marketing_emails",
            "product_updates",
            "newsletter",
            "onboarding_emails",
            "weekly_digest",
        ]

    def get_user_email(self, obj):
        return obj.user.email
