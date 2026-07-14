from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EmailTemplateViewSet,
    EmailCampaignViewSet,
    EmailEventViewSet,
    EmailListViewSet,
    UnsubscribeViewSet,
    EmailPreferenceViewSet,
)

router = DefaultRouter()
router.register(r"templates", EmailTemplateViewSet, basename="email-template")
router.register(r"campaigns", EmailCampaignViewSet, basename="email-campaign")
router.register(r"events", EmailEventViewSet, basename="email-event")
router.register(r"lists", EmailListViewSet, basename="email-list")
router.register(r"unsubscribes", UnsubscribeViewSet, basename="unsubscribe")
router.register(r"preferences", EmailPreferenceViewSet, basename="email-preference")

urlpatterns = [
    path("", include(router.urls)),
]
