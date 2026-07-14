from django.contrib import admin
from .models import BlogPost, Category, Tag, RelatedArticle


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "order", "post_count"]
    list_editable = ["order"]
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ["name", "description"]

    def post_count(self, obj):
        return obj.posts.filter(status="PUBLISHED").count()
    post_count.short_description = "Published Posts"


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "post_count"]
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ["name"]

    def post_count(self, obj):
        return obj.posts.filter(status="PUBLISHED").count()
    post_count.short_description = "Published Posts"


class RelatedArticleInline(admin.TabularInline):
    model = RelatedArticle
    extra = 1
    fk_name = "post"
    autocomplete_fields = ["related_post"]


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "author",
        "category",
        "status",
        "published_at",
        "views",
        "reading_time",
    ]
    list_filter = ["status", "category", "tags", "published_at"]
    search_fields = ["title", "content", "excerpt"]
    prepopulated_fields = {"slug": ("title",)}
    date_hierarchy = "published_at"
    inlines = [RelatedArticleInline]
    filter_horizontal = ["tags"]
    readonly_fields = ["views"]

    fieldsets = (
        (
            "Content",
            {
                "fields": (
                    "title",
                    "slug",
                    "author",
                    "category",
                    "tags",
                    "excerpt",
                    "content",
                    "featured_image",
                )
            },
        ),
        (
            "SEO",
            {
                "fields": (
                    "meta_title",
                    "meta_description",
                    "focus_keyword",
                )
            },
        ),
        (
            "Metadata",
            {
                "fields": (
                    "status",
                    "published_at",
                    "reading_time",
                    "views",
                )
            },
        ),
        (
            "OpenGraph",
            {
                "fields": (
                    "og_image",
                    "og_type",
                )
            },
        ),
    )

    def save_model(self, request, obj, form, change):
        if not change:
            obj.author = request.user
        super().save_model(request, obj, form, change)


@admin.register(RelatedArticle)
class RelatedArticleAdmin(admin.ModelAdmin):
    list_display = ["post", "related_post", "order"]
    list_filter = ["post"]
    search_fields = ["post__title", "related_post__title"]
