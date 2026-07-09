from django.contrib import admin
from .models import Risk, ChangeRequest

@admin.register(Risk)
class RiskAdmin(admin.ModelAdmin):
    list_display = ("title", "project", "probability", "impact", "status", "created_at")
    list_filter = ("probability", "impact", "status")
    search_fields = ("title", "description", "project__name")

@admin.register(ChangeRequest)
class ChangeRequestAdmin(admin.ModelAdmin):
    list_display = ("title", "project", "status", "requested_by", "reviewed_by", "created_at")
    list_filter = ("status",)
    search_fields = ("title", "description", "project__name", "requested_by__username")

