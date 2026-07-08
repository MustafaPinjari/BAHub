from django.contrib import admin
from .models import TestCase, Defect

@admin.register(TestCase)
class TestCaseAdmin(admin.ModelAdmin):
    list_display = ("title", "project", "requirement", "status", "created_by", "created_at")
    list_filter = ("status",)
    search_fields = ("title", "scenario", "acceptance_criteria", "project__name")

@admin.register(Defect)
class DefectAdmin(admin.ModelAdmin):
    list_display = ("title", "project", "test_case", "severity", "status", "created_by", "created_at")
    list_filter = ("severity", "status")
    search_fields = ("title", "description", "project__name", "test_case__title")
