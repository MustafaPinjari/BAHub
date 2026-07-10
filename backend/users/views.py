import uuid
from django.contrib.auth import get_user_model
from rest_framework import status, viewsets, mixins
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

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
    throttle_scope = "login"

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
    throttle_scope = "login"  # 10 requests/minute — prevents signup spam & OTP email abuse

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate and send Email OTP code
        from users.models import EmailOTP
        from core.emails import send_registration_otp_email

        otp_code = EmailOTP.generate_otp_for_user(user)
        send_registration_otp_email(user.username, user.email, otp_code)

        # Serialize created user
        user_data = UserSerializer(user).data
        return api_success(
            data={
                "user": user_data,
                "requires_verification": True,
                "username": user.username,
            }, 
            message="User registered successfully. Please verify your email using the OTP sent to you.", 
            status_code=status.HTTP_201_CREATED
        )


class VerifyOTPView(APIView):
    """
    Verify the 6-digit OTP code to activate the user account.
    """
    permission_classes = [AllowAny]
    throttle_scope = "otp"

    def post(self, request):
        username = request.data.get("username")
        otp_code = request.data.get("otp_code")

        if not username or not otp_code:
            return api_error(
                message="Username and OTP code are required.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return api_error(
                message="User does not exist.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # Check if the user is already active
        if user.is_active:
            return api_error(
                message="This account is already verified and active.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        from users.models import EmailOTP
        try:
            otp_record = EmailOTP.objects.get(user=user, otp_code=otp_code)
        except EmailOTP.DoesNotExist:
            return api_error(
                message="Invalid verification code.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        if otp_record.is_expired():
            return api_error(
                message="Verification code has expired. Please request a new one.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # Mark OTP as verified and activate user
        otp_record.is_verified = True
        otp_record.save()

        user.is_active = True
        user.save()

        # Generate JWT tokens for auto-login
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        refresh["role"] = user.role
        refresh["organization_id"] = str(user.organization_id) if user.organization_id else None
        refresh["username"] = user.username
        refresh["email"] = user.email

        user_data = UserSerializer(user).data
        return api_success(
            data={
                "user": user_data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            message="Email verified successfully. Welcome to BAHub!"
        )


class ResendOTPView(APIView):
    """
    Generate and resend a new OTP code to the user's email.
    """
    permission_classes = [AllowAny]
    throttle_scope = "otp"

    def post(self, request):
        username = request.data.get("username")

        if not username:
            return api_error(
                message="Username is required.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return api_error(
                message="User does not exist.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        if user.is_active:
            return api_error(
                message="This account is already verified and active.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        from users.models import EmailOTP
        from core.emails import send_registration_otp_email

        otp_code = EmailOTP.generate_otp_for_user(user)
        send_registration_otp_email(user.username, user.email, otp_code)

        return api_success(
            message="A new verification code has been sent to your email."
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
    Log out from all devices by invalidating all active sessions for the user
    and blacklisting all their issued outstanding tokens.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # 1. Set all user sessions to inactive in session tracker
        UserSession.objects.filter(user=request.user, is_active=True).update(is_active=False)
        
        # 2. Blacklist all outstanding JWT tokens for this user
        outstanding_tokens = OutstandingToken.objects.filter(user=request.user)
        for token in outstanding_tokens:
            BlacklistedToken.objects.get_or_create(token=token)
            
        return api_success(
            message="Logged out from all sessions and blacklisted all tokens successfully."
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
