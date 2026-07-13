from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from organizations.models import Organization
from projects.models import Project
from meetings.models import Meeting, ActionItem

User = get_user_model()

class MeetingManagementTests(APITestCase):
    def setUp(self):
        # Create Organizations
        self.org_a = Organization.objects.create(name="Org A")
        self.org_b = Organization.objects.create(name="Org B")

        # Create Users
        self.analyst_a = User.objects.create_user(
            username="analyst_a", email="analyst_a@test.com", password="Password123!", role=User.BUSINESS_ANALYST, organization=self.org_a
        )
        self.analyst_b = User.objects.create_user(
            username="analyst_b", email="analyst_b@test.com", password="Password123!", role=User.BUSINESS_ANALYST, organization=self.org_b
        )

        # Create Project
        self.project_a = Project.objects.create(
            organization=self.org_a, name="Project Alpha", description="Org A Project 1"
        )

    def test_meeting_schedule_and_attendees(self):
        """Verify meeting scheduling constraints and attendee validations."""
        self.client.force_authenticate(user=self.analyst_a)
        url_meeting = reverse("meeting-list")

        # 1. Schedule with invalid attendee (analyst_b belongs to Org B, project belongs to Org A)
        payload_invalid = {
            "project": str(self.project_a.id),
            "title": "Kickoff Session",
            "date": "2026-07-01",
            "time": "10:00:00",
            "objective": "Align scope.",
            "attendees": [self.analyst_b.id]
        }
        response = self.client.post(url_meeting, payload_invalid, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("attendees", response.data["errors"])

        # 2. Schedule successfully with analyst_a
        payload_valid = {
            "project": str(self.project_a.id),
            "title": "Kickoff Session",
            "date": "2026-07-01",
            "time": "10:00:00",
            "objective": "Align scope.",
            "attendees": [self.analyst_a.id]
        }
        res_meeting = self.client.post(url_meeting, payload_valid, format="json")
        self.assertEqual(res_meeting.status_code, status.HTTP_201_CREATED)
        meeting_id = res_meeting.data["data"]["id"]

        # 3. Assign action item with invalid assignee (analyst_b from Org B)
        url_item = reverse("actionitem-list")
        payload_item_invalid = {
            "meeting": str(meeting_id),
            "description": "Write project charters.",
            "assignee": self.analyst_b.id,
        }
        res_item_fail = self.client.post(url_item, payload_item_invalid, format="json")
        self.assertEqual(res_item_fail.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("assignee", res_item_fail.data["errors"])

        # 4. Assign action item successfully
        payload_item_valid = {
            "meeting": str(meeting_id),
            "description": "Write project charters.",
            "assignee": self.analyst_a.id,
            "status": "OPEN"
        }
        res_item_ok = self.client.post(url_item, payload_item_valid, format="json")
        self.assertEqual(res_item_ok.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_item_ok.data["data"]["description"], "Write project charters.")

    def test_meeting_sends_email_invitation(self):
        """Verify scheduler emails are dispatched to attendees on meeting creation."""
        import time
        import email as email_stdlib
        from django.core import mail

        def _get_mime_parts(msg):
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

        self.client.force_authenticate(user=self.analyst_a)
        url_meeting = reverse("meeting-list")
        
        # Clear outbox
        mail.outbox = []
        
        payload = {
            "project": str(self.project_a.id),
            "title": "Strategy Alignment Sync",
            "date": "2026-07-02",
            "time": "14:00:00",
            "objective": "Review key timelines.",
            "attendees": [self.analyst_a.id]
        }
        
        response = self.client.post(url_meeting, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # EmailService is async — wait for delivery
        deadline = time.monotonic() + 5.0
        while time.monotonic() < deadline:
            if mail.outbox:
                break
            time.sleep(0.05)

        # Verify email is sent
        self.assertEqual(len(mail.outbox), 1)
        msg = mail.outbox[0]
        self.assertEqual(msg.subject, "Meeting Scheduled: Strategy Alignment Sync")
        self.assertIn(self.analyst_a.email, msg.to)

        # Body lives in MIME tree, not .body
        plain, html = _get_mime_parts(msg)
        self.assertIn("https://meet.jit.si/bahub-", plain + html)

