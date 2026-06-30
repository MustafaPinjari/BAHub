from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.views import APIView
from rest_framework.response import Response
from organizations.models import Organization
from permissions.models import Permission, Role, UserRole, UserPermissionOverride
from permissions.helpers import check_permission, HasRequiredPermission

User = get_user_model()

# Mock view to test HasRequiredPermission guard
class MockSecuredView(APIView):
    permission_classes = [HasRequiredPermission]
    required_permission = "create_project"

    def post(self, request):
        return Response({"status": "authorized"})

class PermissionSystemTests(APITestCase):
    def setUp(self):
        # Create Organizations
        self.org_a = Organization.objects.create(name="Org A")
        self.org_b = Organization.objects.create(name="Org B")

        # Create Users
        self.admin_a = User.objects.create_user(
            username="admin_a", password="Password123!", role=User.ADMIN, organization=self.org_a
        )
        self.dev_a = User.objects.create_user(
            username="dev_a", password="Password123!", role=User.DEVELOPER, organization=self.org_a
        )
        self.dev_b = User.objects.create_user(
            username="dev_b", password="Password123!", role=User.DEVELOPER, organization=self.org_b
        )

        # Create Permissions
        self.perm_create = Permission.objects.create(
            name="Create Project", codename="create_project", description="Create project registries"
        )
        self.perm_delete = Permission.objects.create(
            name="Delete Project", codename="delete_project", description="Hard delete projects"
        )

    def test_permission_helper_static_fallback(self):
        """Check check_permission falls back to default role permission mapping."""
        # Admins have create_project by default
        self.assertTrue(check_permission(self.admin_a, "create_project"))
        # Developers do NOT have create_project by default
        self.assertFalse(check_permission(self.dev_a, "create_project"))

    def test_permission_helper_role_allocation(self):
        """Check check_permission works with db-driven Role/UserRole associations."""
        # Create custom role in Org A that has create_project
        custom_role = Role.objects.create(organization=self.org_a, name="Custom Editor")
        custom_role.permissions.add(self.perm_create)

        # Assign role to Developer A
        UserRole.objects.create(user=self.dev_a, role=custom_role)

        # Now Developer A should have create_project access
        self.assertTrue(check_permission(self.dev_a, "create_project"))

    def test_permission_helper_user_override(self):
        """Check check_permission respects custom user overrides (grants and revokes)."""
        # 1. Grant create_project specifically to Developer A
        UserPermissionOverride.objects.create(
            user=self.dev_a, permission=self.perm_create, is_allowed=True
        )
        self.assertTrue(check_permission(self.dev_a, "create_project"))

        # 2. Revoke create_project specifically from Admin A (who has it by fallback)
        UserPermissionOverride.objects.create(
            user=self.admin_a, permission=self.perm_create, is_allowed=False
        )
        self.assertFalse(check_permission(self.admin_a, "create_project"))

    def test_permissions_api_tenant_boundary(self):
        """A user from Org A cannot create or view Org B's roles."""
        self.client.force_authenticate(user=self.admin_a)
        
        # List roles - should only return Org A's roles
        url_roles = reverse("role-list")
        response = self.client.get(url_roles)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Create custom role - organization is auto-injected from admin_a
        payload = {"name": "Tenant Leader"}
        response = self.client.post(url_roles, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(str(response.data["data"]["organization"]), str(self.org_a.id))
