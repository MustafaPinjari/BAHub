from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from organizations.models import Organization
from projects.models import Project
from requirements.models import Requirement
from stories.models import UserStory

User = get_user_model()

class UserStoryManagementTests(APITestCase):
    def setUp(self):
        # Create Organizations
        self.org_a = Organization.objects.create(name="Org A")
        self.org_b = Organization.objects.create(name="Org B")

        # Create Users
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

        # Create Requirements
        self.req_a = Requirement.objects.create(
            project=self.project_a,
            title="Authentication Requirement",
            description="Users must login securely.",
        )
        self.req_b = Requirement.objects.create(
            project=self.project_b,
            title="Billing Integration",
            description="Users pay via Stripe.",
        )

    def test_create_story_auto_id(self):
        """Verify user story IDs auto-increment sequentially per project context."""
        self.client.force_authenticate(user=self.analyst_a)
        url = reverse("story-list")

        # 1. Create first story
        payload_1 = {
            "requirement": str(self.req_a.id),
            "title": "Email login form",
            "role": "User",
            "action": "input credentials",
            "benefit": "access my account dashboard",
            "points": 3,
        }
        response = self.client.post(url, payload_1, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["story_id"], "US-001")

        # 2. Create second story
        payload_2 = {
            "requirement": str(self.req_a.id),
            "title": "OAuth SSO Google",
            "role": "User",
            "action": "click login with Google",
            "benefit": "authenticate instantly",
            "points": 5,
        }
        response = self.client.post(url, payload_2, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["story_id"], "US-002")

    def test_story_validations_and_ai_generator(self):
        """Verify boundary checks and the AI user story generation endpoint."""
        self.client.force_authenticate(user=self.analyst_a)

        # 1. Map to requirement belonging to another organization (Stripe in Org B)
        url_list = reverse("story-list")
        payload_invalid = {
            "requirement": str(self.req_b.id),
            "title": "Invalid Trace",
            "role": "User",
            "action": "invalid action",
            "benefit": "none",
        }
        response = self.client.post(url_list, payload_invalid, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # 2. Trigger AI Story Generator Action
        url_generate = reverse("story-generate-story")
        payload_ai = {"requirement": str(self.req_a.id)}
        response = self.client.post(url_generate, payload_ai, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Story for REQ-001", response.data["data"]["title"])
        self.assertIn("GIVEN", response.data["data"]["acceptance_criteria"])
