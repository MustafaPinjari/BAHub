import uuid
from django.contrib.auth import get_user_model
from rest_framework import status, viewsets, mixins
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import AccessToken

from core.responses import api_success, api_error
from users.models import UserSession, UserPreference
from users.serializers import (
    RegisterSerializer,
    UserSerializer,
    ProfileUpdateSerializer,
    UserSessionSerializer,
    CustomTokenObtainPairSerializer,
)

User = get_user_model()

def parse_user_agent(ua_string):
    """
    A lightweight, no-dependency helper to parse Browser and Device type from user agent.
    """
    if not ua_string:
        return "Unknown Browser", "Desktop"
    
    # Browser detection
    browser = "Unknown Browser"
    if "Chrome" in ua_string:
        browser = "Chrome"
    elif "Safari" in ua_string:
        browser = "Safari"
    elif "Firefox" in ua_string:
        browser = "Firefox"
    elif "Edge" in ua_string:
        browser = "Edge"
    elif "MSIE" in ua_string or "Trident" in ua_string:
        browser = "Internet Explorer"

    # Device type detection
    device = "Desktop"
    if "Mobi" in ua_string or "Android" in ua_string:
        device = "Mobile"
    elif "Tablet" in ua_string or "iPad" in ua_string:
        device = "Tablet"
        
    return browser, device


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Overridden SimpleJWT Login view that creates a UserSession and wraps the payload.
    """
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            username = request.data.get("username")
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                return response

            # Extract JWT ID (jti) from the access token
            access_token_str = response.data.get("access")
            jti = None
            try:
                decoded_token = AccessToken(access_token_str)
                jti = decoded_token.get("jti")
            except Exception:
                pass

            # Extract client metadata
            ip_address = request.META.get("HTTP_X_FORWARDED_FOR", request.META.get("REMOTE_ADDR", ""))
            if ip_address and "," in ip_address:
                ip_address = ip_address.split(",")[0].strip()
            ua_string = request.META.get("HTTP_USER_AGENT", "")
            browser, device = parse_user_agent(ua_string)

            # Record active session
            UserSession.objects.create(
                user=user,
                token_id=uuid.UUID(jti) if jti else uuid.uuid4(),
                ip_address=ip_address,
                user_agent=ua_string,
                browser=browser,
                device=device,
                is_active=True
            )

            return api_success(
                data=response.data, 
                message="Logged in successfully."
            )
        return response


class RegisterView(APIView):
    """
    User signup endpoint. Creates a new user along with a workspace organization.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Serialize created user
        user_data = UserSerializer(user).data
        return api_success(
            data=user_data, 
            message="User registered successfully. Welcome to BAHub!", 
            status_code=status.HTTP_201_CREATED
        )


class ProfileView(APIView):
    """
    Retrieve and update user profile fields and UI preferences.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return api_success(
            data=serializer.data, 
            message="Profile fetched successfully."
        )

    def put(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data)
        serializer.is_valid(raise_exception=True)
        updated_user = serializer.save()
        
        full_serializer = UserSerializer(updated_user)
        return api_success(
            data=full_serializer.data, 
            message="Profile updated successfully."
        )

    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_user = serializer.save()
        
        full_serializer = UserSerializer(updated_user)
        return api_success(
            data=full_serializer.data, 
            message="Profile updated successfully."
        )


class UserSessionViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    List login sessions for the authenticated user.
    """
    serializer_class = UserSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserSession.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return api_success(
            data=serializer.data, 
            message="Active sessions retrieved successfully."
        )


class LogoutAllView(APIView):
    """
    Log out from all devices by invalidating all active sessions for the user.
    Note: Token blacklisting will be integrated here if token revoking is enforced.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Set all user sessions to inactive
        UserSession.objects.filter(user=request.user, is_active=True).update(is_active=False)
        return api_success(
            message="Logged out from all sessions successfully."
        )


class WorkspaceMembersView(APIView):
    """
    List all active users inside the current requesting user's organization.
    Useful for selecting team leads, project members, or stakeholders.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.organization_id:
            return api_success(data=[], message="User does not belong to an organization.")
        members = User.objects.filter(organization_id=user.organization_id, is_active=True)
        serializer = UserSerializer(members, many=True)
        return api_success(data=serializer.data, message="Workspace members retrieved successfully.")
