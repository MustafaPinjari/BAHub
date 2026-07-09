from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, UserPreference, EmailOTP

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "email", "role", "organization", "is_staff", "is_superuser")
    list_filter = ("role", "is_staff", "is_superuser", "is_deleted")
    search_fields = ("username", "email")
    fieldsets = UserAdmin.fieldsets + (
        ("Custom Profile", {"fields": ("role", "organization", "phone", "bio", "profile_picture", "is_deleted")}),
    )

admin.site.register(UserPreference)
admin.site.register(EmailOTP)

