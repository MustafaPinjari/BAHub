import logging
import sys
import datetime

from django.http import JsonResponse
from django.utils import timezone
from rest_framework_simplejwt.authentication import JWTAuthentication
from billing.models import TenantSubscription

logger = logging.getLogger("bahub.core")


class SubscriptionMiddleware:
    """
    Subscription verification middleware.
    Validates organization subscription active/verified status on all premium endpoints.

    Fully compatible with both sync (WSGI) and async (ASGI/Daphne) stacks.
    The guard logic runs in a sync thread via asgiref so Django ORM calls are safe.
    """

    async_capable = True
    sync_capable = True

    def __init__(self, get_response):
        self.get_response = get_response
        import asyncio
        if asyncio.iscoroutinefunction(self.get_response):
            # Mark this middleware as a coroutine so Django/asgiref wraps it correctly
            self._is_coroutine = asyncio.coroutines._is_coroutine

    # ------------------------------------------------------------------
    # Entry point — dispatches to async or sync path
    # ------------------------------------------------------------------

    def __call__(self, request):
        import asyncio
        if asyncio.iscoroutinefunction(self.get_response):
            return self._async_call(request)
        # Sync path (WSGI / tests)
        blocked = self._guard(request)
        if blocked is not None:
            return blocked
        return self.get_response(request)

    async def _async_call(self, request):
        from asgiref.sync import sync_to_async
        # Run the synchronous guard (file I/O + ORM) in a thread-safe way
        blocked = await sync_to_async(self._guard, thread_sensitive=True)(request)
        if blocked is not None:
            return blocked
        return await self.get_response(request)

    # ------------------------------------------------------------------
    # Guard logic — returns a JsonResponse to block, or None to pass through
    # ------------------------------------------------------------------

    def _guard(self, request):
        if not request.path.startswith('/api/'):
            return None

        from django.conf import settings
        is_testing = (
            'test' in sys.argv or getattr(settings, 'TESTING', False)
        ) and request.META.get('HTTP_X_TEST_MAINTENANCE') != 'True'

        # ── 1. Maintenance mode check ──────────────────────────────────
        from users.superadmin import get_system_settings
        settings_data = get_system_settings()

        if settings_data.get("maintenance_mode") == "true" and not is_testing:
            user = self._resolve_user(request)
            is_admin = user and (user.is_superuser or user.is_staff)
            is_bypass = any(p in request.path for p in ['/auth/login/', '/health/', '/admin/'])
            if not is_admin and not is_bypass:
                return JsonResponse(
                    {
                        "success": False,
                        "message": (
                            "BAHub is currently undergoing scheduled platform maintenance. "
                            "Please check back shortly."
                        ),
                        "errors": {"maintenance": ["System is in maintenance mode."]},
                    },
                    status=503,
                )

        # ── 2. Bypass billing / auth / admin / SAML routes ────────────
        bypass_paths = ['/billing/', '/auth/', '/admin/', '/saml2/']
        if any(p in request.path for p in bypass_paths):
            return None  # pass through

        # ── 3. Subscription enforcement for authenticated users ────────
        user = self._resolve_user(request)
        if not (user and user.is_authenticated):
            return None

        if user.is_superuser or user.is_staff:
            return None

        if not user.organization:
            return None

        try:
            sub = TenantSubscription.objects.get(organization=user.organization)
        except TenantSubscription.DoesNotExist:
            return None

        # Paid tier not yet verified by admin
        if sub.plan_tier != "FREE" and not sub.plan_verified:
            return JsonResponse(
                {
                    "success": False,
                    "message": "Your organization subscription is pending verification.",
                    "errors": {"error": "Payment pending verification."},
                },
                status=402,
            )

        # Paid tier expired past grace period
        if sub.plan_tier != "FREE" and sub.expires_at:
            grace_ends = sub.expires_at + datetime.timedelta(days=7)
            if timezone.now() >= grace_ends:
                if sub.payment_status != "EXPIRED":
                    sub.payment_status = "EXPIRED"
                    sub.is_active = False
                    sub.save()
                return JsonResponse(
                    {
                        "success": False,
                        "message": (
                            "Your organization's subscription is inactive or expired. "
                            "Please complete payment."
                        ),
                        "errors": {"error": "Payment required to access this resource."},
                    },
                    status=402,
                )

        return None  # all checks passed

    # ------------------------------------------------------------------
    # Helper — resolve user from request (cached auth or JWT header)
    # ------------------------------------------------------------------

    def _resolve_user(self, request):
        if hasattr(request, 'user') and request.user and request.user.is_authenticated:
            return request.user
        if hasattr(request, '_force_auth_user'):
            return request._force_auth_user
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            try:
                authenticator = JWTAuthentication()
                result = authenticator.authenticate(request)
                if result:
                    return result[0]
            except Exception:
                pass
        return None
