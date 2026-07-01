from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, ProjectMemberViewSet, ProjectAttachmentViewSet, ActivityLogViewSet

router = DefaultRouter()
router.register(r"memberships", ProjectMemberViewSet, basename="project-member")
router.register(r"attachments", ProjectAttachmentViewSet, basename="project-attachment")
router.register(r"activities", ActivityLogViewSet, basename="project-activity")
router.register(r"", ProjectViewSet, basename="project")

urlpatterns = [
    path("", include(router.urls)),
]
