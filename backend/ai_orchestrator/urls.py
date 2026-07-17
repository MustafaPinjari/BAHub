from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AIAdminViewSet, AIIngestionViewSet, AIDiagramViewSet

router = DefaultRouter()
router.register(r'admin/ai', AIAdminViewSet, basename='admin-ai')
router.register(r'ingest', AIIngestionViewSet, basename='ingest')
router.register(r'diagram', AIDiagramViewSet, basename='diagram')

urlpatterns = [
    path('', include(router.urls)),
]
