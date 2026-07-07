from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from organizations.models import Organization
from projects.models import Project
from stakeholders.models import Stakeholder
from requirements.models import Requirement

User = get_user_model()

class RequirementManagementTests(APITestCase):
    def setUp(self):
        # Create Organizations
        self.org_a = Organization.objects.create(name="Org A")
        self.org_b = Organization.objects.create(name="Org B")

        # Upgrade test orgs to PRO to bypass FREE tier limits during other logic validation
        from billing.models import TenantSubscription
        for org in [self.org_a, self.org_b]:
            sub = TenantSubscription.objects.get(organization=org)
            sub.plan_tier = "PRO"
            sub.save()

        # Create Users
        self.analyst_a = User.objects.create_user(
            username="analyst_a", password="Password123!", role=User.BUSINESS_ANALYST, organization=self.org_a
        )

        # Create Projects
        self.project_a1 = Project.objects.create(
            organization=self.org_a, name="Project Alpha", description="Org A Project 1"
        )
        self.project_a2 = Project.objects.create(
            organization=self.org_a, name="Project Beta", description="Org A Project 2"
        )
        self.project_b = Project.objects.create(
            organization=self.org_b, name="Project Gamma", description="Org B Project 1"
        )

        # Create Stakeholder
        self.st_a = Stakeholder.objects.create(
            organization=self.org_a,
            project=self.project_a1,
            name="John Doe",
            title="Sponsor",
        )
        self.st_b = Stakeholder.objects.create(
            organization=self.org_b,
            project=self.project_b,
            name="Jane Smith",
            title="Sponsor",
        )

    def test_create_requirement_auto_id(self):
        """Verify that requirement IDs auto-increment sequentially within the project context."""
        self.client.force_authenticate(user=self.analyst_a)
        url = reverse("requirement-list")
        
        # 1. Create first requirement
        payload_1 = {
            "project": str(self.project_a1.id),
            "title": "Req One",
            "description": "First functional requirement desc.",
            "req_type": "FUNCTIONAL",
            "priority": "HIGH",
        }
        response = self.client.post(url, payload_1, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["req_id"], "REQ-001")

        # 2. Create second requirement in same project
        payload_2 = {
            "project": str(self.project_a1.id),
            "title": "Req Two",
            "description": "Second functional requirement desc.",
            "req_type": "FUNCTIONAL",
            "priority": "MEDIUM",
        }
        response = self.client.post(url, payload_2, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["req_id"], "REQ-002")

        # 3. Create requirement in project_a2 (should start from REQ-001 again)
        payload_3 = {
            "project": str(self.project_a2.id),
            "title": "Req Beta",
            "description": "First req in Project Beta.",
        }
        response = self.client.post(url, payload_3, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["req_id"], "REQ-001")

    def test_requirement_validations(self):
        """Verify project and stakeholder matching boundaries."""
        self.client.force_authenticate(user=self.analyst_a)
        url = reverse("requirement-list")

        # 1. Assigned project belongs to another organization (Gamma in Org B)
        payload_invalid_project = {
            "project": str(self.project_b.id),
            "title": "Bad Req",
            "description": "Project outside Org A.",
        }
        response = self.client.post(url, payload_invalid_project, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # 2. Assigned stakeholder belongs to another organization (Jane in Org B)
        payload_invalid_stakeholder = {
            "project": str(self.project_a1.id),
            "title": "Bad Req Stakeholder",
            "description": "Stakeholder Jane is in Org B.",
            "source_stakeholder": str(self.st_b.id),
        }
        response = self.client.post(url, payload_invalid_stakeholder, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("source_stakeholder", response.data["errors"])

    def test_websocket_connect_and_scoping(self):
        """Verify that websocket connection validates token permissions and limits by tenant."""
        from asgiref.sync import async_to_sync
        from channels.testing import WebsocketCommunicator
        from channels.routing import URLRouter
        from django.urls import re_path
        from requirements.consumers import RequirementConsumer
        from rest_framework_simplejwt.tokens import AccessToken

        token_a = str(AccessToken.for_user(self.analyst_a))

        # Build testing application router
        application = URLRouter([
            re_path(r"ws/projects/(?P<project_id>[^/]+)/requirements/$", RequirementConsumer.as_asgi()),
        ])

        async def run_ws_test():
            # 1. Connect analyst_a to Project A1 (Authorized)
            communicator = WebsocketCommunicator(
                application, 
                f"/ws/projects/{self.project_a1.id}/requirements/?token={token_a}"
            )
            connected, _ = await communicator.connect()
            self.assertTrue(connected)

            # Check presence message on connect
            res_presence = await communicator.receive_json_from()
            self.assertEqual(res_presence["type"], "presence")
            self.assertEqual(res_presence["user"], "analyst_a")
            self.assertEqual(res_presence["status"], "online")

            # Send typing notice
            await communicator.send_json_to({
                "type": "typing",
                "requirement_id": "req-uuid-123",
                "is_typing": True
            })

            # Disconnect
            await communicator.disconnect()

            # 2. Connect analyst_a to Project Gamma (Org B - Forbidden)
            communicator_forbidden = WebsocketCommunicator(
                application, 
                f"/ws/projects/{self.project_b.id}/requirements/?token={token_a}"
            )
            connected_forbidden, _ = await communicator_forbidden.connect()
            self.assertFalse(connected_forbidden)

        async_to_sync(run_ws_test)()

    def test_collaborative_yjs_sync(self):
        """Verify that Yjs binary updates are successfully broadcasted to other clients."""
        from asgiref.sync import async_to_sync
        from channels.testing import WebsocketCommunicator
        from channels.routing import URLRouter
        from django.urls import re_path
        from requirements.consumers import RequirementConsumer
        from rest_framework_simplejwt.tokens import AccessToken

        token_a = str(AccessToken.for_user(self.analyst_a))
        
        # We will create another user analyst_a2 in the same organization Org A to collaborate
        analyst_a2 = User.objects.create_user(
            username="analyst_a2", password="Password123!", role=User.BUSINESS_ANALYST, organization=self.org_a
        )
        token_a2 = str(AccessToken.for_user(analyst_a2))

        # Build testing application router
        application = URLRouter([
            re_path(r"ws/projects/(?P<project_id>[^/]+)/requirements/$", RequirementConsumer.as_asgi()),
        ])

        async def run_ws_collab_test():
            # 1. Connect first collaborator
            communicator1 = WebsocketCommunicator(
                application, 
                f"/ws/projects/{self.project_a1.id}/requirements/?token={token_a}"
            )
            connected1, _ = await communicator1.connect()
            self.assertTrue(connected1)
            # Drain presence update
            await communicator1.receive_json_from()

            # 2. Connect second collaborator
            communicator2 = WebsocketCommunicator(
                application, 
                f"/ws/projects/{self.project_a1.id}/requirements/?token={token_a2}"
            )
            connected2, _ = await communicator2.connect()
            self.assertTrue(connected2)
            # Drain presence updates
            await communicator2.receive_json_from() # presence for analyst_a2
            await communicator1.receive_json_from() # presence for analyst_a2 on communicator1

            # 3. Send binary payload (Yjs packet) from communicator1
            binary_payload = b"\x01\x02\x03\x04"
            await communicator1.send_to(bytes_data=binary_payload)

            # 4. Assert communicator2 receives the binary broadcast
            received_bytes = await communicator2.receive_from()
            self.assertEqual(received_bytes, binary_payload)

            # 5. Clean up
            await communicator1.disconnect()
            await communicator2.disconnect()

        async_to_sync(run_ws_collab_test)()

