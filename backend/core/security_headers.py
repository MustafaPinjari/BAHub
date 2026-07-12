"""
Security headers middleware for BAHub.
Adds CSP, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy headers to every response.
NOTE: X-Frame-Options is already handled by Django's XFrameOptionsMiddleware.
"""
from django.conf import settings


class SecurityHeadersMiddleware:
    """
    Sets HTTP security headers on every outbound response.
    Placed after Django's built-in security middleware in settings.MIDDLEWARE.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Content-Security-Policy
        # Allows self + specific trusted CDNs; blocks inline scripts except for vite HMR in dev.
        if settings.DEBUG:
            # Permissive in development (Vite HMR needs unsafe-inline/eval)
            csp = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://plausible.io; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com data:; "
                "img-src 'self' data: blob: https:; "
                "connect-src 'self' ws: wss: https:; "
                "frame-ancestors 'none';"
            )
        else:
            csp = (
                "default-src 'self'; "
                "script-src 'self' https://plausible.io; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com data:; "
                "img-src 'self' data: blob: https:; "
                "connect-src 'self' wss: https:; "
                "frame-ancestors 'none'; "
                "upgrade-insecure-requests;"
            )

        response["Content-Security-Policy"] = csp
        response["X-Content-Type-Options"] = "nosniff"
        response["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), payment=(self)"
        )
        # Ensure X-Frame-Options is set (Django middleware also sets this, belt + suspenders)
        if "X-Frame-Options" not in response:
            response["X-Frame-Options"] = "DENY"

        return response
