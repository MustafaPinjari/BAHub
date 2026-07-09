import logging
from django.http import JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication
from billing.models import TenantSubscription

logger = logging.getLogger("bahub.core")

class SubscriptionMiddleware:
    """
    Subscription verification middleware.
    Validates organization subscription active/verified status on all premium endpoints.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Enforce check on API endpoints starting with /api/v1/
        if request.path.startswith('/api/'):
            import sys
            from django.conf import settings
            is_testing = ('test' in sys.argv or getattr(settings, 'TESTING', False)) and request.META.get('HTTP_X_TEST_MAINTENANCE') != 'True'

            # 1. Check maintenance mode first
            from users.superadmin import get_system_settings
            settings_data = get_system_settings()
            if settings_data.get("maintenance_mode") == "true" and not is_testing:
                # Check user auth status
                user = None
                if hasattr(request, 'user') and request.user and request.user.is_authenticated:
                    user = request.user
                elif hasattr(request, '_force_auth_user'):
                    user = request._force_auth_user
                else:
                    auth_header = request.headers.get('Authorization')
                    if auth_header and auth_header.startswith('Bearer '):
                        try:
                            authenticator = JWTAuthentication()
                            auth_result = authenticator.authenticate(request)
                            if auth_result:
                                user, _ = auth_result
                        except Exception:
                            pass
                
                is_admin = user and (user.is_superuser or user.is_staff)
                is_maintenance_bypass = any(path in request.path for path in ['/auth/login/', '/health/', '/admin/'])
                if not is_admin and not is_maintenance_bypass:
                    return JsonResponse(
                        {
                            "success": False,
                            "message": "BAHub is currently undergoing scheduled platform maintenance. Please check back shortly.",
                            "errors": {"maintenance": ["System is in maintenance mode."]}
                        },
                        status=503
                    )

            # Allow billing, authentication, admin, and SAML endpoints to bypass checks
            bypass_paths = ['/billing/', '/auth/', '/admin/', '/saml2/']
            if any(path in request.path for path in bypass_paths):
                return self.get_response(request)

            user = None
            if hasattr(request, 'user') and request.user and request.user.is_authenticated:
                user = request.user
            elif hasattr(request, '_force_auth_user'):
                user = request._force_auth_user
            else:
                auth_header = request.headers.get('Authorization')
                if auth_header and auth_header.startswith('Bearer '):
                    try:
                        authenticator = JWTAuthentication()
                        auth_result = authenticator.authenticate(request)
                        if auth_result:
                            user, _ = auth_result
                    except Exception:
                        pass

            if user and user.is_authenticated:
                if user.is_superuser or user.is_staff:
                    return self.get_response(request)
                # If they have an organization, we check their subscription status
                if user.organization:
                    try:
                        sub = TenantSubscription.objects.get(organization=user.organization)
                        
                        # Expiry and grace period enforcement
                        from django.utils import timezone
                        import datetime
                        
                        is_blocked = False
                        
                        # 1. If it's a paid tier and not verified, they are blocked
                        if sub.plan_tier != "FREE" and not sub.plan_verified:
                            return JsonResponse(
                                {
                                    "success": False,
                                    "message": "Your organization subscription is pending verification.",
                                    "errors": {"error": "Payment pending verification."}
                                },
                                status=402
                            )
                            
                        # 2. If it's expired and past the grace period, they are blocked
                        if sub.plan_tier != "FREE" and sub.expires_at:
                            grace_days = 7
                            grace_period_ends_at = sub.expires_at + datetime.timedelta(days=grace_days)
                            if timezone.now() >= grace_period_ends_at:
                                if sub.payment_status != "EXPIRED":
                                    sub.payment_status = "EXPIRED"
                                    sub.is_active = False
                                    sub.save()
                                return JsonResponse(
                                    {
                                        "success": False,
                                        "message": "Your organization's subscription is inactive or expired. Please complete payment.",
                                        "errors": {"error": "Payment required to access this resource."}
                                    },
                                    status=402
                                )
                    except TenantSubscription.DoesNotExist:
                        pass

        return self.get_response(request)
