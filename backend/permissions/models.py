from django.db import models
from core.models import BaseModel
from organizations.models import Organization
from django.conf import settings

class Permission(BaseModel):
    """
    Model representing specific action permissions (e.g. create_project, edit_requirement).
    """
    name = models.CharField(max_length=255)
    codename = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "permissions_registry"
        ordering = ["codename"]

    def __str__(self):
        return f"{self.name} ({self.codename})"

class Role(BaseModel):
    """
    Tenant-scoped Role aggregating multiple Permissions.
    """
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="roles"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    permissions = models.ManyToManyField(
        Permission,
        related_name="roles",
        blank=True
    )

    class Meta:
        db_table = "roles"
        ordering = ["name"]
        unique_together = ("organization", "name")

    def __str__(self):
        return f"{self.name} ({self.organization.name})"

class UserRole(BaseModel):
    """
    Junction model mapping Users to Roles.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_roles"
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name="user_roles"
    )

    class Meta:
        db_table = "user_roles"
        unique_together = ("user", "role")

    def __str__(self):
        return f"{self.user.username} - {self.role.name}"

class UserPermissionOverride(BaseModel):
    """
    Custom user-specific permission overrides. Allows granting or revoking specific permissions.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="permission_overrides"
    )
    permission = models.ForeignKey(
        Permission,
        on_delete=models.CASCADE,
        related_name="user_overrides"
    )
    is_allowed = models.BooleanField(default=True)

    class Meta:
        db_table = "user_permission_overrides"
        unique_together = ("user", "permission")

    def __str__(self):
        state = "Granted" if self.is_allowed else "Revoked"
        return f"{self.user.username} - {self.permission.codename} ({state})"
