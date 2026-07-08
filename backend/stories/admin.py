from django.contrib import admin
from .models import UserStory

@admin.register(UserStory)
class UserStoryAdmin(admin.ModelAdmin):
    list_display = ("story_id", "title", "requirement", "points", "status", "created_at")
    list_filter = ("status", "points")
    search_fields = ("story_id", "title", "acceptance_criteria", "requirement__title")
