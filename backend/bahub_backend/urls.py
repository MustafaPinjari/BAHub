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
    
    # Permission endpoints
    path("api/v1/permissions/", include("permissions.urls")),
    
    # Project endpoints
    path("api/v1/projects/", include("projects.urls")),
    
    # Stakeholder endpoints
    path("api/v1/stakeholders/", include("stakeholders.urls")),
    
    # Requirement endpoints
    path("api/v1/requirements/", include("requirements.urls")),
    
    # User Story endpoints
    path("api/v1/stories/", include("stories.urls")),
    
    # Document endpoints
    path("api/v1/documents/", include("documents.urls")),
    
    # Meeting endpoints
    path("api/v1/meetings/", include("meetings.urls")),
]
