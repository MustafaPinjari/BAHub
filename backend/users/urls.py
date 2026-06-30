from django.urls import path, include
from rest_framework.routers import DefaultRouter
from users.views import RegisterView, ProfileView, LogoutAllView, UserSessionViewSet

router = DefaultRouter()
router.register(r"sessions", UserSessionViewSet, basename="user-session")

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("profile/", ProfileView.as_view(), name="auth-profile"),
    path("sessions/logout-all/", LogoutAllView.as_view(), name="auth-logout-all"),
    path("", include(router.urls)),
]
