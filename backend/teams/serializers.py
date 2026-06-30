from rest_framework import serializers
from .models import Team
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email", "role"]

class TeamSerializer(serializers.ModelSerializer):
    lead_detail = UserSimpleSerializer(source="lead", read_only=True)
    members_detail = UserSimpleSerializer(source="members", many=True, read_only=True)

    class Meta:
        model = Team
        fields = [
            "id",
            "organization",
            "name",
            "description",
            "lead",
            "lead_detail",
            "members",
            "members_detail",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "organization", "created_at", "updated_at"]

    def validate(self, attrs):
        request = self.context.get("request")
        if self.instance:
            org = self.instance.organization
        elif request and request.user.is_authenticated:
            org = request.user.organization
        else:
            org = attrs.get("organization")

        if not org:
            raise serializers.ValidationError("An organization must be specified for the team.")

        # Validate that the team lead belongs to the same organization
        lead = attrs.get("lead")
        if lead and lead.organization != org:
            raise serializers.ValidationError(
                {"lead": "The team lead must belong to the team's organization."}
            )

        # Validate that all members belong to the same organization
        members = attrs.get("members")
        if members:
            for member in members:
                if member.organization != org:
                    raise serializers.ValidationError(
                        {"members": f"Member {member.username} does not belong to this organization."}
                    )

        return attrs
