from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from organizations.models import Organization
from projects.models import Project
from requirements.models import Requirement
from audit.models import AuditLog

User = get_user_model()

class AuditLoggingTests(APITestCase):
    def setUp(self):
        from audit.context import set_current_request_data
        set_current_request_data(None, None, None)
        
        # Create Organizations
        self.org_a = Organization.objects.create(name="Company A")
        self.org_b = Organization.objects.create(name="Company B")

        # Create Users
        self.user_a = User.objects.create_user(
            username="analyst_a",
            password="Password123!",
            role=User.BUSINESS_ANALYST,
            organization=self.org_a
        )
        self.user_b = User.objects.create_user(
            username="analyst_b",
            password="Password123!",
            role=User.BUSINESS_ANALYST,
            organization=self.org_b
        )

        # Create Projects
        self.project_a = Project.objects.create(
            organization=self.org_a,
            name="Project Alpha"
        )
        self.project_b = Project.objects.create(
            organization=self.org_b,
            name="Project Beta"
        )

    def jwt_authenticate(self, user):
        token = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")

    def test_automatic_audit_log_on_create(self):
        """Verify that creating a requirement via API automatically triggers an audit log."""
        self.jwt_authenticate(self.user_a)
        url = reverse("requirement-list")
        
        payload = {
            "project": str(self.project_a.id),
            "title": "Database Schema Design",
            "description": "Establish baseline model structures.",
            "req_type": "TECHNICAL",
            "priority": "HIGH",
            "status": "DRAFT",
        }
        
        # Clear logs created in setUp
        AuditLog.objects.all().delete()
        
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify Audit Log entry exists
        logs = AuditLog.objects.filter(organization=self.org_a, action="CREATE", resource_type="Requirement")
        self.assertEqual(logs.count(), 1)
        
        log = logs.first()
        self.assertEqual(log.user, self.user_a)
        self.assertEqual(log.project, self.project_a)
        self.assertEqual(log.resource_name, "REQ-001")
        self.assertIn("title", log.changes)
        self.assertEqual(log.changes["title"]["new"], "Database Schema Design")
        self.assertIsNone(log.changes["title"]["old"])

    def test_automatic_audit_log_on_update(self):
        """Verify that updating a requirement creates a log containing the modified field deltas."""
        req = Requirement.objects.create(
            project=self.project_a,
            title="Old Requirement",
            description="Initial description",
            priority="MEDIUM",
            status="DRAFT"
        )
        
        # Clear logs created by creation and setUp
        AuditLog.objects.all().delete()
        
        self.jwt_authenticate(self.user_a)
        url = reverse("requirement-detail", args=[req.id])
        
        payload = {
            "project": str(self.project_a.id),
            "title": "New Requirement Title",
            "description": "Initial description", # Unchanged
            "priority": "HIGH", # Changed
            "status": "APPROVED", # Changed
        }
        
        response = self.client.put(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        logs = AuditLog.objects.filter(organization=self.org_a, action="UPDATE")
        self.assertEqual(logs.count(), 1)
        
        log = logs.first()
        self.assertEqual(log.user, self.user_a)
        
        # Ensure only modified fields are tracked
        self.assertIn("title", log.changes)
        self.assertIn("priority", log.changes)
        self.assertIn("status", log.changes)
        self.assertNotIn("description", log.changes)
        
        self.assertEqual(log.changes["priority"]["old"], "MEDIUM")
        self.assertEqual(log.changes["priority"]["new"], "HIGH")
        self.assertEqual(log.changes["status"]["old"], "DRAFT")
        self.assertEqual(log.changes["status"]["new"], "APPROVED")

    def test_automatic_audit_log_on_delete(self):
        """Verify deleting a requirement writes a DELETE audit record."""
        req = Requirement.objects.create(
            project=self.project_a,
            title="Temp Requirement",
            description="Short-lived req.",
            priority="LOW"
        )
        
        # Clear logs
        AuditLog.objects.all().delete()
        
        self.jwt_authenticate(self.user_a)
        url = reverse("requirement-detail", args=[req.id])
        
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        logs = AuditLog.objects.filter(organization=self.org_a, action="DELETE")
        self.assertEqual(logs.count(), 1)
        
        log = logs.first()
        self.assertEqual(log.user, self.user_a)
        self.assertEqual(log.resource_id, str(req.id))


    def test_organization_scoping_isolation(self):
        """Verify that users can only retrieve audit logs from their own organization."""
        # Clear logs from setup
        AuditLog.objects.all().delete()

        # Create an audit log record for Organization A
        AuditLog.objects.create(
            organization=self.org_a,
            project=self.project_a,
            user=self.user_a,
            user_username=self.user_a.username,
            action="CREATE",
            resource_type="Requirement",
            resource_id="123",
            resource_name="REQ-001",
            changes={}
        )
        
        # Create an audit log record for Organization B
        AuditLog.objects.create(
            organization=self.org_b,
            project=self.project_b,
            user=self.user_b,
            user_username=self.user_b.username,
            action="CREATE",
            resource_type="Requirement",
            resource_id="456",
            resource_name="REQ-002",
            changes={}
        )
        
        # Authenticate User A, should only see Org A logs
        self.jwt_authenticate(self.user_a)
        url = reverse("audit-log-list")
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Response is wrapped in envelope {"success": True, "message": "...", "data": [...]}
        data = response.json()["data"]
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["resource_name"], "REQ-001")
        
        # Authenticate User B, should only see Org B logs
        self.jwt_authenticate(self.user_b)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()["data"]
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["resource_name"], "REQ-002")
