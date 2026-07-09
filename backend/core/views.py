from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.renderers import JSONRenderer
import logging
import datetime
import os
import json

logger = logging.getLogger(__name__)

@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint returning 200 and success status.
    """
    # Conforms to response envelope:
    # We return the exact layout asked: {"status": "healthy"}
    return Response({"status": "healthy"}, status=status.HTTP_200_OK)


class HealthCheckView(APIView):
    """
    Highly-optimized, unauthenticated health check endpoint.
    Safe for frequent polling (no DB query overhead).
    """
    permission_classes = [AllowAny]
    authentication_classes = []  # Bypass SimpleJWT/session overhead
    renderer_classes = [JSONRenderer]  # Return raw JSON without triggering static asset loading

    def get(self, request, *args, **kwargs):
        # Resolve client IP address behind proxy/Render
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0].strip()
        else:
            ip = request.META.get("REMOTE_ADDR")

        logger.info(f"Health check requested from {ip}")

        return Response({
            "status": "ok",
            "service": "BAHub Backend",
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "version": "1.0"
        }, status=status.HTTP_200_OK)


class RootView(APIView):
    """
    Unauthenticated root endpoint returning status info instead of 404.
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    renderer_classes = [JSONRenderer]  # Return raw JSON without triggering static asset loading

    def get(self, request, *args, **kwargs):
        return Response({
            "service": "BAHub Backend",
            "status": "running",
            "health": "/health/",
            "docs": "/api/docs/"
        }, status=status.HTTP_200_OK)



class PublicSettingsView(APIView):
    """
    Public endpoint to read non-sensitive platform settings.
    Used by landing page to check countdown timer status.
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    renderer_classes = [JSONRenderer]

    def get(self, request, *args, **kwargs):
        # Read system_settings.json
        settings_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "users", "system_settings.json")
        default_settings = {
            "waitlist_countdown_enabled": "false",
            "maintenance_mode": "false",
        }
        
        if os.path.exists(settings_file):
            try:
                with open(settings_file, "r") as f:
                    settings_data = json.load(f)
                    default_settings.update(settings_data)
            except Exception:
                pass
        
        # Only expose safe public settings
        return Response({
            "waitlist_countdown_enabled": default_settings.get("waitlist_countdown_enabled", "false") == "true",
            "maintenance_mode": default_settings.get("maintenance_mode", "false") == "true",
        }, status=status.HTTP_200_OK)


class PublicWaitlistView(APIView):
    """
    Public endpoint to register interest in the waitlist.
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    renderer_classes = [JSONRenderer]

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        if not email or "@" not in email:
            return Response(
                {"success": False, "message": "Please provide a valid email address."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        waitlist_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "users", "waitlist.json")
        waitlist_data = []
        if os.path.exists(waitlist_file):
            try:
                with open(waitlist_file, "r") as f:
                    waitlist_data = json.load(f)
            except Exception:
                pass
                
        # Check duplicate
        if any(item.get("email") == email.strip().lower() for item in waitlist_data):
            return Response(
                {"success": True, "message": "You are already on the waitlist!"},
                status=status.HTTP_200_OK
            )
            
        waitlist_data.append({
            "email": email.strip().lower(),
            "created_at": datetime.datetime.utcnow().isoformat() + "Z"
        })
        
        try:
            with open(waitlist_file, "w") as f:
                json.dump(waitlist_data, f, indent=4)
        except Exception:
            return Response(
                {"success": False, "message": "Failed to save waitlist submission."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
        # Send confirmation email
        from core.emails import send_waitlist_confirmation_email
        send_waitlist_confirmation_email(email.strip().lower())
            
        return Response(
            {"success": True, "message": "Successfully joined the waitlist!"},
            status=status.HTTP_201_CREATED
        )
