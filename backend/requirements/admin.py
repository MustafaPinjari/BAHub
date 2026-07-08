from django.contrib import admin
from .models import Requirement

@admin.register(Requirement)
class RequirementAdmin(admin.ModelAdmin):
    list_display = ("req_id", "title", "project", "req_type", "status", "priority", "created_at")
    list_filter = ("req_type", "status", "priority")
    search_fields = ("req_id", "title", "description", "project__name")
