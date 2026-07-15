from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import Q, Count
from .models import (
    SRSDocument, SRSSection, SRSVersion, SRSComment,
    SRSApproval, SRSExport, SRSImport, AIGenerationHistory
)
from .serializers import (
    SRSDocumentSerializer, SRSDocumentListSerializer, SRSSectionSerializer,
    SRSVersionSerializer, SRSCommentSerializer, SRSApprovalSerializer,
    SRSExportSerializer, SRSImportSerializer, AIGenerationHistorySerializer
)
from core.responses import api_success
from core.exceptions import ValidationError


class SRSDocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet handling SRS Document CRUD operations.
    Enforces tenant isolation, plan limits, and broadcasts real-time updates.
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "list":
            return SRSDocumentListSerializer
        return SRSDocumentSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return SRSDocument.objects.none()

        queryset = SRSDocument.objects.filter(
            project__organization_id=user.organization_id
        ).select_related('project', 'created_by', 'last_modified_by')

        # Support filtering
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        is_ai_generated = self.request.query_params.get("ai_generated")
        if is_ai_generated:
            queryset = queryset.filter(is_ai_generated=is_ai_generated.lower() == "true")

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        return queryset

    def _broadcast_change(self, instance, action):
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"project_{instance.project_id}_srs" if instance.project_id else "srs_global",
                {
                    "type": "srs.update",
                    "action": action,
                    "document_id": str(instance.id),
                    "user": self.request.user.username if self.request.user.is_authenticated else "system",
                }
            )

    def perform_create(self, serializer):
        user = self.request.user
        if not user.organization:
            raise ValidationError("You must belong to an organization to create an SRS document.")

        # Check plan limits
        from billing.models import TenantSubscription
        sub, _ = TenantSubscription.objects.get_or_create(
            organization=user.organization,
            defaults={
                "plan_tier": "FREE",
                "seats_limit": 5,
                "is_active": True,
                "ai_credits_limit": 100
            }
        )
        if sub.plan_tier == "FREE":
            existing_count = SRSDocument.objects.filter(
                project__organization_id=user.organization_id
            ).count()
            if existing_count >= 2:
                raise ValidationError("Under the Free plan, you are limited to 2 SRS documents. Please upgrade to Pro.")

        serializer.save(created_by=user)
        self._broadcast_change(serializer.instance, "create")
        from projects.models import log_activity
        if serializer.instance.project:
            log_activity(
                serializer.instance.project,
                self.request.user,
                f"created SRS document '{serializer.instance.title}'"
            )

    def perform_update(self, serializer):
        serializer.save(last_modified_by=self.request.user)
        self._broadcast_change(serializer.instance, "update")
        from projects.models import log_activity
        if serializer.instance.project:
            log_activity(
                serializer.instance.project,
                self.request.user,
                f"modified SRS document '{serializer.instance.title}'"
            )

    def perform_destroy(self, instance):
        project = instance.project
        title = instance.title
        instance.delete()
        if project:
            from projects.models import log_activity
            log_activity(
                project,
                self.request.user,
                f"deleted SRS document '{title}'"
            )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="SRS documents retrieved successfully.")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_success(data=serializer.data, message="SRS document details retrieved successfully.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return api_success(
            data=serializer.data,
            message="SRS document created successfully.",
            status_code=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return api_success(data=serializer.data, message="SRS document updated successfully.")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return api_success(message="SRS document deleted successfully.", status_code=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def create_version(self, request, pk=None):
        """Create a version snapshot of the document."""
        document = self.get_object()
        version_number = request.data.get('version_number')
        change_summary = request.data.get('change_summary', '')

        if not version_number:
            raise ValidationError("Version number is required.")

        # Create snapshot
        serializer = SRSDocumentSerializer(document)
        snapshot_data = serializer.data

        version = SRSVersion.objects.create(
            document=document,
            version_number=version_number,
            change_summary=change_summary,
            created_by=request.user,
            snapshot_data=snapshot_data
        )

        # Update document version
        document.version = version_number
        document.save()

        return api_success(
            data=SRSVersionSerializer(version).data,
            message="Version created successfully."
        )

    @action(detail=False, methods=['post'])
    def create_ieee_template(self, request):
        """Create a blank IEEE 830 SRS template with standard sections."""
        user = request.user
        project_id = request.data.get('project_id')
        title = request.data.get('title', 'IEEE 830 Software Requirements Specification')
        description = request.data.get('description', 'Standard IEEE 830 SRS template')

        if not user.organization:
            raise ValidationError("You must belong to an organization to create an SRS document.")

        if not project_id:
            raise ValidationError("Project ID is required.")

        from projects.models import Project
        try:
            project = Project.objects.get(id=project_id, organization=user.organization)
        except Project.DoesNotExist:
            raise ValidationError("Project not found or you don't have access.")

        # Check plan limits
        from billing.models import TenantSubscription
        sub, _ = TenantSubscription.objects.get_or_create(
            organization=user.organization,
            defaults={
                "plan_tier": "FREE",
                "seats_limit": 5,
                "is_active": True,
                "ai_credits_limit": 100
            }
        )
        if sub.plan_tier == "FREE":
            existing_count = SRSDocument.objects.filter(
                project__organization_id=user.organization_id
            ).count()
            if existing_count >= 2:
                raise ValidationError("Under the Free plan, you are limited to 2 SRS documents. Please upgrade to Pro.")

        # Create the document
        document = SRSDocument.objects.create(
            project=project,
            title=title,
            description=description,
            status="DRAFT",
            template_type="IEEE_830",
            version="1.0",
            created_by=user,
            last_modified_by=user
        )

        # Create IEEE 830 standard sections
        ieee_sections = [
            ("INTRODUCTION", "Introduction"),
            ("INTRODUCTION_PURPOSE", "Purpose"),
            ("INTRODUCTION_SCOPE", "Scope"),
            ("INTRODUCTION_AUDIENCE", "Intended Audience"),
            ("INTRODUCTION_DEFINITIONS", "Definitions"),
            ("INTRODUCTION_REFERENCES", "References"),
            ("INTRODUCTION_OVERVIEW", "Document Overview"),
            ("OVERALL_DESCRIPTION", "Overall Description"),
            ("OVERALL_PERSPECTIVE", "Product Perspective"),
            ("OVERALL_FUNCTIONS", "Product Functions"),
            ("OVERALL_USERS", "User Classes"),
            ("OVERALL_ENVIRONMENT", "Operating Environment"),
            ("OVERALL_CONSTRAINTS", "Constraints"),
            ("OVERALL_ASSUMPTIONS", "Assumptions"),
            ("EXTERNAL_INTERFACE", "External Interface Requirements"),
            ("EXTERNAL_UI", "User Interfaces"),
            ("EXTERNAL_HARDWARE", "Hardware Interfaces"),
            ("EXTERNAL_SOFTWARE", "Software Interfaces"),
            ("EXTERNAL_COMMUNICATION", "Communication Interfaces"),
            ("SYSTEM_FEATURES", "System Features"),
            ("FUNCTIONAL_REQUIREMENTS", "Functional Requirements"),
            ("NON_FUNCTIONAL_REQUIREMENTS", "Non Functional Requirements"),
            ("DATABASE_REQUIREMENTS", "Database Requirements"),
            ("DATA_DICTIONARY", "Data Dictionary"),
            ("USE_CASES", "Use Cases"),
            ("ACTIVITY_DIAGRAMS", "Activity Diagrams"),
            ("SEQUENCE_DIAGRAMS", "Sequence Diagrams"),
            ("CLASS_DIAGRAM", "Class Diagram"),
            ("ER_DIAGRAM", "ER Diagram"),
            ("STATE_DIAGRAM", "State Diagram"),
            ("SYSTEM_ARCHITECTURE", "System Architecture"),
            ("PERFORMANCE_REQUIREMENTS", "Performance Requirements"),
            ("SECURITY_REQUIREMENTS", "Security Requirements"),
            ("RISK_ANALYSIS", "Risk Analysis"),
            ("FUTURE_ENHANCEMENTS", "Future Enhancements"),
            ("APPENDIX", "Appendix"),
            ("BIBLIOGRAPHY", "Bibliography")
        ]

        for order, (section_type, section_title) in enumerate(ieee_sections, start=1):
            SRSSection.objects.create(
                document=document,
                section_type=section_type,
                title=section_title,
                content="",
                order=order
            )

        # Log activity
        from projects.models import log_activity
        log_activity(
            project,
            user,
            f"created IEEE 830 SRS template '{title}'"
        )

        # Broadcast change
        self._broadcast_change(document, "create")

        return api_success(
            data=SRSDocumentSerializer(document).data,
            message="IEEE 830 template created successfully.",
            status_code=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def restore_version(self, request, pk=None):
        """Restore document from a specific version."""
        document = self.get_object()
        version_id = request.data.get('version_id')

        try:
            version = SRSVersion.objects.get(id=version_id, document=document)
        except SRSVersion.DoesNotExist:
            raise ValidationError("Version not found.")

        # Restore from snapshot
        snapshot_data = version.snapshot_data
        
        # Restore sections
        document.sections.all().delete()
        for section_data in snapshot_data.get('sections', []):
            SRSSection.objects.create(
                document=document,
                parent_section_id=section_data.get('parent_section'),
                section_type=section_data.get('section_type'),
                title=section_data.get('title'),
                content=section_data.get('content', ''),
                order=section_data.get('order', 0),
                is_collapsed=section_data.get('is_collapsed', False),
                is_locked=section_data.get('is_locked', False)
            )

        # Update document fields
        document.title = snapshot_data.get('title')
        document.description = snapshot_data.get('description')
        document.save()

        return api_success(
            data=SRSDocumentSerializer(document).data,
            message="Document restored successfully."
        )

    @action(detail=True, methods=['post'])
    def request_approval(self, request, pk=None):
        """Request approval from reviewers."""
        document = self.get_object()
        reviewer_ids = request.data.get('reviewer_ids', [])

        if not reviewer_ids:
            raise ValidationError("At least one reviewer must be specified.")

        for reviewer_id in reviewer_ids:
            SRSApproval.objects.get_or_create(
                document=document,
                reviewer_id=reviewer_id,
                defaults={'status': 'PENDING'}
            )

        return api_success(message="Approval requests sent successfully.")

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve or reject the document."""
        document = self.get_object()
        approval_status = request.data.get('status', 'APPROVED')
        comments = request.data.get('comments', '')

        approval, created = SRSApproval.objects.get_or_create(
            document=document,
            reviewer=request.user,
            defaults={'status': approval_status, 'comments': comments}
        )

        if not created:
            approval.status = approval_status
            approval.comments = comments
            approval.reviewed_at = None
            approval.save()

        if approval_status == 'APPROVED':
            approval.reviewed_at = None
            approval.save()
        else:
            approval.reviewed_at = None
            approval.save()

        return api_success(
            data=SRSApprovalSerializer(approval).data,
            message="Document approval status updated."
        )


class SRSSectionViewSet(viewsets.ModelViewSet):
    """
    ViewSet handling SRS Section CRUD operations.
    """
    serializer_class = SRSSectionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return SRSSection.objects.none()

        queryset = SRSSection.objects.filter(
            document__project__organization_id=user.organization_id
        ).select_related('document', 'parent_section')

        document_id = self.request.query_params.get("document")
        if document_id:
            queryset = queryset.filter(document_id=document_id)

        return queryset

    def perform_create(self, serializer):
        serializer.save()
        # Update document word count and reading time
        document = serializer.instance.document
        document.word_count = sum(len(section.content.split()) for section in document.sections.all())
        document.reading_time_minutes = max(1, document.word_count // 200)
        document.save()

    def perform_update(self, serializer):
        serializer.save()
        document = serializer.instance.document
        document.word_count = sum(len(section.content.split()) for section in document.sections.all())
        document.reading_time_minutes = max(1, document.word_count // 200)
        document.save()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="SRS sections retrieved successfully.")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_success(data=serializer.data, message="SRS section details retrieved successfully.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return api_success(
            data=serializer.data,
            message="SRS section created successfully.",
            status_code=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return api_success(data=serializer.data, message="SRS section updated successfully.")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        document = instance.document
        instance.delete()
        # Update document word count
        document.word_count = sum(len(section.content.split()) for section in document.sections.all())
        document.reading_time_minutes = max(1, document.word_count // 200)
        document.save()
        return api_success(message="SRS section deleted successfully.", status_code=status.HTTP_200_OK)


class SRSCommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet handling SRS Comment operations.
    """
    serializer_class = SRSCommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return SRSComment.objects.none()

        queryset = SRSComment.objects.filter(
            document__project__organization_id=user.organization_id
        ).select_related('document', 'section', 'author', 'parent_comment')

        document_id = self.request.query_params.get("document")
        if document_id:
            queryset = queryset.filter(document_id=document_id)

        section_id = self.request.query_params.get("section")
        if section_id:
            queryset = queryset.filter(section_id=section_id)

        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Resolve a comment."""
        comment = self.get_object()
        comment.is_resolved = True
        comment.resolved_by = request.user
        comment.resolved_at = None
        comment.save()
        return api_success(data=SRSCommentSerializer(comment).data, message="Comment resolved successfully.")

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Comments retrieved successfully.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return api_success(
            data=serializer.data,
            message="Comment created successfully.",
            status_code=status.HTTP_201_CREATED
        )


class SRSVersionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing SRS version history.
    """
    serializer_class = SRSVersionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return SRSVersion.objects.none()

        return SRSVersion.objects.filter(
            document__project__organization_id=user.organization_id
        ).select_related('document', 'created_by')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Version history retrieved successfully.")


class AIGenerationHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing AI generation history.
    """
    serializer_class = AIGenerationHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return AIGenerationHistory.objects.none()

        return AIGenerationHistory.objects.filter(
            document__project__organization_id=user.organization_id
        ).select_related('document', 'generated_by')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="AI generation history retrieved successfully.")
