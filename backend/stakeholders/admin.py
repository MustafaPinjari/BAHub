from django.contrib import admin
from .models import Stakeholder

@admin.register(Stakeholder)
class StakeholderAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "project", "title", "power", "interest", "influence", "impact", "created_at")
    list_filter = ("power", "interest", "influence", "impact")
    search_fields = ("name", "organization__name", "project__name")

