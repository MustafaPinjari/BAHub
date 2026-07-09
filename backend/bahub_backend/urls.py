import django.conf.urls
from django.urls import path, re_path, include
django.conf.urls.url = re_path

import django.utils.http
from django.utils.http import url_has_allowed_host_and_scheme
django.utils.http.is_safe_url = url_has_allowed_host_and_scheme


from django.contrib import admin
from rest_framework_simplejwt.views import TokenRefreshView
from core.views import health_check, HealthCheckView, RootView, PublicSettingsView
from users.views import CustomTokenObtainPairView

urlpatterns = [
    # Root status and lightweight health checks
    path("", RootView.as_view(), name="backend-root"),
    path("health/", HealthCheckView.as_view(), name="backend-health"),
    path("health", HealthCheckView.as_view()),
    
    path("admin/", admin.site.urls),
    
    # Global health check
    path("api/v1/health", health_check, name="api-health"),
    
    # Public platform settings (for landing page countdown etc.)
    path("api/v1/public/settings/", PublicSettingsView.as_view(), name="public-settings"),
    
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
    
    # Risk endpoints
    path("api/v1/risks/", include("risks.urls")),
    
    # Strategic endpoints (SWOT & Gap)
    path("api/v1/strategic/", include("strategic.urls")),
    
    # Billing & subscriptions
    path("api/v1/billing/", include("billing.urls")),
    
    # Integration endpoints
    path("api/v1/integrations/", include("integrations.urls")),
    
    # Audit log endpoints
    path("api/v1/audit/", include("audit.urls")),
    
    # Diagrams endpoints
    path("api/v1/diagrams/", include("diagrams.urls")),
    
    # UAT endpoints
    path("api/v1/uat/", include("uat.urls")),
    
    # SAML2 SSO login endpoints
    path("saml2_auth/", include("django_saml2_auth.urls")),
]

from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
