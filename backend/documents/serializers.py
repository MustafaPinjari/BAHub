from rest_framework import serializers
from .models import BusinessDocument

class BusinessDocumentSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    signed_off_by_username = serializers.CharField(source="signed_off_by.username", read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = BusinessDocument
        fields = [
            "id",
            "project",
            "project_name",
            "doc_type",
            "title",
            "version",
            "status",
            "content",
            "confluence_page_id",
            "confluence_page_url",
            "created_by",
            "created_by_username",
            "signed_off_by",
            "signed_off_by_username",
            "signed_off_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", 
            "created_by", 
            "signed_off_by", 
            "signed_off_at", 
            "created_at", 
            "updated_at"
        ]

    def validate(self, attrs):
        request = self.context.get("request")
        project = attrs.get("project")

        if not project and self.instance:
            project = self.instance.project

        if not project:
            raise serializers.ValidationError("A project must be specified for the document.")

        if request and request.user.is_authenticated:
            org = request.user.organization
            if project.organization != org:
                raise serializers.ValidationError("Cannot create or update a document for a project outside your organization.")

        return attrs
