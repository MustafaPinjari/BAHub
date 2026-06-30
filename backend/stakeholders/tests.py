from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from organizations.models import Organization
from projects.models import Project
from stakeholders.models import Stakeholder

User = get_user_model()

class StakeholderManagementTests(APITestCase):
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

        # Create Projects
        self.project_a = Project.objects.create(
            organization=self.org_a, name="Project Alpha", description="Org A Project 1"
        )
        self.project_b = Project.objects.create(
            organization=self.org_b, name="Project Beta", description="Org B Project 1"
        )

        # Create Stakeholders
        self.st_a1 = Stakeholder.objects.create(
            organization=self.org_a,
            project=self.project_a,
            name="John Doe",
            title="Sponsor",
            power="HIGH",
            interest="HIGH",
        )
        self.st_a2 = Stakeholder.objects.create(
            organization=self.org_a,
            name="Jane Smith",
            title="SME",
            power="LOW",
            interest="HIGH",
        )

    def test_list_stakeholders_isolation(self):
        """List displays only stakeholders of the requesting user's organization."""
        self.client.force_authenticate(user=self.analyst_a)
        url = reverse("stakeholder-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return both Doe and Smith
        self.assertEqual(len(response.data["data"]), 2)

    def test_list_stakeholders_project_filter(self):
        """Filtering display by project query param returns matching stakeholders."""
        self.client.force_authenticate(user=self.analyst_a)
        url = reverse("stakeholder-list")
        response = self.client.get(f"{url}?project={self.project_a.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only return John Doe (assigned to project_a)
        self.assertEqual(len(response.data["data"]), 1)
        self.assertEqual(response.data["data"][0]["name"], "John Doe")

    def test_create_stakeholder_validation(self):
        """Verify stakeholder metrics constraints on creation."""
        self.client.force_authenticate(user=self.analyst_a)
        url = reverse("stakeholder-list")

        # 1. Invalid rating range
        payload_invalid_score = {
            "name": "Bob Vance",
            "title": "Director",
            "influence": 6,  # max is 5
        }
        response = self.client.post(url, payload_invalid_score, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("influence", response.data["errors"])

        # 2. Invalid project mapping (project B belongs to Org B, analyst A belongs to Org A)
        payload_invalid_project = {
            "name": "Bob Vance",
            "title": "Director",
            "project": str(self.project_b.id),
        }
        response = self.client.post(url, payload_invalid_project, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("project", response.data["errors"])

        # 3. Valid creation
        payload_valid = {
            "name": "Bob Vance",
            "title": "Director",
            "project": str(self.project_a.id),
            "influence": 4,
            "impact": 5,
        }
        response = self.client.post(url, payload_valid, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["name"], "Bob Vance")
        self.assertEqual(str(response.data["data"]["organization"]), str(self.org_a.id))
