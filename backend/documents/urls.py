from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BusinessDocumentViewSet

router = DefaultRouter()
router.register(r"", BusinessDocumentViewSet, basename="document")

urlpatterns = [
    path("", include(router.urls)),
]
