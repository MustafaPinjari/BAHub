from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SWOTAnalysisViewSet, GapAnalysisViewSet, AIChatView

router = DefaultRouter()
router.register(r"swot", SWOTAnalysisViewSet, basename="swotanalysis")
router.register(r"gap", GapAnalysisViewSet, basename="gapanalysis")

urlpatterns = [
    path("ai/chat/", AIChatView.as_view(), name="ai-chat"),
    path("", include(router.urls)),
]
