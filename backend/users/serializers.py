from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from django.utils import timezone
from organizations.models import Organization, OrganizationInvitation
from users.models import UserPreference, UserSession

User = get_user_model()

class UserPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreference
        fields = [
            "theme",
            "accent_color",
            "language",
            "timezone",
            "date_format",
            "time_format",
            "sidebar_state",
        ]


class UserSerializer(serializers.ModelSerializer):
    preferences = UserPreferenceSerializer(read_only=True)
    organization_name = serializers.CharField(source="organization.name", read_only=True)
    
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "phone",
            "bio",
            "profile_picture",
            "organization",
            "organization_name",
            "preferences",
            "created_at",
        ]
        read_only_fields = ["id", "username", "email", "role", "organization", "created_at"]


class ProfileUpdateSerializer(serializers.ModelSerializer):
    preferences = UserPreferenceSerializer(required=False)
    organization_name = serializers.CharField(source="organization.name", read_only=True)
    
    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "phone",
            "bio",
            "profile_picture",
            "preferences",
            "organization_name",
        ]
        read_only_fields = ["id", "organization_name"]

    @transaction.atomic
    def update(self, instance, validated_data):
        preferences_data = validated_data.pop("preferences", None)
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update nested preferences
        if preferences_data is not None:
            pref_instance = instance.preferences
            for attr, value in preferences_data.items():
                setattr(pref_instance, attr, value)
            pref_instance.save()
            
        return instance


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(max_length=150, required=False, default="")
    last_name = serializers.CharField(max_length=150, required=False, default="")
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, default=User.BUSINESS_ANALYST)
    organization_name = serializers.CharField(max_length=255, required=False, default="")
    invite_token = serializers.UUIDField(required=False, allow_null=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        return value

    def validate_password(self, value):
        try:
            # Validates against AUTH_PASSWORD_VALIDATORS in settings.py
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, attrs):
        invite_token = attrs.get("invite_token")
        org_name = attrs.get("organization_name", "").strip()
        email = attrs.get("email")

        if invite_token:
            try:
                invite = OrganizationInvitation.objects.get(
                    token=invite_token,
                    email=email,
                    is_used=False
                )
            except OrganizationInvitation.DoesNotExist:
                raise serializers.ValidationError({
                    "invite_token": "Invalid or expired invitation token."
                })
            
            if invite.expires_at < timezone.now():
                raise serializers.ValidationError({
                    "invite_token": "This invitation token has expired."
                })
            
            attrs["validated_invite"] = invite
        else:
            if not org_name:
                raise serializers.ValidationError({
                    "organization_name": "Organization name is required to register a new workspace."
                })
            if Organization.objects.filter(name=org_name).exists():
                raise serializers.ValidationError({
                    "organization_name": "An organization with this name already exists. Please join via invitation token."
                })
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        username = validated_data["username"]
        email = validated_data["email"]
        password = validated_data["password"]
        first_name = validated_data.get("first_name", "")
        last_name = validated_data.get("last_name", "")
        role = validated_data.get("role", User.BUSINESS_ANALYST)
        
        invite = validated_data.get("validated_invite")
        if invite:
            organization = invite.organization
            role = invite.role
        else:
            org_name = validated_data.get("organization_name", "")
            organization = Organization.objects.create(
                name=org_name,
                description=f"Default workspace created for {username}."
            )

        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=role,
            organization=organization
        )

        # Initialize default user preferences
        UserPreference.objects.create(user=user)

        # Mark invitation as used
        if invite:
            invite.is_used = True
            invite.save()

        return user


class UserSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSession
        fields = [
            "id",
            "ip_address",
            "user_agent",
            "browser",
            "device",
            "is_active",
            "last_activity",
            "created_at",
        ]


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Inject custom claims into JWT payload
        token["role"] = user.role
        token["organization_id"] = str(user.organization_id) if user.organization_id else None
        token["username"] = user.username
        token["email"] = user.email
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Attach full user profile data to the response JSON payload
        user_serializer = UserSerializer(self.user)
        data["user"] = user_serializer.data
        return data
