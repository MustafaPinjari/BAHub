from rest_framework import serializers
from .models import UserStory
from requirements.serializers import RequirementSerializer

class UserStorySerializer(serializers.ModelSerializer):
    requirement_detail = RequirementSerializer(source="requirement", read_only=True)

    class Meta:
        model = UserStory
        fields = [
            "id",
            "requirement",
            "requirement_detail",
            "story_id",
            "title",
            "role",
            "action",
            "benefit",
            "acceptance_criteria",
            "status",
            "points",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "story_id", "created_at", "updated_at"]

    def validate(self, attrs):
        request = self.context.get("request")
        requirement = attrs.get("requirement")

        # If updating, pull from instance
        if not requirement and self.instance:
            requirement = self.instance.requirement

        if not requirement:
            raise serializers.ValidationError("A parent requirement must be specified for the user story.")

        # Ensure requirement project belongs to the user's organization
        if request and request.user.is_authenticated:
            org = request.user.organization
            if requirement.project.organization != org:
                raise serializers.ValidationError("Cannot map a user story to a requirement outside your organization.")

        return attrs
