from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MeetingViewSet, ActionItemViewSet

router = DefaultRouter()
router.register(r"action-items", ActionItemViewSet, basename="actionitem")
router.register(r"", MeetingViewSet, basename="meeting")

urlpatterns = [
    path("", include(router.urls)),
]
