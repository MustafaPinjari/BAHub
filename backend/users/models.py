import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from organizations.models import Organization

class User(AbstractUser):
    """
    Custom User model incorporating role definitions and linking to an Organization.
    """
    ADMIN = "ADMIN"
    BUSINESS_ANALYST = "BUSINESS_ANALYST"
    PRODUCT_OWNER = "PRODUCT_OWNER"
    DEVELOPER = "DEVELOPER"
    QA_TESTER = "QA_TESTER"
    STAKEHOLDER = "STAKEHOLDER"

    ROLE_CHOICES = [
        (ADMIN, "Admin"),
        (BUSINESS_ANALYST, "Business Analyst"),
        (PRODUCT_OWNER, "Product Owner"),
        (DEVELOPER, "Developer"),
        (QA_TESTER, "QA Tester"),
        (STAKEHOLDER, "Stakeholder"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default=BUSINESS_ANALYST)
    organization = models.ForeignKey(
        Organization, 
        on_delete=models.SET_NULL, 
        related_name="users", 
        null=True, 
        blank=True
    )
    phone = models.CharField(max_length=30, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to="profile_pictures/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        db_table = "users"
        ordering = ["username"]

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class UserPreference(models.Model):
    """
    User Preferences representing frontend UI preferences per user.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="preferences")
    theme = models.CharField(max_length=20, default="system")  # dark, light, system
    accent_color = models.CharField(max_length=20, default="indigo")
    language = models.CharField(max_length=10, default="en")
    timezone = models.CharField(max_length=100, default="UTC")
    date_format = models.CharField(max_length=50, default="YYYY-MM-DD")
    time_format = models.CharField(max_length=10, default="24h")  # 12h, 24h
    sidebar_state = models.CharField(max_length=20, default="expanded")  # expanded, collapsed

    class Meta:
        db_table = "user_preferences"

    def __str__(self):
        return f"Preferences for {self.user.username}"


class UserSession(models.Model):
    """
    Tracks user logins, browsers, IP addresses, and allows revoking tokens.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sessions")
    token_id = models.UUIDField(default=uuid.uuid4, editable=False)  # jti of JWT
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    browser = models.CharField(max_length=100, blank=True, null=True)
    device = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    last_activity = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_sessions"
        ordering = ["-last_activity"]

    def __str__(self):
        return f"Session {self.id} - {self.user.username} ({self.device})"
