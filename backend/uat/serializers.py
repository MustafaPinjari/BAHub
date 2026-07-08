from rest_framework import serializers
from .models import TestCase, Defect
from requirements.serializers import RequirementSerializer

class TestCaseSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    requirement_detail = RequirementSerializer(source="requirement", read_only=True)

    class Meta:
        model = TestCase
        fields = [
            "id",
            "project",
            "requirement",
            "requirement_detail",
            "title",
            "scenario",
            "acceptance_criteria",
            "status",
            "created_by",
            "created_by_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]

    def validate(self, attrs):
        request = self.context.get("request")
        project = attrs.get("project")

        if not project and self.instance:
            project = self.instance.project

        if not project:
            raise serializers.ValidationError("A project must be specified.")

        # Tenancy scoping checks
        if request and request.user.is_authenticated:
            org = request.user.organization
            if project.organization != org:
                raise serializers.ValidationError("Cannot link to a project outside your organization.")

        requirement = attrs.get("requirement")
        if requirement and requirement.project.organization != project.organization:
            raise serializers.ValidationError("Linked requirement must belong to the same organization.")

        return attrs

class DefectSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    test_case_title = serializers.CharField(source="test_case.title", read_only=True)

    class Meta:
        model = Defect
        fields = [
            "id",
            "project",
            "test_case",
            "test_case_title",
            "title",
            "description",
            "severity",
            "status",
            "created_by",
            "created_by_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]

    def validate(self, attrs):
        request = self.context.get("request")
        project = attrs.get("project")

        if not project and self.instance:
            project = self.instance.project

        if not project:
            raise serializers.ValidationError("A project must be specified.")

        # Tenancy scoping checks
        if request and request.user.is_authenticated:
            org = request.user.organization
            if project.organization != org:
                raise serializers.ValidationError("Cannot link to a project outside your organization.")

        test_case = attrs.get("test_case")
        if test_case and test_case.project.organization != project.organization:
            raise serializers.ValidationError("Linked test case must belong to the same organization.")

        return attrs
