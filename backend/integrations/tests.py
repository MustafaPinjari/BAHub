from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from organizations.models import Organization
from projects.models import Project
from requirements.models import Requirement
from stories.models import UserStory
from documents.models import BusinessDocument
from integrations.models import IntegrationConfig, SyncLog

User = get_user_model()

class IntegrationServicesTests(APITestCase):
    def setUp(self):
        # Create Organizations
        self.org_a = Organization.objects.create(name="Org A")
        self.org_b = Organization.objects.create(name="Org B")

        # Provision Enterprise plan tier for tests
        from billing.models import TenantSubscription
        TenantSubscription.objects.filter(organization=self.org_a).update(plan_tier="ENTERPRISE")
        TenantSubscription.objects.filter(organization=self.org_b).update(plan_tier="ENTERPRISE")

        # Create Users
        self.analyst_a = User.objects.create_user(
            username="analyst_a", password="Password123!", role=User.BUSINESS_ANALYST, organization=self.org_a
        )
        self.po_a = User.objects.create_user(
            username="po_a", password="Password123!", role=User.PRODUCT_OWNER, organization=self.org_a
        )
        self.analyst_b = User.objects.create_user(
            username="analyst_b", password="Password123!", role=User.BUSINESS_ANALYST, organization=self.org_b
        )

        # Create Projects
        self.project_a = Project.objects.create(
            organization=self.org_a, name="Project Alpha", description="Org A Project 1"
        )
        self.project_b = Project.objects.create(
            organization=self.org_b, name="Project Beta", description="Org B Project 1"
        )

        # Create Requirement and Story in Project A
        self.req_a = Requirement.objects.create(
            project=self.project_a, title="Authentication", description="User login", req_type="FUNCTIONAL"
        )
        self.story_a = UserStory.objects.create(
            requirement=self.req_a, title="JWT login screen", role="User", action="login", benefit="access apps"
        )

        # Create Business Document in Project A
        self.doc_a = BusinessDocument.objects.create(
            project=self.project_a, doc_type="BRD", title="BRD Document", content="Markdown content", created_by=self.analyst_a
        )

    def test_connection_configs_isolation(self):
        """Verify credential storage permissions and tenant boundary validation."""
        self.client.force_authenticate(user=self.analyst_a)

        # Get config for Project A (should auto-create)
        url_by_project = reverse("integrationconfig-by-project")
        res_get = self.client.get(f"{url_by_project}?project={self.project_a.id}")
        self.assertEqual(res_get.status_code, status.HTTP_200_OK)
        self.assertEqual(str(res_get.data["data"]["project"]), str(self.project_a.id))

        # Retrieve config for Project B (belongs to Org B) -> Should fail
        res_get_invalid = self.client.get(f"{url_by_project}?project={self.project_b.id}")
        self.assertEqual(res_get_invalid.status_code, status.HTTP_400_BAD_REQUEST)

        # Save config for Project A
        url_save = reverse("integrationconfig-save-config")
        payload = {
            "project": str(self.project_a.id),
            "jira_url": "https://company.atlassian.net",
            "jira_username": "admin@company.com",
            "jira_api_token": "token123",
            "jira_project_key": "PROJ"
        }
        res_save = self.client.post(url_save, payload, format="json")
        self.assertEqual(res_save.status_code, status.HTTP_200_OK)
        self.assertEqual(res_save.data["data"]["jira_project_key"], "PROJ")

        # Save config for Project B -> Should fail
        payload_invalid = {
            "project": str(self.project_b.id),
            "jira_url": "https://company.atlassian.net",
        }
        res_save_invalid = self.client.post(url_save, payload_invalid, format="json")
        self.assertEqual(res_save_invalid.status_code, status.HTTP_400_BAD_REQUEST)

    def test_connection_testing_endpoint(self):
        """Verify connection ping validation."""
        self.client.force_authenticate(user=self.analyst_a)
        url_test = reverse("test-connection")

        # Successful Jira connection mock
        payload_ok = {
            "system": "jira",
            "url": "https://bahub.atlassian.net",
            "username": "tester",
            "token": "token",
            "key": "KEY"
        }
        res_ok = self.client.post(url_test, payload_ok, format="json")
        self.assertEqual(res_ok.status_code, status.HTTP_200_OK)
        self.assertEqual(res_ok.data["data"]["connected"], True)

        # Failed Connection
        payload_fail = {
            "system": "jira",
            "url": "https://invalid-host.atlassian.net",
            "username": "tester",
            "token": "token",
            "key": "KEY"
        }
        res_fail = self.client.post(url_test, payload_fail, format="json")
        self.assertEqual(res_fail.status_code, status.HTTP_400_BAD_REQUEST)

    def test_jira_and_confluence_sync_simulation(self):
        """Verify synchronization trigger limits, scoping and history logging."""
        self.client.force_authenticate(user=self.analyst_a)
        
        # Setup config first
        config = IntegrationConfig.objects.create(
            project=self.project_a,
            jira_url="https://company.atlassian.net",
            jira_username="admin@company.com",
            jira_api_token="token123",
            jira_project_key="PROJ",
            confluence_url="https://company.atlassian.net/wiki",
            confluence_username="admin@company.com",
            confluence_api_token="token123",
            confluence_space_key="SPACE"
        )

        # 1. Sync stories for Project A
        url_sync_stories = reverse("jira-sync-stories")
        res_sync = self.client.post(url_sync_stories, {"project_id": str(self.project_a.id)}, format="json")
        self.assertEqual(res_sync.status_code, status.HTTP_200_OK)
        self.assertEqual(res_sync.data["data"]["synced_count"], 1)
        self.assertEqual(res_sync.data["data"]["stories"][0]["jira_key"], "PROJ-100")

        # Check logs
        log_qs = SyncLog.objects.filter(project=self.project_a, sync_type="JIRA_STORIES")
        self.assertTrue(log_qs.exists())
        self.assertEqual(log_qs.first().status, "SUCCESS")

        # 2. Sync Document to Confluence
        url_sync_doc = reverse("confluence-sync-document")
        res_doc = self.client.post(url_sync_doc, {
            "project_id": str(self.project_a.id),
            "document_id": str(self.doc_a.id)
        }, format="json")
        self.assertEqual(res_doc.status_code, status.HTTP_200_OK)
        self.assertIn("CONF-", res_doc.data["data"]["page_id"])

        # Check logs
        log_doc = SyncLog.objects.filter(project=self.project_a, sync_type="CONFLUENCE_DOC")
        self.assertTrue(log_doc.exists())
        self.assertEqual(log_doc.first().status, "SUCCESS")

        # 3. Scoping check - user analyst_b tries to sync project A (which they don't have access to)
        self.client.force_authenticate(user=self.analyst_b)
        res_sync_b = self.client.post(url_sync_stories, {"project_id": str(self.project_a.id)}, format="json")
        self.assertEqual(res_sync_b.status_code, status.HTTP_400_BAD_REQUEST)

    def test_credentials_encryption_storage(self):
        """Verify that saved Atlassian credentials tokens are encrypted in the database but decrypted when read."""
        self.client.force_authenticate(user=self.analyst_a)
        url_save = reverse("integrationconfig-save-config")
        payload = {
            "project": str(self.project_a.id),
            "jira_url": "https://company.atlassian.net",
            "jira_username": "admin@company.com",
            "jira_api_token": "secret_token_12345",
            "jira_project_key": "PROJ",
            "confluence_url": "https://company.atlassian.net/wiki",
            "confluence_username": "admin@company.com",
            "confluence_api_token": "secret_conf_9876",
            "confluence_space_key": "SPACE"
        }
        res_save = self.client.post(url_save, payload, format="json")
        self.assertEqual(res_save.status_code, status.HTTP_200_OK)

        # Retrieve the config direct from DB to check raw db values
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT jira_api_token, confluence_api_token FROM integration_configs WHERE project_id = %s", [self.project_a.id.hex])
            row = cursor.fetchone()
            
        raw_jira_token = row[0]
        raw_conf_token = row[1]
        
        # Verify they are encrypted (not plain text)
        self.assertNotEqual(raw_jira_token, "secret_token_12345")
        self.assertNotEqual(raw_conf_token, "secret_conf_9876")
        
        # Verify they start with Fernet token header (usually gAAAAA)
        self.assertTrue(raw_jira_token.startswith("gAAAAA"))
        self.assertTrue(raw_conf_token.startswith("gAAAAA"))
        
        # Verify retrieving model instance decrypts it
        config = IntegrationConfig.objects.get(project=self.project_a)
        self.assertEqual(config.jira_api_token, "secret_token_12345")
        self.assertEqual(config.confluence_api_token, "secret_conf_9876")
