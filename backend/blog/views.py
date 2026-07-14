from rest_framework import viewsets, permissions, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from django.utils.text import slugify
from .models import BlogPost, Category, Tag, RelatedArticle
from .serializers import (
    BlogPostListSerializer,
    BlogPostDetailSerializer,
    CategorySerializer,
    TagSerializer,
    RelatedArticleSerializer,
)
from core.responses import api_success, api_error


class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for blog categories."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Categories retrieved successfully.")


class TagViewSet(viewsets.ModelViewSet):
    """ViewSet for blog tags."""
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Tags retrieved successfully.")


class BlogPostViewSet(viewsets.ModelViewSet):
    """ViewSet for blog posts with SEO and content management."""
    queryset = BlogPost.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "list":
            return BlogPostListSerializer
        return BlogPostDetailSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve", "by_slug", "search"]:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = BlogPost.objects.select_related("author", "category").prefetch_related("tags")
        
        # Public users only see published posts
        if not self.request.user.is_authenticated or self.action in ["list", "retrieve", "by_slug", "search"]:
            queryset = queryset.filter(status="PUBLISHED")
        
        return queryset

    @action(detail=False, methods=["get"], url_path="by-slug/(?P<slug>[^/]+)")
    def by_slug(self, request, slug=None):
        """Retrieve a blog post by its slug."""
        try:
            post = self.get_queryset().get(slug=slug)
            # Increment view count
            post.views += 1
            post.save(update_fields=["views"])
            serializer = self.get_serializer(post)
            return api_success(data=serializer.data, message="Blog post retrieved successfully.")
        except BlogPost.DoesNotExist:
            return api_error(message="Blog post not found.", status_code=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=["get"], url_path="search")
    def search(self, request):
        """Search blog posts by title, content, or tags."""
        query = request.query_params.get("q", "")
        if not query:
            return api_error(message="Search query is required.")
        
        queryset = self.get_queryset()
        queryset = queryset.filter(
            title__icontains=query
        ) | queryset.filter(
            content__icontains=query
        ) | queryset.filter(
            tags__name__icontains=query
        )
        queryset = queryset.distinct()
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Search results retrieved successfully.")

    @action(detail=False, methods=["get"], url_path="by-category/(?P<category_id>[^/]+)")
    def by_category(self, request, category_id=None):
        """Retrieve blog posts by category."""
        queryset = self.get_queryset().filter(category_id=category_id)
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Category posts retrieved successfully.")

    @action(detail=False, methods=["get"], url_path="by-tag/(?P<tag_id>[^/]+)")
    def by_tag(self, request, tag_id=None):
        """Retrieve blog posts by tag."""
        queryset = self.get_queryset().filter(tags__id=tag_id)
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Tag posts retrieved successfully.")

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Blog posts retrieved successfully.")


class RelatedArticleViewSet(viewsets.ModelViewSet):
    """ViewSet for managing manual related article links."""
    queryset = RelatedArticle.objects.select_related("post", "related_post")
    serializer_class = RelatedArticleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RelatedArticle.objects.filter(post__author=self.request.user)
