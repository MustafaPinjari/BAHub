from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from organizations.models import Organization
from teams.models import Team

User = get_user_model()

class TeamManagementTests(APITestCase):
    def setUp(self):
        # Create Organizations
        self.org_a = Organization.objects.create(name="Org A")
        self.org_b = Organization.objects.create(name="Org B")

        # Create Users for Org A
        self.admin_a = User.objects.create_user(
            username="admin_a", password="Password123!", role=User.ADMIN, organization=self.org_a
        )
        self.analyst_a = User.objects.create_user(
            username="analyst_a", password="Password123!", role=User.BUSINESS_ANALYST, organization=self.org_a
        )
        self.dev_a = User.objects.create_user(
            username="dev_a", password="Password123!", role=User.DEVELOPER, organization=self.org_a
        )

        # Create User for Org B
        self.analyst_b = User.objects.create_user(
            username="analyst_b", password="Password123!", role=User.BUSINESS_ANALYST, organization=self.org_b
        )

        # Create team in Org A
        self.team_a = Team.objects.create(
            name="Team Alpha",
            organization=self.org_a,
            lead=self.analyst_a,
        )
        self.team_a.members.add(self.dev_a)

    def test_list_teams_filtered_by_organization(self):
        """A user from Org A should only see teams inside Org A."""
        self.client.force_authenticate(user=self.analyst_a)
        url = reverse("team-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check that we got self.team_a and not any teams from other organizations
        self.assertEqual(len(response.data["data"]), 1)
        self.assertEqual(response.data["data"][0]["name"], "Team Alpha")

        # Analyst B in Org B should see no teams
        self.client.force_authenticate(user=self.analyst_b)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["data"]), 0)

    def test_create_team_validations(self):
        """Verify business rules for creating a team."""
        self.client.force_authenticate(user=self.analyst_a)
        url = reverse("team-list")

        # 1. Lead must belong to the same organization
        payload_invalid_lead = {
            "name": "Team Beta",
            "lead": str(self.analyst_b.id),
        }
        response = self.client.post(url, payload_invalid_lead, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("lead", response.data["errors"])

        # 2. Members must belong to the same organization
        payload_invalid_member = {
            "name": "Team Gamma",
            "members": [str(self.analyst_b.id)],
        }
        response = self.client.post(url, payload_invalid_member, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("members", response.data["errors"])

        # 3. Successful creation: organization is auto-injected from request.user
        payload_valid = {
            "name": "Team Beta",
            "lead": str(self.analyst_a.id),
            "members": [str(self.dev_a.id)],
        }
        response = self.client.post(url, payload_valid, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["name"], "Team Beta")
        self.assertEqual(str(response.data["data"]["organization"]), str(self.org_a.id))

    def test_permissions_by_role(self):
        """Verify that write operations are restricted based on role."""
        url = reverse("team-list")
        payload = {"name": "Test Role Permissions"}

        # Developer A should not be allowed to create a team
        self.client.force_authenticate(user=self.dev_a)
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Analyst A should be allowed
        self.client.force_authenticate(user=self.analyst_a)
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_soft_delete(self):
        """Verify soft deleting a team sets is_deleted to True."""
        self.client.force_authenticate(user=self.analyst_a)
        url = reverse("team-detail", kwargs={"pk": str(self.team_a.id)})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Team should be excluded from default querysets
        self.assertFalse(Team.objects.filter(id=self.team_a.id).exists())
        # But exists when searching including deleted records
        self.assertTrue(Team.objects.all_with_deleted().filter(id=self.team_a.id).exists())
