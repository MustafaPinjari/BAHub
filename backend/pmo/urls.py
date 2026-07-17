from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PortfolioAnalyticsViewSet

router = DefaultRouter()
router.register("analytics", PortfolioAnalyticsViewSet, basename="portfolio-analytics")

urlpatterns = [
    path("", include(router.urls)),
]
