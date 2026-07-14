from django.db import models
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from django.utils import timezone
from core.models import BaseModel

User = get_user_model()


class Category(BaseModel):
    """Blog post categories for organization."""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = "blog_categories"
        ordering = ["order", "name"]
        verbose_name_plural = "Categories"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Tag(BaseModel):
    """Blog post tags for flexible categorization."""
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=60, unique=True)

    class Meta:
        db_table = "blog_tags"
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class BlogPost(BaseModel):
    """Blog post model with SEO and content management features."""
    STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("PUBLISHED", "Published"),
        ("ARCHIVED", "Archived"),
    ]

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, unique=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="blog_posts")
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, related_name="posts"
    )
    tags = models.ManyToManyField(Tag, blank=True, related_name="posts")
    
    # Content
    excerpt = models.TextField(max_length=500, help_text="Short description for listings")
    content = models.TextField()
    featured_image = models.URLField(blank=True, help_text="URL to featured image")
    
    # SEO
    meta_title = models.CharField(max_length=60, blank=True, help_text="SEO title (max 60 chars)")
    meta_description = models.TextField(max_length=160, blank=True, help_text="SEO description (max 160 chars)")
    focus_keyword = models.CharField(max_length=100, blank=True)
    
    # Metadata
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="DRAFT")
    published_at = models.DateTimeField(null=True, blank=True)
    reading_time = models.IntegerField(default=5, help_text="Estimated reading time in minutes")
    views = models.IntegerField(default=0)
    
    # OpenGraph
    og_image = models.URLField(blank=True, help_text="OpenGraph image URL")
    og_type = models.CharField(max_length=50, default="article")

    class Meta:
        db_table = "blog_posts"
        ordering = ["-published_at", "-created_at"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["status", "published_at"]),
            models.Index(fields=["category"]),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        if self.status == "PUBLISHED" and not self.published_at:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return f"/blog/{self.slug}/"


class RelatedArticle(BaseModel):
    """Manual related article links for curated content relationships."""
    post = models.ForeignKey(
        BlogPost, on_delete=models.CASCADE, related_name="related_links"
    )
    related_post = models.ForeignKey(
        BlogPost, on_delete=models.CASCADE, related_name="related_to"
    )
    order = models.IntegerField(default=0)

    class Meta:
        db_table = "blog_related_articles"
        ordering = ["order"]
        unique_together = ("post", "related_post")
