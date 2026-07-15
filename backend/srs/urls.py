from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SRSDocumentViewSet, SRSSectionViewSet, SRSCommentViewSet,
    SRSVersionViewSet, AIGenerationHistoryViewSet
)

router = DefaultRouter()
router.register(r"documents", SRSDocumentViewSet, basename="srs-document")
router.register(r"sections", SRSSectionViewSet, basename="srs-section")
router.register(r"comments", SRSCommentViewSet, basename="srs-comment")
router.register(r"versions", SRSVersionViewSet, basename="srs-version")
router.register(r"ai-history", AIGenerationHistoryViewSet, basename="srs-ai-history")

urlpatterns = [
    path("", include(router.urls)),
]
