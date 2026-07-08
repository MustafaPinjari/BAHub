from django.contrib import admin
from .models import Meeting, ActionItem

@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ("title", "project", "date", "time", "created_at")
    search_fields = ("title", "objective", "notes", "project__name")

@admin.register(ActionItem)
class ActionItemAdmin(admin.ModelAdmin):
    list_display = ("description", "meeting", "assignee", "due_date", "status")
    list_filter = ("status",)
    search_fields = ("description", "meeting__title", "assignee__username")
