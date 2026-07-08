from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from organizations.models import Organization, OrganizationInvitation

User = get_user_model()

class OrganizationInvitationTests(APITestCase):
    def setUp(self):
        # Create Org A
        self.org_a = Organization.objects.create(name="Organization A")
        self.admin_a = User.objects.create_user(
            username="admina",
            email="admina@orga.com",
            password="TestPassword123!",
            role="ADMIN",
            organization=self.org_a
        )
        self.user_a = User.objects.create_user(
            username="usera",
            email="usera@orga.com",
            password="TestPassword123!",
            role="BUSINESS_ANALYST",
            organization=self.org_a
        )

        # Create Org B
        self.org_b = Organization.objects.create(name="Organization B")
        self.admin_b = User.objects.create_user(
            username="adminb",
            email="adminb@orgb.com",
            password="TestPassword123!",
            role="ADMIN",
            organization=self.org_b
        )

    def test_list_invitations_tenant_isolation(self):
        """Verify users can only see invitations belonging to their organization."""
        # Invite created for Org A
        inv_a = OrganizationInvitation.objects.create(
            organization=self.org_a,
            email="newmember@orga.com",
            role="DEVELOPER",
            expires_at="2026-12-31T23:59:59Z"
        )
        # Invite created for Org B
        inv_b = OrganizationInvitation.objects.create(
            organization=self.org_b,
            email="newmember@orgb.com",
            role="DEVELOPER",
            expires_at="2026-12-31T23:59:59Z"
        )

        # Authenticate Admin A
        self.client.force_authenticate(user=self.admin_a)
        url = reverse("invitation-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("data", response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["email"], "newmember@orga.com")

    def test_create_invitation_admin_only(self):
        """Verify only ADMIN users can create new workspace invitations."""
        url = reverse("invitation-list")
        payload = {
            "email": "invitee@orga.com",
            "role": "QA_TESTER"
        }

        # Attempt with non-admin user
        self.client.force_authenticate(user=self.user_a)
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Attempt with admin user
        self.client.force_authenticate(user=self.admin_a)
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(OrganizationInvitation.objects.count(), 1)
        
        inv = OrganizationInvitation.objects.first()
        self.assertEqual(inv.email, "invitee@orga.com")
        self.assertEqual(inv.role, "QA_TESTER")
        self.assertEqual(inv.organization, self.org_a)
        self.assertFalse(inv.is_used)

    def test_cancel_invitation(self):
        """Verify Admin can cancel/delete a pending invitation."""
        inv = OrganizationInvitation.objects.create(
            organization=self.org_a,
            email="cancelme@orga.com",
            role="DEVELOPER",
            expires_at="2026-12-31T23:59:59Z"
        )

        self.client.force_authenticate(user=self.admin_a)
        url = reverse("invitation-detail", args=[inv.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(OrganizationInvitation.objects.count(), 0)
