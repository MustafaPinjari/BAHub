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

from django.conf import settings


class SecurityHeadersMiddleware:
    """
    Middleware that adds security headers to all responses.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Content-Security-Policy
        # Allows scripts from self, Stripe, and the frontend
        csp_directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https: blob:",
            "font-src 'self' data:",
            "connect-src 'self' https://api.stripe.com https://checkout.stripe.com",
            "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
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
