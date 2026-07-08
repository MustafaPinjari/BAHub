from django.contrib import admin
from .models import SWOTAnalysis, GapAnalysis

@admin.register(SWOTAnalysis)
class SWOTAnalysisAdmin(admin.ModelAdmin):
    list_display = ("project",)
    search_fields = ("project__name",)

@admin.register(GapAnalysis)
class GapAnalysisAdmin(admin.ModelAdmin):
    list_display = ("title", "project", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("title", "current_state", "future_state", "project__name")
