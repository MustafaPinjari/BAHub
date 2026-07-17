from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    IntegrationConfigViewSet,
    SyncLogViewSet,
    TestConnectionView,
    JiraSyncView,
    ConfluenceSyncView,
    FigmaIntegrationViewSet,
    CodeIntegrationViewSet
)

router = DefaultRouter()
router.register("config", IntegrationConfigViewSet, basename="integration-config")
router.register("sync-logs", SyncLogViewSet, basename="synclog")
router.register("figma", FigmaIntegrationViewSet, basename="figma-integration")
router.register("code", CodeIntegrationViewSet, basename="code-integration")

urlpatterns = [
    path("", include(router.urls)),
    path("test-connection/", TestConnectionView.as_view(), name="test-connection"),
    path("sync/jira/", JiraSyncView.as_view(), name="sync-jira"),
    path("sync/confluence/", ConfluenceSyncView.as_view(), name="sync-confluence"),
]
