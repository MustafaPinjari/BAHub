"""
Security Headers Middleware

Adds security headers to all HTTP responses:
- Content-Security-Policy (CSP): Restricts sources of scripts, styles, etc.
- X-Content-Type-Options: Prevents MIME-sniffing
- X-Frame-Options: Prevents clickjacking
- X-XSS-Protection: Enables XSS filter
- Referrer-Policy: Controls referrer information
- Permissions-Policy: Controls browser features
"""

import asyncio
from django.conf import settings
from django.utils.decorators import sync_and_async_middleware


@sync_and_async_middleware
def SecurityHeadersMiddleware(get_response):
    """
    Middleware that adds security headers to all responses.
    Supports both sync (WSGI) and async (ASGI) modes.
    """

    if asyncio.iscoroutinefunction(get_response):
        async def async_middleware(request):
            response = await get_response(request)
            return _add_security_headers(request, response)
        return async_middleware
    else:
        def sync_middleware(request):
            response = get_response(request)
            return _add_security_headers(request, response)
        return sync_middleware


def _add_security_headers(request, response):
    # Content-Security-Policy
    # Allows scripts from self, Razorpay, and the frontend
    csp_directives = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data:",
        "connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
        "frame-src 'self' https://checkout.razorpay.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests",
    ]
    response["Content-Security-Policy"] = "; ".join(csp_directives)

    # X-Content-Type-Options: Prevents MIME-sniffing
    response["X-Content-Type-Options"] = "nosniff"

    # X-Frame-Options: Prevents clickjacking (legacy, CSP frame-ancestors is preferred)
    response["X-Frame-Options"] = "DENY"

    # X-XSS-Protection: Enables XSS filter (legacy, CSP is preferred)
    response["X-XSS-Protection"] = "1; mode=block"

    # Referrer-Policy: Controls referrer information
    response["Referrer-Policy"] = "strict-origin-when-cross-origin"

    # Permissions-Policy: Controls browser features
    permissions_policy = [
        "geolocation=()",
        "microphone=()",
        "camera=()",
        "payment=(self)",
    ]
    response["Permissions-Policy"] = ", ".join(permissions_policy)

    # Strict-Transport-Security (HSTS): Only in production with HTTPS
    if not settings.DEBUG and request.is_secure():
        response["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"

    return response
