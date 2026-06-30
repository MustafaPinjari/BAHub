from .models import UserRole, UserPermissionOverride, Permission
from rest_framework import permissions

DEFAULT_ROLE_PERMISSIONS = {
    "ADMIN": {
        "create_project", "edit_project", "delete_project", 
        "create_team", "edit_team", "delete_team", "manage_permissions",
        "create_requirement", "edit_requirement", "delete_requirement", "approve_brd"
    },
    "BUSINESS_ANALYST": {
        "create_project", "edit_project", 
        "create_team", "edit_team",
        "create_requirement", "edit_requirement", "approve_brd"
    },
    "PRODUCT_OWNER": {
        "create_project", "edit_project", 
        "create_team", "edit_team",
        "create_requirement", "edit_requirement", "approve_brd"
    },
    "DEVELOPER": {
        "edit_requirement"
    },
    "QA_TESTER": {},
    "STAKEHOLDER": {},
}

def check_permission(user, codename: str) -> bool:
    """
    Verify if a user has access to a specific action permission:
    1. Evaluates custom UserPermissionOverride overrides.
    2. Checks database-driven Role allocations.
    3. Falls back to static defaults based on user.role properties.
    """
    if not user.is_authenticated:
        return False

    if user.is_superuser:
        return True

    # 1. Custom User Override Check
    override = UserPermissionOverride.objects.filter(
        user=user, 
        permission__codename=codename
    ).first()
    if override is not None:
        return override.is_allowed

    # 2. Database Role Allocations Check
    has_role_perm = UserRole.objects.filter(
        user=user,
        role__permissions__codename=codename,
        role__is_deleted=False
    ).exists()
    if has_role_perm:
        return True

    # 3. Default static roles fallback mapping
    default_set = DEFAULT_ROLE_PERMISSIONS.get(user.role, set())
    return codename in default_set

class HasRequiredPermission(permissions.BasePermission):
    """
    DRF Custom Permission class ensuring that the user possesses the view's action permission.
    Example view set configuration:
    `required_permission = "create_project"`
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True

        required_perm = getattr(view, "required_permission", None)
        if not required_perm:
            return True # Passes automatically if no perm specified

        return check_permission(request.user, required_perm)
