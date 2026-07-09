import logging
import sys
import datetime

from django.http import JsonResponse
from django.utils import timezone
from django.utils.decorators import sync_and_async_middleware
from rest_framework_simplejwt.authentication import JWTAuthentication
from billing.models import TenantSubscription

logger = logging.getLogger("bahub.core")


@sync_and_async_middleware
def SubscriptionMiddleware(get_response):
    """
    Subscription verification middleware — written as a functional middleware
    so Django's @sync_and_async_middleware decorator handles the sync/async
    dispatch automatically, which is more reliable than manual coroutine detection.
    """
    import asyncio

    if asyncio.iscoroutinefunction(get_response):
        # ── Async path (ASGI / Daphne) ──────────────────────────────
        async def async_middleware(request):
            from asgiref.sync import sync_to_async
            blocked = await sync_to_async(_guard, thread_sensitive=True)(request)
            if blocked is not None:
                return blocked
            return await get_response(request)
        return async_middleware
    else:
        # ── Sync path (WSGI / test runner) ──────────────────────────
        def sync_middleware(request):
            blocked = _guard(request)
            if blocked is not None:
                return blocked
            return get_response(request)
        return sync_middleware


# ---------------------------------------------------------------------------
# Guard logic — returns a JsonResponse to block, or None to pass through.
# Never calls get_response.
# ---------------------------------------------------------------------------

def _guard(request):
    if not request.path.startswith('/api/'):
        return None

    from django.conf import settings
    is_testing = (
        'test' in sys.argv or getattr(settings, 'TESTING', False)
    ) and request.META.get('HTTP_X_TEST_MAINTENANCE') != 'True'

    # ── 1. Maintenance mode ────────────────────────────────────────────
    from users.superadmin import get_system_settings
    settings_data = get_system_settings()

    if settings_data.get("maintenance_mode") == "true" and not is_testing:
        user = _resolve_user(request)
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

    # ── 2. Bypass billing / auth / admin / SAML ───────────────────────
    bypass_paths = ['/billing/', '/auth/', '/admin/', '/saml2/']
    if any(p in request.path for p in bypass_paths):
        return None

    # ── 3. Subscription enforcement ───────────────────────────────────
    user = _resolve_user(request)
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

    # Paid tier pending admin verification
    if sub.plan_tier != "FREE" and not sub.plan_verified:
        return JsonResponse(
            {
                "success": False,
                "message": "Your organization subscription is pending verification.",
                "errors": {"error": "Payment pending verification."},
            },
            status=402,
        )

    # Paid tier expired past 7-day grace period
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

    return None


# ---------------------------------------------------------------------------
# Helper — resolve the authenticated user from the request
# ---------------------------------------------------------------------------

def _resolve_user(request):
    if hasattr(request, 'user') and request.user and request.user.is_authenticated:
        return request.user
    if hasattr(request, '_force_auth_user'):
        return request._force_auth_user
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        try:
            result = JWTAuthentication().authenticate(request)
            if result:
                return result[0]
        except Exception:
            pass
    return None
