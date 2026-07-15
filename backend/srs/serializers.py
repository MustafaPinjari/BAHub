from rest_framework import serializers
from .models import (
    SRSDocument, SRSSection, SRSVersion, SRSComment,
    SRSApproval, SRSExport, SRSImport, AIGenerationHistory
)


class SRSSectionSerializer(serializers.ModelSerializer):
    """Serializer for SRS sections with nested child sections support."""
    child_sections = serializers.SerializerMethodField()
    linked_diagram_details = serializers.SerializerMethodField()

    class Meta:
        model = SRSSection
        fields = [
            "id",
            "document",
            "parent_section",
            "section_type",
            "title",
            "content",
            "order",
            "is_collapsed",
            "is_locked",
            "linked_diagram",
            "linked_diagram_details",
            "child_sections",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_child_sections(self, obj):
        children = obj.child_sections.all()
        return SRSSectionSerializer(children, many=True).data

    def get_linked_diagram_details(self, obj):
        if obj.linked_diagram:
            return {
                "id": str(obj.linked_diagram.id),
                "name": obj.linked_diagram.name,
                "diagram_type": obj.linked_diagram.diagram_type,
            }
        return None


class SRSDocumentSerializer(serializers.ModelSerializer):
    """Serializer for SRS documents with sections and metadata."""
    sections = SRSSectionSerializer(many=True, read_only=True)
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    last_modified_by_username = serializers.CharField(source="last_modified_by.username", read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = SRSDocument
        fields = [
            "id",
            "title",
            "description",
            "project",
            "project_name",
            "status",
            "template_type",
            "version",
            "word_count",
            "reading_time_minutes",
            "is_ai_generated",
            "created_by",
            "created_by_username",
            "last_modified_by",
            "last_modified_by_username",
            "sections",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at", "word_count", "reading_time_minutes"]

    def validate(self, attrs):
        request = self.context.get("request")
        project = attrs.get("project")

        # If updating, pull project from instance
        if not project and self.instance:
            project = self.instance.project

        # Ensure project organization matches the user's organization
        if request and request.user.is_authenticated and project:
            org = request.user.organization
            if project.organization != org:
                raise serializers.ValidationError(
                    {"project": "Cannot create or update an SRS for a project outside your organization."}
                )

        return attrs


class SRSVersionSerializer(serializers.ModelSerializer):
    """Serializer for SRS version history."""
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)

    class Meta:
        model = SRSVersion
        fields = [
            "id",
            "document",
            "version_number",
            "change_summary",
            "created_by",
            "created_by_username",
            "snapshot_data",
            "created_at",
        ]
        read_only_fields = ["id", "created_by", "created_at"]


class SRSCommentSerializer(serializers.ModelSerializer):
    """Serializer for SRS comments with replies support."""
    replies = serializers.SerializerMethodField()
    author_username = serializers.CharField(source="author.username", read_only=True)
    resolved_by_username = serializers.CharField(source="resolved_by.username", read_only=True)

    class Meta:
        model = SRSComment
        fields = [
            "id",
            "document",
            "section",
            "parent_comment",
            "author",
            "author_username",
            "content",
            "is_resolved",
            "resolved_by",
            "resolved_by_username",
            "resolved_at",
            "replies",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "author", "created_at", "updated_at", "resolved_by", "resolved_at"]

    def get_replies(self, obj):
        replies = obj.replies.all()
        return SRSCommentSerializer(replies, many=True).data


class SRSApprovalSerializer(serializers.ModelSerializer):
    """Serializer for SRS approval workflow."""
    reviewer_username = serializers.CharField(source="reviewer.username", read_only=True)

    class Meta:
        model = SRSApproval
        fields = [
            "id",
            "document",
            "reviewer",
            "reviewer_username",
            "status",
            "comments",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "reviewed_at"]


class SRSExportSerializer(serializers.ModelSerializer):
    """Serializer for SRS export history."""
    exported_by_username = serializers.CharField(source="exported_by.username", read_only=True)

    class Meta:
        model = SRSExport
        fields = [
            "id",
            "document",
            "format",
            "exported_by",
            "exported_by_username",
            "file_path",
            "file_size",
            "created_at",
        ]
        read_only_fields = ["id", "exported_by", "created_at", "file_size"]


class SRSImportSerializer(serializers.ModelSerializer):
    """Serializer for SRS import history."""
    imported_by_username = serializers.CharField(source="imported_by.username", read_only=True)

    class Meta:
        model = SRSImport
        fields = [
            "id",
            "document",
            "format",
            "imported_by",
            "imported_by_username",
            "original_filename",
            "file_path",
            "import_status",
            "error_message",
            "created_at",
        ]
        read_only_fields = ["id", "imported_by", "created_at"]


class AIGenerationHistorySerializer(serializers.ModelSerializer):
    """Serializer for AI generation history."""
    generated_by_username = serializers.CharField(source="generated_by.username", read_only=True)

    class Meta:
        model = AIGenerationHistory
        fields = [
            "id",
            "document",
            "generation_type",
            "source_type",
            "source_id",
            "prompt",
            "generated_content",
            "ai_credits_used",
            "generated_by",
            "generated_by_username",
            "created_at",
        ]
        read_only_fields = ["id", "generated_by", "created_at", "ai_credits_used"]


class SRSDocumentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for document lists."""
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)
    section_count = serializers.SerializerMethodField()

    class Meta:
        model = SRSDocument
        fields = [
            "id",
            "title",
            "description",
            "project",
            "project_name",
            "status",
            "template_type",
            "version",
            "is_ai_generated",
            "created_by_username",
            "section_count",
            "created_at",
            "updated_at",
        ]

    def get_section_count(self, obj):
        return obj.sections.count()
