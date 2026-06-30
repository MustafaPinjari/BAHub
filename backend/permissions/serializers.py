from rest_framework import serializers
from .models import Permission, Role, UserRole, UserPermissionOverride
from django.contrib.auth import get_user_model

User = get_user_model()

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ["id", "name", "codename", "description"]
        read_only_fields = ["id"]

class RoleSerializer(serializers.ModelSerializer):
    permissions_detail = PermissionSerializer(source="permissions", many=True, read_only=True)

    class Meta:
        model = Role
        fields = [
            "id",
            "organization",
            "name",
            "description",
            "permissions",
            "permissions_detail",
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
            raise serializers.ValidationError("An organization must be specified for the role.")

        return attrs

class UserRoleSerializer(serializers.ModelSerializer):
    role_detail = RoleSerializer(source="role", read_only=True)

    class Meta:
        model = UserRole
        fields = ["id", "user", "role", "role_detail"]
        read_only_fields = ["id"]

    def validate(self, attrs):
        user = attrs.get("user")
        role = attrs.get("role")

        if user and role and user.organization != role.organization:
            raise serializers.ValidationError("Cannot assign a tenant-role to a user from another organization.")

        return attrs

class UserPermissionOverrideSerializer(serializers.ModelSerializer):
    permission_detail = PermissionSerializer(source="permission", read_only=True)

    class Meta:
        model = UserPermissionOverride
        fields = ["id", "user", "permission", "permission_detail", "is_allowed"]
        read_only_fields = ["id"]
