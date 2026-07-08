from django.core import mail
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
import datetime

from organizations.models import Organization, OrganizationInvitation
from projects.models import Project
from meetings.models import Meeting
from core.emails import (
    send_meeting_email,
    send_subscription_verification_email,
    send_organization_invitation_email
)

User = get_user_model()

class EmailServiceTests(TestCase):
    def setUp(self):
        # Create test organization
        self.org = Organization.objects.create(name="Test Org")
        
        # Create test users
        self.user = User.objects.create_user(
            username="testuser",
            email="testuser@bahub.local",
            password="TestPassword123!",
            organization=self.org
        )
        self.admin = User.objects.create_user(
            username="adminuser",
            email="adminuser@bahub.local",
            password="TestPassword123!",
            role="ADMIN",
            organization=self.org
        )
        
        # Create project
        self.project = Project.objects.create(
            organization=self.org,
            name="Test Project",
            description="Test Project Description"
        )
        
        # Create meeting
        self.meeting = Meeting.objects.create(
            project=self.project,
            title="Design Sync",
            date="2026-07-10",
            time="11:00:00",
            objective="Align design requirements."
        )

    def test_send_meeting_email(self):
        # Clear outbox
        mail.outbox = []
        
        # Trigger meeting email
        success = send_meeting_email(
            meeting=self.meeting,
            is_update=False,
            recipient_list=["attendee@bahub.local"]
        )
        
        self.assertTrue(success)
        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]
        
        self.assertEqual(email.subject, "Meeting Scheduled: Design Sync")
        self.assertEqual(email.to, ["attendee@bahub.local"])
        self.assertIn("Join Video Call Room", email.body)
        
        # Check HTML content
        self.assertEqual(len(email.alternatives), 1)
        html_content, content_type = email.alternatives[0]
        self.assertEqual(content_type, "text/html")
        self.assertIn("Design Sync", html_content)
        self.assertIn("Join Video Call Room", html_content)
        self.assertIn("cid:email_banner", html_content)

    def test_send_subscription_verification_email(self):
        mail.outbox = []
        
        success = send_subscription_verification_email(
            organization_name="Test Org",
            plan_name="PRO",
            seats_limit=20,
            ai_credits_limit=1000,
            verify_url="https://bahub-beta.netlify.app/verify?token=123",
            recipient_list=["adminuser@bahub.local"]
        )
        
        self.assertTrue(success)
        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]
        
        self.assertEqual(email.subject, "BAHub: Verify Your Pro Subscription Upgrade")
        self.assertEqual(email.to, ["adminuser@bahub.local"])
        self.assertIn("https://bahub-beta.netlify.app/verify?token=123", email.body)
        
        # Check HTML content
        self.assertEqual(len(email.alternatives), 1)
        html_content, content_type = email.alternatives[0]
        self.assertEqual(content_type, "text/html")
        self.assertIn("Verify Your Subscription Upgrade", html_content)
        self.assertIn("PRO", html_content)
        self.assertIn("20", html_content)
        self.assertIn("https://bahub-beta.netlify.app/verify?token=123", html_content)
        self.assertIn("cid:email_banner", html_content)

    def test_send_organization_invitation_email(self):
        mail.outbox = []
        
        invite = OrganizationInvitation.objects.create(
            organization=self.org,
            email="newmember@bahub.local",
            role="DEVELOPER",
            expires_at=timezone.now() + datetime.timedelta(days=7)
        )
        
        success = send_organization_invitation_email(invite, self.admin)
        
        self.assertTrue(success)
        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]
        
        self.assertEqual(email.subject, "Invitation to join Test Org on BAHub")
        self.assertEqual(email.to, ["newmember@bahub.local"])
        
        # Check HTML content
        self.assertEqual(len(email.alternatives), 1)
        html_content, content_type = email.alternatives[0]
        self.assertEqual(content_type, "text/html")
        self.assertIn("You've Been Invited to Join Test Org", html_content)
        self.assertIn("Developer", html_content)
        self.assertIn(f"invite={invite.token}", html_content)
        self.assertIn("cid:email_banner", html_content)
