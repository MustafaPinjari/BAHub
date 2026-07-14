from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, TagViewSet, BlogPostViewSet, RelatedArticleViewSet

router = DefaultRouter()
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"tags", TagViewSet, basename="tag")
router.register(r"posts", BlogPostViewSet, basename="blogpost")
router.register(r"related", RelatedArticleViewSet, basename="related-article")

urlpatterns = [
    path("", include(router.urls)),
]
