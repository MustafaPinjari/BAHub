from rest_framework import serializers
from .models import TenantSubscription
from django.contrib.auth import get_user_model

User = get_user_model()

class TenantSubscriptionSerializer(serializers.ModelSerializer):
    active_seats_count = serializers.SerializerMethodField()

    class Meta:
        model = TenantSubscription
        fields = [
            "id",
            "organization",
            "gateway_customer_id",
            "gateway_subscription_id",
            "plan_tier",
            "seats_limit",
            "is_active",
            "plan_verified",
            "ai_credits_used",
            "ai_credits_limit",
            "active_seats_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "organization", "gateway_customer_id", "gateway_subscription_id", "created_at", "updated_at"]

    def get_active_seats_count(self, obj):
        return User.objects.filter(organization=obj.organization, is_active=True).count()
