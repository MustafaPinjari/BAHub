from rest_framework import serializers
from .models import BlogPost, Category, Tag, RelatedArticle
from django.contrib.auth import get_user_model

User = get_user_model()


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for blog categories."""
    post_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "order", "post_count"]

    def get_post_count(self, obj):
        return obj.posts.filter(status="PUBLISHED").count()


class TagSerializer(serializers.ModelSerializer):
    """Serializer for blog tags."""
    post_count = serializers.SerializerMethodField()

    class Meta:
        model = Tag
        fields = ["id", "name", "slug", "post_count"]

    def get_post_count(self, obj):
        return obj.posts.filter(status="PUBLISHED").count()


class AuthorSerializer(serializers.ModelSerializer):
    """Minimal author serializer for blog posts."""
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class BlogPostListSerializer(serializers.ModelSerializer):
    """Serializer for blog post listings (excludes full content)."""
    author = AuthorSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    reading_time_display = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = [
            "id",
            "title",
            "slug",
            "author",
            "category",
            "tags",
            "excerpt",
            "featured_image",
            "published_at",
            "reading_time",
            "reading_time_display",
            "views",
        ]

    def get_reading_time_display(self, obj):
        return f"{obj.reading_time} min read"


class BlogPostDetailSerializer(serializers.ModelSerializer):
    """Full serializer for blog post details."""
    author = AuthorSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    related_posts = serializers.SerializerMethodField()
    reading_time_display = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = [
            "id",
            "title",
            "slug",
            "author",
            "category",
            "tags",
            "excerpt",
            "content",
            "featured_image",
            "meta_title",
            "meta_description",
            "focus_keyword",
            "published_at",
            "reading_time",
            "reading_time_display",
            "views",
            "og_image",
            "og_type",
            "related_posts",
        ]

    def get_reading_time_display(self, obj):
        return f"{obj.reading_time} min read"

    def get_related_posts(self, obj):
        related = obj.related_links.select_related("related_post").order_by("order")[:3]
        return BlogPostListSerializer(
            [r.related_post for r in related if r.related_post.status == "PUBLISHED"],
            many=True,
        ).data


class RelatedArticleSerializer(serializers.ModelSerializer):
    """Serializer for manual related article links."""
    related_post = BlogPostListSerializer(read_only=True)

    class Meta:
        model = RelatedArticle
        fields = ["id", "related_post", "order"]
