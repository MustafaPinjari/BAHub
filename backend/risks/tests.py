from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from organizations.models import Organization
from projects.models import Project
from risks.models import Risk, ChangeRequest

User = get_user_model()

class RiskAndChangeManagementTests(APITestCase):
    def setUp(self):
        # Create Organizations
        self.org_a = Organization.objects.create(name="Org A")
        self.org_b = Organization.objects.create(name="Org B")

        # Create Users
        self.analyst_a = User.objects.create_user(
            username="analyst_a", password="Password123!", role=User.BUSINESS_ANALYST, organization=self.org_a
        )
        self.po_a = User.objects.create_user(
            username="po_a", password="Password123!", role=User.PRODUCT_OWNER, organization=self.org_a
        )
        self.developer_a = User.objects.create_user(
            username="developer_a", password="Password123!", role=User.DEVELOPER, organization=self.org_a
        )

        # Create Projects
        self.project_a = Project.objects.create(
            organization=self.org_a, name="Project Alpha", description="Org A Project 1"
        )
        self.project_b = Project.objects.create(
            organization=self.org_b, name="Project Beta", description="Org B Project 1"
        )

    def test_risk_crud_and_boundary(self):
        """Verify risk catalog creation constraints and tenant isolation."""
        self.client.force_authenticate(user=self.analyst_a)
        url_risk = reverse("risk-list")

        # 1. Attempt to log risk for Project B (belongs to Org B)
        payload_invalid = {
            "project": str(self.project_b.id),
            "title": "System Outage",
            "description": "Integration breakdown.",
            "probability": "HIGH",
            "impact": "HIGH",
            "mitigation": "Backup server.",
        }
        response = self.client.post(url_risk, payload_invalid, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # 2. Successfully create risk
        payload_valid = {
            "project": str(self.project_a.id),
            "title": "System Outage",
            "description": "Integration breakdown.",
            "probability": "HIGH",
            "impact": "HIGH",
            "mitigation": "Backup server.",
        }
        res_ok = self.client.post(url_risk, payload_valid, format="json")
        self.assertEqual(res_ok.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_ok.data["data"]["title"], "System Outage")

    def test_change_request_reviews(self):
        """Verify change control pipelines and sign-off restrictions."""
        self.client.force_authenticate(user=self.analyst_a)
        url_cr = reverse("changerequest-list")

        # 1. File change request
        payload = {
            "project": str(self.project_a.id),
            "title": "Add MFA to Portal",
            "description": "Additional authentication step.",
            "reason": "Customer security request.",
            "impact_analysis": "Adds 2 sprints effort.",
        }
        res_create = self.client.post(url_cr, payload, format="json")
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        cr_id = res_create.data["data"]["id"]

        # 2. Developer reviews change (Should be rejected)
        self.client.force_authenticate(user=self.developer_a)
        url_review = reverse("changerequest-review-change", kwargs={"pk": cr_id})
        res_dev = self.client.post(url_review, {"status": "APPROVED"}, format="json")
        self.assertEqual(res_dev.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Product Owner approves change
        self.client.force_authenticate(user=self.po_a)
        res_po = self.client.post(url_review, {"status": "APPROVED"}, format="json")
        self.assertEqual(res_po.status_code, status.HTTP_200_OK)
        self.assertEqual(res_po.data["data"]["status"], "APPROVED")
        self.assertEqual(res_po.data["data"]["reviewed_by_username"], "po_a")
