import uuid
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from organizations.models import Organization, OrganizationInvitation
from billing.models import TenantSubscription
from strategic.models import Project, AIJob

User = get_user_model()

class BillingTests(APITestCase):
    def setUp(self):
        # Create an initial user and org
        self.org = Organization.objects.create(name="Billing Org")
        self.user = User.objects.create_user(
            username="admin_user",
            email="admin@billing.local",
            password="SecureP@ss123",
            role="ADMIN",
            organization=self.org
        )
        self.client.force_authenticate(user=self.user)

    def test_automatic_subscription_creation_signal(self):
        """Verify a TenantSubscription is automatically created when an Organization is saved."""
        new_org = Organization.objects.create(name="New Org")
        # Check if TenantSubscription exists
        sub = TenantSubscription.objects.filter(organization=new_org).first()
        self.assertIsNotNone(sub)
        self.assertEqual(sub.plan_tier, "FREE")
        self.assertEqual(sub.seats_limit, 5)
        self.assertEqual(sub.ai_credits_limit, 100)
        self.assertTrue(sub.is_active)

    def test_subscription_detail_endpoint(self):
        """Verify subscription/ details API endpoint."""
        url = reverse("subscription-detail")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["data"]["plan_tier"], "FREE")
        self.assertEqual(response.data["data"]["seats_limit"], 5)

    def test_checkout_session_routing_mock_mode(self):
        """Verify creating a checkout session redirects to mock upgrade URL when Stripe is unconfigured."""
        url = reverse("create-checkout-session")
        response = self.client.post(url, {"plan": "PRO"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["data"]["mode"], "MOCK")
        self.assertIn("mock-upgrade", response.data["data"]["checkout_url"])

    def test_mock_upgrade_redirection_and_db_update(self):
        """Verify the mock upgrade endpoint updates the database and redirects."""
        # Find subscription for the main org
        sub = TenantSubscription.objects.get(organization=self.org)
        self.assertEqual(sub.plan_tier, "FREE")
        
        # Access the mock upgrade endpoint
        mock_url = reverse("mock-upgrade")
        response = self.client.get(mock_url, {
            "plan": "PRO",
            "org_id": str(self.org.id)
        })
        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        
        # Verify db state updated
        sub.refresh_from_db()
        self.assertEqual(sub.plan_tier, "PRO")
        self.assertEqual(sub.seats_limit, 20)
        self.assertEqual(sub.ai_credits_limit, 1000)

    def test_registration_seat_limits_enforced(self):
        """Verify registration is blocked if seat limits are exceeded."""
        sub = TenantSubscription.objects.get(organization=self.org)
        sub.seats_limit = 1 # Only 1 seat allowed
        sub.save()

        invite = OrganizationInvitation.objects.create(
            organization=self.org,
            email="new_member@billing.local",
            role="BUSINESS_ANALYST",
            expires_at=timezone.now() + timezone.timedelta(days=1)
        )

        register_url = reverse("auth-register")
        payload = {
            "username": "new_tester",
            "email": "new_member@billing.local",
            "password": "SecureP@ss123",
            "invite_token": str(invite.token)
        }

        # Clear credentials (guest register)
        self.client.force_authenticate(user=None)
        response = self.client.post(register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("member seat limit", str(response.data))

    def test_ai_credits_quota_rejection(self):
        """Verify AI requests are rejected once credits are exhausted."""
        sub = TenantSubscription.objects.get(organization=self.org)
        sub.ai_credits_used = 100
        sub.ai_credits_limit = 100
        sub.save()

        # Create project
        project = Project.objects.create(name="AI Test Project", organization=self.org)

        url = reverse("ai-chat")
        payload = {
            "project_id": str(project.id),
            "message": "Verify this constraint",
            "action_type": "CHAT"
        }

        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_402_PAYMENT_REQUIRED)
        self.assertIn("monthly AI credits quota", response.data["message"])
