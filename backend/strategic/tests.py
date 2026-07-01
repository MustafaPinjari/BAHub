from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from organizations.models import Organization
from projects.models import Project
from strategic.models import SWOTAnalysis, GapAnalysis

User = get_user_model()

class StrategicManagementTests(APITestCase):
    def setUp(self):
        # Create Organizations
        self.org_a = Organization.objects.create(name="Org A")
        self.org_b = Organization.objects.create(name="Org B")

        # Create Users
        self.analyst_a = User.objects.create_user(
            username="analyst_a", password="Password123!", role=User.BUSINESS_ANALYST, organization=self.org_a
        )
        self.analyst_b = User.objects.create_user(
            username="analyst_b", password="Password123!", role=User.BUSINESS_ANALYST, organization=self.org_b
        )

        # Create Projects
        self.project_a = Project.objects.create(
            organization=self.org_a, name="Project Alpha", description="Org A Project 1"
        )
        self.project_b = Project.objects.create(
            organization=self.org_b, name="Project Beta", description="Org B Project 1"
        )

    def test_swot_auto_provisioning_and_isolation(self):
        """Verify SWOT gets automatically provisioned or isolated by tenant."""
        self.client.force_authenticate(user=self.analyst_a)
        url_swot = reverse("swotanalysis-list")

        # 1. Query for Project B SWOT (Should be denied)
        res_fail = self.client.get(f"{url_swot}?project={self.project_b.id}")
        self.assertEqual(res_fail.status_code, status.HTTP_400_BAD_REQUEST)

        # 2. Query for Project A SWOT (Should auto-create a blank SWOT grid)
        res_ok = self.client.get(f"{url_swot}?project={self.project_a.id}")
        self.assertEqual(res_ok.status_code, status.HTTP_200_OK)
        self.assertEqual(res_ok.data["data"]["strengths"], "")
        swot_id = res_ok.data["data"]["id"]

        # 3. Update SWOT grid
        url_detail = reverse("swotanalysis-detail", kwargs={"pk": swot_id})
        payload = {
            "project": str(self.project_a.id),
            "strengths": "Fast loading times\nStrong tech stack",
            "weaknesses": "Small team",
            "opportunities": "Untapped markets",
            "threats": "Fast competitors"
        }
        res_update = self.client.put(url_detail, payload, format="json")
        self.assertEqual(res_update.status_code, status.HTTP_200_OK)
        self.assertIn("Fast loading times", res_update.data["data"]["strengths"])

    def test_gap_analysis_crud(self):
        """Verify Gap Analysis CRUD operations and status validation."""
        self.client.force_authenticate(user=self.analyst_a)
        url_gap = reverse("gapanalysis-list")

        # 1. Attempt to create Gap for Project B (Should fail)
        payload_invalid = {
            "project": str(self.project_b.id),
            "title": "Stripe Integration Gap",
            "current_state": "Manual invoices",
            "future_state": "Automated billing",
            "gap_description": "Lacks Stripe portal",
            "action_plan": "Develop webhook triggers",
            "status": "IDENTIFIED"
        }
        res_fail = self.client.post(url_gap, payload_invalid, format="json")
        self.assertEqual(res_fail.status_code, status.HTTP_400_BAD_REQUEST)

        # 2. Successfully create Gap
        payload_valid = {
            "project": str(self.project_a.id),
            "title": "Stripe Integration Gap",
            "current_state": "Manual invoices",
            "future_state": "Automated billing",
            "gap_description": "Lacks Stripe portal",
            "action_plan": "Develop webhook triggers",
            "status": "IDENTIFIED"
        }
        res_ok = self.client.post(url_gap, payload_valid, format="json")
        self.assertEqual(res_ok.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_ok.data["data"]["title"], "Stripe Integration Gap")

    def test_ai_analyst_chat_simulation(self):
        """Verify AI Business Analyst chat responses and prompt parameters."""
        self.client.force_authenticate(user=self.analyst_a)
        url_chat = reverse("ai-chat")

        # 1. Ask for general analysis (Default prompt)
        res_default = self.client.post(
            url_chat, 
            {"project_id": str(self.project_a.id), "message": "hello context"}, 
            format="json"
        )
        self.assertEqual(res_default.status_code, status.HTTP_200_OK)
        self.assertIn("Business Analyst", res_default.data["data"]["reply"])

        # 2. Ask to generate user stories
        res_stories = self.client.post(
            url_chat, 
            {"project_id": str(self.project_a.id), "message": "Draft user stories for login", "action_type": "GENERATE_STORIES"}, 
            format="json"
        )
        self.assertEqual(res_stories.status_code, status.HTTP_200_OK)
        self.assertIn("US-010", res_stories.data["data"]["reply"])
