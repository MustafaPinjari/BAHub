from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DiagramViewSet, DiagramCommentViewSet, DiagramApprovalViewSet

router = DefaultRouter()
router.register(r"comments", DiagramCommentViewSet, basename="diagram-comment")
router.register(r"approvals", DiagramApprovalViewSet, basename="diagram-approval")
router.register(r"", DiagramViewSet, basename="diagram")

urlpatterns = [
    path("", include(router.urls)),
]
