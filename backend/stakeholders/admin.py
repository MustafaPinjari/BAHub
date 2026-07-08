from django.contrib import admin
from .models import Stakeholder

@admin.register(Stakeholder)
class StakeholderAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "project", "role", "influence", "support", "created_at")
    list_filter = ("influence", "support")
    search_fields = ("name", "organization__name", "project__name")
