from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from organizations.models import Organization
from projects.models import Project, ProjectMember

User = get_user_model()

class ProjectManagementTests(APITestCase):
    def setUp(self):
        # Create Organizations
        self.org_a = Organization.objects.create(name="Org A")
        self.org_b = Organization.objects.create(name="Org B")

        # Create Users
        self.admin_a = User.objects.create_user(
            username="admin_a", password="Password123!", role=User.ADMIN, organization=self.org_a
        )
        self.analyst_a = User.objects.create_user(
            username="analyst_a", password="Password123!", role=User.BUSINESS_ANALYST, organization=self.org_a
        )
        self.dev_a = User.objects.create_user(
            username="dev_a", password="Password123!", role=User.DEVELOPER, organization=self.org_a
        )
        self.dev_b = User.objects.create_user(
            username="dev_b", password="Password123!", role=User.DEVELOPER, organization=self.org_b
        )

        # Create Projects
        self.project_a1 = Project.objects.create(
            organization=self.org_a, name="Project Alpha", description="Org A Project 1"
        )
        self.project_a2 = Project.objects.create(
            organization=self.org_a, name="Project Beta", description="Org A Project 2"
        )

        # Map memberships
        ProjectMember.objects.create(project=self.project_a1, user=self.analyst_a, role="PROJECT_MANAGER")
        ProjectMember.objects.create(project=self.project_a1, user=self.dev_a, role="CONTRIBUTOR")

    def test_project_listing_rules(self):
        """Verify project query list isolation rules."""
        # 1. Admin A should see all projects in Org A (Alpha & Beta)
        self.client.force_authenticate(user=self.admin_a)
        url = reverse("project-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["data"]), 2)

        # 2. Developer A (non-admin/non-manager) should see only projects they belong to (Alpha)
        self.client.force_authenticate(user=self.dev_a)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["data"]), 1)
        self.assertEqual(response.data["data"][0]["name"], "Project Alpha")

    def test_create_project_and_membership(self):
        """Creating a project automatically makes the creator its Project Manager."""
        self.client.force_authenticate(user=self.analyst_a)
        url = reverse("project-list")
        payload = {"name": "Project Gamma", "description": "New project"}
        
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify DB entry
        proj = Project.objects.get(name="Project Gamma")
        self.assertEqual(proj.organization, self.org_a)
        
        # Check ProjectMember auto-assignment
        member_map = ProjectMember.objects.get(project=proj, user=self.analyst_a)
        self.assertEqual(member_map.role, "PROJECT_MANAGER")

    def test_membership_organization_validation(self):
        """Cannot assign a user to a project if they belong to a different organization."""
        self.client.force_authenticate(user=self.admin_a)
        url = reverse("project-member-list")
        payload = {
            "project": str(self.project_a1.id),
            "user": str(self.dev_b.id),
            "role": "CONTRIBUTOR",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("non_field_errors", response.data["errors"])

    def test_project_strategic_report(self):
        """Verify project strategic report compilation endpoint aggregates metrics."""
        self.client.force_authenticate(user=self.analyst_a)
        url = reverse("project-report", kwargs={"pk": str(self.project_a1.id)})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("requirements", response.data["data"])
        self.assertIn("stories", response.data["data"])
        self.assertIn("risks", response.data["data"])
        self.assertIn("meetings", response.data["data"])
