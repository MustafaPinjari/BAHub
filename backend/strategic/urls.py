from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SWOTAnalysisViewSet, GapAnalysisViewSet, AIChatView, AIJobDetailView

router = DefaultRouter()
router.register(r"swot", SWOTAnalysisViewSet, basename="swotanalysis")
router.register(r"gap", GapAnalysisViewSet, basename="gapanalysis")

urlpatterns = [
    path("ai/chat/", AIChatView.as_view(), name="ai-chat"),
    path("ai/jobs/<uuid:job_id>/", AIJobDetailView.as_view(), name="ai-job-detail"),
    path("", include(router.urls)),
]
