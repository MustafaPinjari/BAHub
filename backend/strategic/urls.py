from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SWOTAnalysisViewSet, GapAnalysisViewSet

router = DefaultRouter()
router.register(r"swot", SWOTAnalysisViewSet, basename="swotanalysis")
router.register(r"gap", GapAnalysisViewSet, basename="gapanalysis")

urlpatterns = [
    path("", include(router.urls)),
]
