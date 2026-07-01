from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    IntegrationConfigViewSet,
    SyncLogViewSet,
    TestConnectionView,
    JiraSyncView,
    ConfluenceSyncView
)

router = DefaultRouter()
router.register("config", IntegrationConfigViewSet, basename="integrationconfig")
router.register("sync-logs", SyncLogViewSet, basename="synclog")

urlpatterns = [
    path("", include(router.urls)),
    path("test-connection/", TestConnectionView.as_view(), name="test-connection"),
    path("jira/sync-stories/", JiraSyncView.as_view(), name="jira-sync-stories"),
    path("confluence/sync-document/", ConfluenceSyncView.as_view(), name="confluence-sync-document"),
]
