from django.urls import path, include
from rest_framework.routers import DefaultRouter
from users.views import (
    RegisterView,
    ProfileView,
    LogoutAllView,
    UserSessionViewSet,
    WorkspaceMembersView,
    VerifyOTPView,
    ResendOTPView,
    DemoLoginView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
)

router = DefaultRouter()
router.register(r"sessions", UserSessionViewSet, basename="user-session")

from users.superadmin import SuperAdminDashboardView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("verify-otp/", VerifyOTPView.as_view(), name="auth-verify-otp"),
    path("resend-otp/", ResendOTPView.as_view(), name="auth-resend-otp"),
    path("profile/", ProfileView.as_view(), name="auth-profile"),
    path("sessions/logout-all/", LogoutAllView.as_view(), name="auth-logout-all"),
    path("members/", WorkspaceMembersView.as_view(), name="auth-members"),
    path("superadmin/dashboard/", SuperAdminDashboardView.as_view(), name="users-superadmin-dashboard"),
    # Secure demo login — credentials never exposed in frontend
    path("demo-login/", DemoLoginView.as_view(), name="auth-demo-login"),
    # Password reset flow
    path("password-reset/request/", PasswordResetRequestView.as_view(), name="auth-password-reset-request"),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view(), name="auth-password-reset-confirm"),
    path("", include(router.urls)),
]


