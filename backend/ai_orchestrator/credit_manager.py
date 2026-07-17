import datetime
from django.utils import timezone
from billing.models import TenantSubscription
from ai_orchestrator.models import AIFeatureConfig, AITransactionLog
from rest_framework.exceptions import PermissionDenied

class CreditManager:
    @staticmethod
    def _get_feature_config(feature_name):
        try:
            return AIFeatureConfig.objects.get(feature_name=feature_name)
        except AIFeatureConfig.DoesNotExist:
            return AIFeatureConfig.objects.create(
                feature_name=feature_name,
                credit_cost=10, # default fallback cost
            )

    @staticmethod
    def validate_request(organization, feature_name):
        """
        Validates if the workspace has enough credits to perform this feature.
        Raises PermissionDenied if limits are exceeded.
        """
        try:
            sub = TenantSubscription.objects.get(organization=organization)
        except TenantSubscription.DoesNotExist:
            raise PermissionDenied("Workspace subscription not found.")

        feature_config = CreditManager._get_feature_config(feature_name)
        cost = feature_config.credit_cost

        # Reset daily limits if it's a new day
        today = timezone.now().date()
        if sub.last_ai_request_date != today:
            sub.daily_ai_credits_used = 0
            sub.last_ai_request_date = today
            sub.save(update_fields=['daily_ai_credits_used', 'last_ai_request_date'])

        if sub.ai_credits_used + cost > sub.ai_credits_limit:
            raise PermissionDenied(f"Monthly AI credit limit exceeded. Need {cost} credits, but only {sub.ai_credits_limit - sub.ai_credits_used} remaining.")

        if sub.daily_ai_credits_used + cost > sub.daily_ai_credits_limit:
            raise PermissionDenied(f"Daily AI credit limit exceeded. Need {cost} credits, but only {sub.daily_ai_credits_limit - sub.daily_ai_credits_used} remaining today.")

        return feature_config

    @staticmethod
    def deduct_credits(organization, user, feature_name, provider, model, input_tokens, output_tokens, estimated_cost, latency, status="SUCCESS"):
        """
        Deducts the weighted credits and logs the transaction.
        """
        try:
            sub = TenantSubscription.objects.get(organization=organization)
        except TenantSubscription.DoesNotExist:
            return None

        feature_config = CreditManager._get_feature_config(feature_name)
        cost = feature_config.credit_cost

        # If success, update subscription usage
        if status == "SUCCESS":
            sub.ai_credits_used += cost
            sub.daily_ai_credits_used += cost
            sub.last_ai_request_date = timezone.now().date()
            sub.save(update_fields=['ai_credits_used', 'daily_ai_credits_used', 'last_ai_request_date'])
        elif status == "CACHED":
            # Cached requests are free or heavily discounted. Let's make them free.
            cost = 0

        # Log the transaction
        log = AITransactionLog.objects.create(
            workspace=organization,
            user=user,
            feature=feature_name,
            provider=provider,
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            credits_deducted=cost,
            estimated_cost=estimated_cost,
            latency=latency,
            status=status
        )
        
        return log
