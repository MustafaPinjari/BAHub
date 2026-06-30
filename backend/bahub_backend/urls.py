from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from core.views import health_check
from users.views import CustomTokenObtainPairView

urlpatterns = [
    path("admin/", admin.site.urls),
    
    # Global health check
    path("api/v1/health", health_check, name="api-health"),
    
    # Auth endpoints
    path("api/v1/auth/login/", CustomTokenObtainPairView.as_view(), name="token-login"),
    path("api/v1/auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("api/v1/auth/", include("users.urls")),
    
    # Organization endpoints
    path("api/v1/organizations/", include("organizations.urls")),
    
    # Team endpoints
    path("api/v1/teams/", include("teams.urls")),
]
