from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TemplateViewSet, PublicTemplateViewSet, TemplateReviewViewSet

router = DefaultRouter()
router.register(r'templates', TemplateViewSet, basename='templates')
router.register(r'public', PublicTemplateViewSet, basename='public-templates')
router.register(r'reviews', TemplateReviewViewSet, basename='template-reviews')

urlpatterns = [
    path('', include(router.urls)),
]
