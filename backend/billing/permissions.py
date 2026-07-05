from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied
from .models import TenantSubscription

class IsProOrEnterprise(permissions.BasePermission):
    message = "This service requires a Pro or Enterprise subscription tier."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if not request.user.organization:
            raise PermissionDenied(detail="User is not associated with any organization.")

        sub, _ = TenantSubscription.objects.get_or_create(
            organization=request.user.organization,
            defaults={
                "plan_tier": "FREE",
                "seats_limit": 5,
                "is_active": True,
                "ai_credits_limit": 100
            }
        )
        
        if not sub.is_active:
            raise PermissionDenied(detail="Your subscription is inactive.")

        if sub.plan_tier not in ["PRO", "ENTERPRISE"]:
            raise PermissionDenied(detail="This service requires a Pro or Enterprise subscription tier.")

        return True

class IsEnterprise(permissions.BasePermission):
    message = "This service requires an Enterprise subscription tier."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if not request.user.organization:
            raise PermissionDenied(detail="User is not associated with any organization.")

        sub, _ = TenantSubscription.objects.get_or_create(
            organization=request.user.organization,
            defaults={
                "plan_tier": "FREE",
                "seats_limit": 5,
                "is_active": True,
                "ai_credits_limit": 100
            }
        )
        
        if not sub.is_active:
            raise PermissionDenied(detail="Your subscription is inactive.")

        if sub.plan_tier != "ENTERPRISE":
            raise PermissionDenied(detail="This service requires an Enterprise subscription tier.")

        return True
