from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from organizations.models import Organization
from projects.models import Project
from requirements.models import Requirement
from .models import TestCase, Defect

User = get_user_model()

class UatAPITests(APITestCase):
    def setUp(self):
        # Create Org A and User A
        self.org_a = Organization.objects.create(name="Organization A")
        self.user_a = User.objects.create_user(
            username="usera",
            email="usera@orga.com",
            password="TestPassword123!",
            organization=self.org_a
        )

        # Create Org B and User B
        self.org_b = Organization.objects.create(name="Organization B")
        self.user_b = User.objects.create_user(
            username="userb",
            email="userb@orgb.com",
            password="TestPassword123!",
            organization=self.org_b
        )

        # Create Project in Org A
        self.project_a = Project.objects.create(
            name="Project A",
            description="Project of Org A",
            organization=self.org_a
        )

        # Create Project in Org B
        self.project_b = Project.objects.create(
            name="Project B",
            description="Project of Org B",
            organization=self.org_b
        )

        # Create Requirement in Project A
        self.requirement_a = Requirement.objects.create(
            project=self.project_a,
            title="Req A",
            description="Requirement A details"
        )

    def test_create_test_case_success(self):
        """Verify authorized user can create a test case for their project."""
        self.client.force_authenticate(user=self.user_a)
        url = reverse("testcase-list")
        payload = {
            "project": str(self.project_a.id),
            "requirement": str(self.requirement_a.id),
            "title": "Verify Login Flow",
            "scenario": "Open login, type credentials, press login",
            "acceptance_criteria": "User should see dashboard overview page",
            "status": "PENDING"
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(TestCase.objects.count(), 1)
        
        tc = TestCase.objects.first()
        self.assertEqual(tc.created_by, self.user_a)
        self.assertEqual(tc.title, "Verify Login Flow")

    def test_create_test_case_tenant_isolation(self):
        """Verify User A cannot create a test case for Project B (different organization)."""
        self.client.force_authenticate(user=self.user_a)
        url = reverse("testcase-list")
        payload = {
            "project": str(self.project_b.id),
            "title": "Malicious Test Case",
            "status": "PENDING"
        }
        response = self.client.post(url, payload)
        # Should return 400 validation error due to serializer tenancy check
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Cannot link to a project outside your organization", str(response.data))

    def test_get_test_cases_isolation(self):
        """Verify User A only sees test cases belonging to their organization."""
        # Create test case for Org A
        TestCase.objects.create(
            project=self.project_a,
            title="TC Org A",
            status="PENDING"
        )
        # Create test case for Org B
        TestCase.objects.create(
            project=self.project_b,
            title="TC Org B",
            status="PENDING"
        )

        self.client.force_authenticate(user=self.user_a)
        url = reverse("testcase-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("data", response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["title"], "TC Org A")

    def test_create_and_link_defect(self):
        """Verify User A can execute a test case, fail it, and create/link a defect."""
        self.client.force_authenticate(user=self.user_a)
        tc = TestCase.objects.create(
            project=self.project_a,
            title="Integration test scenario",
            status="PENDING"
        )

        # Fail the test case
        url_tc = reverse("testcase-detail", args=[tc.id])
        response_tc = self.client.patch(url_tc, {"status": "FAILED"})
        self.assertEqual(response_tc.status_code, status.HTTP_200_OK)
        self.assertEqual(response_tc.data["status"], "FAILED")

        # Report defect linked to this test case
        url_df = reverse("defect-list")
        payload = {
            "project": str(self.project_a.id),
            "test_case": str(tc.id),
            "title": "Bug in API integration",
            "description": "API returned 500 error",
            "severity": "CRITICAL",
            "status": "OPEN"
        }
        response_df = self.client.post(url_df, payload)
        self.assertEqual(response_df.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Defect.objects.count(), 1)
        
        defect = Defect.objects.first()
        self.assertEqual(defect.test_case, tc)
        self.assertEqual(defect.severity, "CRITICAL")
        self.assertEqual(defect.status, "OPEN")
