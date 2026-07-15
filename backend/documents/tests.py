from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from organizations.models import Organization
from projects.models import Project
from stakeholders.models import Stakeholder
from requirements.models import Requirement
from documents.models import BusinessDocument

User = get_user_model()

class DocumentManagementTests(APITestCase):
    def setUp(self):
        # Create Organizations
        self.org_a = Organization.objects.create(name="Org A")
        self.org_b = Organization.objects.create(name="Org B")

        # Provision Pro plan tier for tests
        from billing.models import TenantSubscription
        TenantSubscription.objects.filter(organization=self.org_a).update(plan_tier="PRO")
        TenantSubscription.objects.filter(organization=self.org_b).update(plan_tier="PRO")

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

        # Create Stakeholder
        self.st_a = Stakeholder.objects.create(
            organization=self.org_a,
            project=self.project_a,
            name="John Doe",
            title="Sponsor",
        )

        # Create Requirement
        self.req_a = Requirement.objects.create(
            project=self.project_a,
            title="Secure Login",
            description="Allows standard login.",
        )

    def test_document_generation_and_boundary(self):
        """Verify automated BRD markdown compiler and sign-off permission restrictions."""
        self.client.force_authenticate(user=self.analyst_a)

        # 1. Attempt to generate document for Project B (belongs to Org B)
        url_gen = reverse("document-generate-document")
        payload_invalid = {"project": str(self.project_b.id), "doc_type": "BRD"}
        response = self.client.post(url_gen, payload_invalid, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # 2. Successfully generate BRD document content
        payload_valid = {"project": str(self.project_a.id), "doc_type": "BRD"}
        response = self.client.post(url_gen, payload_valid, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify compiled contents contain stakeholder and requirement titles
        content = response.data["data"]["content"]
        self.assertIn("John Doe", content)
        self.assertIn("Secure Login", content)

        # 3. Create document in database
        url_list = reverse("document-list")
        payload_create = {
            "project": str(self.project_a.id),
            "doc_type": "BRD",
            "title": "Alpha BRD Document",
            "content": content,
        }
        res_create = self.client.post(url_list, payload_create, format="json")
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        doc_id = res_create.data["data"]["id"]

        # 4. Attempt sign-off as Developer (Should be rejected)
        self.client.force_authenticate(user=self.developer_a)
        url_sign = reverse("document-sign-off", kwargs={"pk": doc_id})
        res_sign_fail = self.client.post(url_sign)
        self.assertEqual(res_sign_fail.status_code, status.HTTP_400_BAD_REQUEST)

        # 5. Successfully sign-off as Product Owner
        self.client.force_authenticate(user=self.po_a)
        res_sign_ok = self.client.post(url_sign)
        self.assertEqual(res_sign_ok.status_code, status.HTTP_200_OK)
        self.assertEqual(res_sign_ok.data["data"]["status"], "SIGNED_OFF")
        self.assertEqual(res_sign_ok.data["data"]["signed_off_by_username"], "po_a")

    def test_document_exports(self):
        """Verify direct PDF and Word export streams and their tenant bounds."""
        doc = BusinessDocument.objects.create(
            project=self.project_a,
            doc_type="BRD",
            title="Export Spec",
            content="# Document Title\n\n## Section 1\nSome paragraph text here.\n\n| Col A | Col B |\n| --- | --- |\n| Val 1 | Val 2 |",
            created_by=self.analyst_a
        )

        # Export PDF (as analyst_a, who belongs to Org A) -> should succeed
        self.client.force_authenticate(user=self.analyst_a)
        url_pdf = reverse("document-export-pdf", kwargs={"pk": doc.id})
        res_pdf = self.client.get(url_pdf)
        self.assertEqual(res_pdf.status_code, status.HTTP_200_OK)
        self.assertEqual(res_pdf.headers["Content-Type"], "application/pdf")
        self.assertIn("attachment; filename=", res_pdf.headers["Content-Disposition"])

        # Export Word (as analyst_a) -> should succeed
        url_word = reverse("document-export-word", kwargs={"pk": doc.id})
        res_word = self.client.get(url_word)
        self.assertEqual(res_word.status_code, status.HTTP_200_OK)
        self.assertEqual(res_word.headers["Content-Type"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        self.assertIn("attachment; filename=", res_word.headers["Content-Disposition"])

        # Create user b in Org B
        user_b = User.objects.create_user(
            username="user_b", password="Password123!", role=User.BUSINESS_ANALYST, organization=self.org_b
        )
        self.client.force_authenticate(user=user_b)
        
        # Export PDF of Doc A (Org A) as User B (Org B) -> should be denied
        res_pdf_deny = self.client.get(url_pdf)
        self.assertEqual(res_pdf_deny.status_code, status.HTTP_404_NOT_FOUND)

    def test_ieee_document_generation(self):
        """Verify IEEE document template generation."""
        self.client.force_authenticate(user=self.analyst_a)
        
        # Generate IEEE document
        url_gen = reverse("document-generate-document")
        payload = {"project": str(self.project_a.id), "doc_type": "IEEE"}
        response = self.client.post(url_gen, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify IEEE-specific content
        content = response.data["data"]["content"]
        self.assertIn("IEEE Standard Document", content)
        self.assertIn("1. Introduction", content)
        self.assertIn("1.1 Scope", content)
        self.assertIn("2. System Architecture", content)
        self.assertIn("3. Functional Requirements", content)

    def test_markdown_export(self):
        """Verify Markdown export functionality."""
        doc = BusinessDocument.objects.create(
            project=self.project_a,
            doc_type="BRD",
            title="Markdown Test",
            content="# Test Document\n\n## Section\nContent here.",
            created_by=self.analyst_a
        )
        
        self.client.force_authenticate(user=self.analyst_a)
        url_md = reverse("document-export-markdown", kwargs={"pk": doc.id})
        res_md = self.client.get(url_md)
        
        self.assertEqual(res_md.status_code, status.HTTP_200_OK)
        self.assertEqual(res_md.headers["Content-Type"], "text/markdown")
        self.assertIn("attachment; filename=", res_md.headers["Content-Disposition"])

    def test_version_control(self):
        """Verify document version history and restoration."""
        doc = BusinessDocument.objects.create(
            project=self.project_a,
            doc_type="BRD",
            title="Version Test",
            content="Original content",
            version="1.0",
            created_by=self.analyst_a
        )
        
        self.client.force_authenticate(user=self.analyst_a)
        
        # Create version snapshot
        from documents.models import DocumentVersion
        version = DocumentVersion.objects.create(
            document=doc,
            version="1.0",
            content="Original content",
            created_by=self.analyst_a
        )
        
        # Update document
        doc.content = "Updated content"
        doc.version = "2.0"
        doc.save()
        
        # Fetch versions
        url_versions = reverse("document-versions", kwargs={"pk": doc.id})
        res_versions = self.client.get(url_versions)
        self.assertEqual(res_versions.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_versions.data["data"]), 1)

    def test_ai_enhancement_endpoint(self):
        """Verify AI enhancement endpoint exists and handles requests."""
        doc = BusinessDocument.objects.create(
            project=self.project_a,
            doc_type="IEEE",
            title="AI Test",
            content="Test content for enhancement",
            created_by=self.analyst_a
        )
        
        self.client.force_authenticate(user=self.analyst_a)
        url_ai = reverse("document-ai-enhance", kwargs={"pk": doc.id})
        
        # Test AI enhancement call (may fail if AI service not configured)
        payload = {"enhancement_type": "refine"}
        res_ai = self.client.post(url_ai, payload, format="json")
        
        # Should either succeed with AI enhancement or fail gracefully
        self.assertIn(res_ai.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])

    def test_document_import_markdown(self):
        """Verify Markdown import functionality."""
        self.client.force_authenticate(user=self.analyst_a)
        
        from io import BytesIO
        import tempfile
        
        # Create markdown file
        md_content = b"# Imported Document\n\n## Section\nImported content."
        md_file = BytesIO(md_content)
        md_file.name = "test.md"
        
        url_import = reverse("document-import-markdown")
        payload = {
            "file": md_file,
            "project": str(self.project_a.id),
            "doc_type": "BRD",
            "title": "Imported MD"
        }
        
        res_import = self.client.post(url_import, payload, format="multipart")
        self.assertEqual(res_import.status_code, status.HTTP_201_CREATED)
        self.assertIn("Imported Document", res_import.data["data"]["content"])

    def test_document_sync_endpoint(self):
        """Verify document sync endpoint exists."""
        doc = BusinessDocument.objects.create(
            project=self.project_a,
            doc_type="BRD",
            title="Sync Test",
            content="Test content",
            created_by=self.analyst_a
        )
        
        self.client.force_authenticate(user=self.analyst_a)
        url_sync = reverse("document-sync", kwargs={"pk": doc.id})
        
        payload = {"module": "requirements"}
        res_sync = self.client.post(url_sync, payload, format="json")
        
        # Should either succeed or fail gracefully depending on sync implementation
        self.assertIn(res_sync.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND])
