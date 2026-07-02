from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.authentication import JWTAuthentication
from .context import set_current_request_data

class AuditThreadLocalMiddleware(MiddlewareMixin):
    """
    Middleware that captures the currently authenticated user (including SimpleJWT DRF requests),
    client IP, and User-Agent, and registers them in thread-local storage.
    """
    def process_request(self, request):
        user = None

        # 1. Try SimpleJWT authentication for API requests
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            try:
                jwt_authenticator = JWTAuthentication()
                header = jwt_authenticator.get_header(request)
                if header is not None:
                    raw_token = jwt_authenticator.get_raw_token(header)
                    if raw_token is not None:
                        validated_token = jwt_authenticator.get_validated_token(raw_token)
                        user = jwt_authenticator.get_user(validated_token)
            except Exception:
                pass

        # 2. Fallback to standard Django session user
        if not user and hasattr(request, "user") and request.user.is_authenticated:
            user = request.user

        # 3. Resolve client IP address
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(",")[0].strip()
        else:
            ip_address = request.META.get("REMOTE_ADDR")

        # 4. Resolve client User Agent
        user_agent = request.META.get("HTTP_USER_AGENT", "")

        # 5. Populate contextvar thread-local variables
        set_current_request_data(user, ip_address, user_agent)

    def process_response(self, request, response):
        """
        Resets contextvar thread-local variables at the end of the request cycle.
        """
        set_current_request_data(None, None, None)
        return response

