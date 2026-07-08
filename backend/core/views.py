from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import logging
import datetime

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

    def get(self, request, *args, **kwargs):
        return Response({
            "service": "BAHub Backend",
            "status": "running",
            "health": "/health/",
            "docs": "/api/docs/"
        }, status=status.HTTP_200_OK)
