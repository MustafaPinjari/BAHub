from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RiskViewSet, ChangeRequestViewSet

router = DefaultRouter()
router.register(r"change-requests", ChangeRequestViewSet, basename="changerequest")
router.register(r"", RiskViewSet, basename="risk")

urlpatterns = [
    path("", include(router.urls)),
]
