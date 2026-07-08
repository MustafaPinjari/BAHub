from django.contrib import admin
from .models import Organization, OrganizationInvitation

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "phone", "website", "created_at")
    search_fields = ("name", "email")

@admin.register(OrganizationInvitation)
class OrganizationInvitationAdmin(admin.ModelAdmin):
    list_display = ("email", "organization", "role", "is_used", "expires_at", "created_at")
    list_filter = ("role", "is_used")
    search_fields = ("email", "organization__name")
