from django.contrib import admin
from .models import Project, ProjectMember

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "status", "start_date", "end_date", "created_at")
    list_filter = ("status",)
    search_fields = ("name", "organization__name")

@admin.register(ProjectMember)
class ProjectMemberAdmin(admin.ModelAdmin):
    list_display = ("project", "user", "role", "created_at")
    list_filter = ("role",)
    search_fields = ("project__name", "user__username", "user__email")
