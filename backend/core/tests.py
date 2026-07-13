from django.core import mail
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
import datetime
import email as email_stdlib

from organizations.models import Organization, OrganizationInvitation
from projects.models import Project
from meetings.models import Meeting
from core.emails import (
    send_meeting_email,
    send_subscription_verification_email,
    send_organization_invitation_email
)

User = get_user_model()


def _get_mime_parts(msg):
    """
    Extract plain-text and HTML bodies from a Django EmailMessage whose
    MIME tree was assembled by EmailService using SafeMIMEMultipart.

    Django's locmem backend captures the EmailMessage object; all content
    lives in msg.message() (the MIME tree), NOT in .body or .alternatives.
    """
    raw = msg.message().as_bytes()
    parsed = email_stdlib.message_from_bytes(raw)
    plain_parts, html_parts = [], []

    def walk(part):
        ct = part.get_content_type()
        if ct == "text/plain":
            payload = part.get_payload(decode=True)
            if payload:
                plain_parts.append(payload.decode("utf-8", errors="replace"))
        elif ct == "text/html":
            payload = part.get_payload(decode=True)
            if payload:
                html_parts.append(payload.decode("utf-8", errors="replace"))
        elif part.is_multipart():
            for subpart in part.get_payload():
                walk(subpart)

    walk(parsed)
    return "".join(plain_parts), "".join(html_parts)


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
            date=datetime.date(2026, 7, 10),
            time=datetime.time(11, 0, 0),
            objective="Align design requirements."
        )

    def test_send_meeting_email(self):
        mail.outbox = []
        
        success = send_meeting_email(
            meeting=self.meeting,
            is_update=False,
            recipient_list=["attendee@bahub.local"]
        )
        
        self.assertTrue(success)
        # EmailService is async — wait for delivery
        import time
        deadline = time.monotonic() + 5.0
        while time.monotonic() < deadline:
            if mail.outbox:
                break
            time.sleep(0.05)

        self.assertEqual(len(mail.outbox), 1)
        msg = mail.outbox[0]

        self.assertEqual(msg.subject, "Meeting Scheduled: Design Sync")
        self.assertEqual(msg.to, ["attendee@bahub.local"])

        # Body lives in the MIME tree, not .body/.alternatives
        plain, html = _get_mime_parts(msg)
        self.assertIn("Join Video Call Room", plain + html)
        self.assertIn("Design Sync", html)
        self.assertIn("cid:email_banner", html)

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
        import time
        deadline = time.monotonic() + 5.0
        while time.monotonic() < deadline:
            if mail.outbox:
                break
            time.sleep(0.05)

        self.assertEqual(len(mail.outbox), 1)
        msg = mail.outbox[0]

        self.assertEqual(msg.subject, "BAHub: Verify Your Pro Subscription Upgrade")
        self.assertEqual(msg.to, ["adminuser@bahub.local"])

        plain, html = _get_mime_parts(msg)
        combined = plain + html
        self.assertIn("https://bahub-beta.netlify.app/verify?token=123", combined)
        self.assertIn("PRO", combined)
        self.assertIn("20", combined)
        self.assertIn("cid:email_banner", html)

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
        import time
        deadline = time.monotonic() + 5.0
        while time.monotonic() < deadline:
            if mail.outbox:
                break
            time.sleep(0.05)

        self.assertEqual(len(mail.outbox), 1)
        msg = mail.outbox[0]

        self.assertEqual(msg.subject, "Invitation to join Test Org on BAHub")
        self.assertEqual(msg.to, ["newmember@bahub.local"])

        plain, html = _get_mime_parts(msg)
        self.assertIn("Test Org", html)
        self.assertIn("Developer", html)
        self.assertIn(f"invite={invite.token}", html)
        self.assertIn("cid:email_banner", html)

