from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import SRSDocument, SRSSection, SRSVersion, SRSComment, SRSApproval
from .serializers import SRSDocumentSerializer, SRSSectionSerializer
from .permissions import SRSPermissionService
from .subscription_limits import SRSSubscriptionLimits
from .version_control import VersionControlService
from .collaboration import CollaborationService

User = get_user_model()


class SRSDocumentModelTest(TestCase):
    """Test cases for SRSDocument model."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_create_document(self):
        """Test creating a new SRS document."""
        from projects.models import Project
        from organizations.models import Organization
        
        org = Organization.objects.create(name='Test Org')
        self.user.organization = org
        self.user.save()
        
        project = Project.objects.create(
            name='Test Project',
            organization=org,
            created_by=self.user
        )
        
        document = SRSDocument.objects.create(
            title='Test SRS',
            description='Test description',
            project=project,
            created_by=self.user
        )
        
        self.assertEqual(document.title, 'Test SRS')
        self.assertEqual(document.status, 'DRAFT')
        self.assertEqual(document.version, '1.0')
        self.assertFalse(document.is_ai_generated)


class SRSSectionModelTest(TestCase):
    """Test cases for SRSSection model."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        from projects.models import Project
        from organizations.models import Organization
        
        org = Organization.objects.create(name='Test Org')
        self.user.organization = org
        self.user.save()
        
        project = Project.objects.create(
            name='Test Project',
            organization=org,
            created_by=self.user
        )
        
        self.document = SRSDocument.objects.create(
            title='Test SRS',
            project=project,
            created_by=self.user
        )
    
    def test_create_section(self):
        """Test creating a new SRS section."""
        section = SRSSection.objects.create(
            document=self.document,
            section_type='INTRODUCTION_PURPOSE',
            title='1.1 Purpose',
            content='This is the purpose section',
            order=1
        )
        
        self.assertEqual(section.section_type, 'INTRODUCTION_PURPOSE')
        self.assertEqual(section.title, '1.1 Purpose')
        self.assertFalse(section.is_collapsed)
        self.assertFalse(section.is_locked)


class SRSSerializerTest(TestCase):
    """Test cases for SRS serializers."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        from projects.models import Project
        from organizations.models import Organization
        
        org = Organization.objects.create(name='Test Org')
        self.user.organization = org
        self.user.save()
        
        project = Project.objects.create(
            name='Test Project',
            organization=org,
            created_by=self.user
        )
        
        self.document = SRSDocument.objects.create(
            title='Test SRS',
            project=project,
            created_by=self.user
        )
    
    def test_document_serializer(self):
        """Test SRSDocumentSerializer."""
        serializer = SRSDocumentSerializer(self.document)
        data = serializer.data
        
        self.assertEqual(data['title'], 'Test SRS')
        self.assertEqual(data['status'], 'DRAFT')
        self.assertEqual(data['version'], '1.0')
    
    def test_section_serializer(self):
        """Test SRSSectionSerializer."""
        section = SRSSection.objects.create(
            document=self.document,
            section_type='INTRODUCTION_PURPOSE',
            title='1.1 Purpose',
            content='Test content',
            order=1
        )
        
        serializer = SRSSectionSerializer(section)
        data = serializer.data
        
        self.assertEqual(data['section_type'], 'INTRODUCTION_PURPOSE')
        self.assertEqual(data['title'], '1.1 Purpose')


class SRSPermissionsTest(TestCase):
    """Test cases for SRS permissions."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )
        from projects.models import Project
        from organizations.models import Organization
        
        org = Organization.objects.create(name='Test Org')
        self.user.organization = org
        self.other_user.organization = org
        self.user.save()
        self.other_user.save()
        
        project = Project.objects.create(
            name='Test Project',
            organization=org,
            created_by=self.user
        )
        
        self.document = SRSDocument.objects.create(
            title='Test SRS',
            project=project,
            created_by=self.user
        )
    
    def test_owner_role(self):
        """Test owner role assignment."""
        role = SRSPermissionService.get_user_role(self.document, self.user)
        self.assertEqual(role, 'OWNER')
    
    def test_editor_role(self):
        """Test editor role assignment."""
        role = SRSPermissionService.get_user_role(self.document, self.other_user)
        self.assertEqual(role, 'EDITOR')
    
    def test_can_edit(self):
        """Test edit permissions."""
        self.assertTrue(SRSPermissionService.can_edit(self.document, self.user))
        self.assertTrue(SRSPermissionService.can_edit(self.document, self.other_user))
    
    def test_can_delete(self):
        """Test delete permissions."""
        self.assertTrue(SRSPermissionService.can_delete(self.document, self.user))
        self.assertFalse(SRSPermissionService.can_delete(self.document, self.other_user))


class SRSSubscriptionLimitsTest(TestCase):
    """Test cases for SRS subscription limits."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_free_plan_limits(self):
        """Test FREE plan limits."""
        limits = SRSSubscriptionLimits.PLAN_LIMITS['FREE']
        self.assertEqual(limits['max_documents'], 2)
        self.assertEqual(limits['max_ai_generations'], 5)
        self.assertIn('MARKDOWN', limits['export_formats'])
    
    def test_pro_plan_limits(self):
        """Test PRO plan limits."""
        limits = SRSSubscriptionLimits.PLAN_LIMITS['PRO']
        self.assertEqual(limits['max_documents'], 50)
        self.assertEqual(limits['max_ai_generations'], 100)
        self.assertIn('PDF', limits['export_formats'])
    
    def test_can_create_document(self):
        """Test document creation limit check."""
        result = SRSSubscriptionLimits.can_create_document(self.user)
        self.assertIn('can_create', result)
        self.assertIn('plan', result)


class SRSVersionControlTest(TestCase):
    """Test cases for SRS version control."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        from projects.models import Project
        from organizations.models import Organization
        
        org = Organization.objects.create(name='Test Org')
        self.user.organization = org
        self.user.save()
        
        project = Project.objects.create(
            name='Test Project',
            organization=org,
            created_by=self.user
        )
        
        self.document = SRSDocument.objects.create(
            title='Test SRS',
            project=project,
            created_by=self.user
        )
    
    def test_create_version(self):
        """Test creating a document version."""
        version = VersionControlService.create_version(
            self.document,
            '1.1',
            'Updated requirements',
            self.user
        )
        
        self.assertEqual(version.version_number, '1.1')
        self.assertEqual(version.change_summary, 'Updated requirements')
        self.assertEqual(version.created_by, self.user)
    
    def test_get_version_history(self):
        """Test retrieving version history."""
        VersionControlService.create_version(
            self.document,
            '1.1',
            'First update',
            self.user
        )
        
        history = VersionControlService.get_version_history(self.document)
        self.assertEqual(len(history), 1)
        self.assertEqual(history[0]['version_number'], '1.1')


class SRSCollaborationTest(TestCase):
    """Test cases for SRS collaboration features."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )
        from projects.models import Project
        from organizations.models import Organization
        
        org = Organization.objects.create(name='Test Org')
        self.user.organization = org
        self.other_user.organization = org
        self.user.save()
        self.other_user.save()
        
        project = Project.objects.create(
            name='Test Project',
            organization=org,
            created_by=self.user
        )
        
        self.document = SRSDocument.objects.create(
            title='Test SRS',
            project=project,
            created_by=self.user
        )
    
    def test_add_comment(self):
        """Test adding a comment."""
        comment = CollaborationService.add_comment(
            self.document,
            'This is a test comment',
            self.user
        )
        
        self.assertEqual(comment.content, 'This is a test comment')
        self.assertEqual(comment.author, self.user)
        self.assertFalse(comment.is_resolved)
    
    def test_resolve_comment(self):
        """Test resolving a comment."""
        comment = CollaborationService.add_comment(
            self.document,
            'Test comment',
            self.user
        )
        
        result = CollaborationService.resolve_comment(comment, self.user)
        self.assertTrue(result['success'])
        
        comment.refresh_from_db()
        self.assertTrue(comment.is_resolved)
    
    def test_request_approval(self):
        """Test requesting approval."""
        result = CollaborationService.request_approval(
            self.document,
            [str(self.other_user.id)],
            self.user
        )
        
        self.assertTrue(result['success'])
        self.assertEqual(len(result['created_approvals']), 1)

