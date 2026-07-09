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
    plan_tier = serializers.SerializerMethodField()
    plan_verified = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()
    in_grace_period = serializers.SerializerMethodField()
    grace_period_remaining_days = serializers.SerializerMethodField()
    subscription_expires_at = serializers.SerializerMethodField()
    
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
            "plan_tier",
            "plan_verified",
            "payment_status",
            "in_grace_period",
            "grace_period_remaining_days",
            "subscription_expires_at",
            "is_staff",
            "is_superuser",
            "created_at",
        ]
        read_only_fields = [
            "id", "username", "email", "role", "organization", "plan_tier", 
            "plan_verified", "payment_status", "in_grace_period", 
            "grace_period_remaining_days", "subscription_expires_at", 
            "is_staff", "is_superuser", "created_at"
        ]

    def get_subscription_obj(self, obj):
        if not obj.organization:
            return None
        from billing.models import TenantSubscription
        sub, _ = TenantSubscription.objects.get_or_create(
            organization=obj.organization,
            defaults={
                "plan_tier": "FREE",
                "seats_limit": 5,
                "is_active": True,
                "plan_verified": True,
                "ai_credits_limit": 100
            }
        )
        return sub

    def get_plan_tier(self, obj):
        sub = self.get_subscription_obj(obj)
        return sub.plan_tier if sub else "FREE"

    def get_plan_verified(self, obj):
        sub = self.get_subscription_obj(obj)
        return sub.plan_verified if sub else True

    def get_payment_status(self, obj):
        sub = self.get_subscription_obj(obj)
        return sub.payment_status if sub else "SUCCESS"

    def get_in_grace_period(self, obj):
        sub = self.get_subscription_obj(obj)
        if sub and sub.plan_tier != "FREE" and sub.expires_at:
            from django.utils import timezone
            import datetime
            now = timezone.now()
            grace_ends = sub.expires_at + datetime.timedelta(days=7)
            return sub.expires_at < now < grace_ends
        return False

    def get_grace_period_remaining_days(self, obj):
        sub = self.get_subscription_obj(obj)
        if sub and sub.plan_tier != "FREE" and sub.expires_at:
            from django.utils import timezone
            import datetime
            now = timezone.now()
            grace_ends = sub.expires_at + datetime.timedelta(days=7)
            if sub.expires_at < now < grace_ends:
                diff = grace_ends - now
                return max(0, diff.days)
        return 0

    def get_subscription_expires_at(self, obj):
        sub = self.get_subscription_obj(obj)
        if sub and sub.expires_at:
            return sub.expires_at.strftime("%Y-%m-%d")
        return None


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
    plan_tier = serializers.ChoiceField(choices=["FREE", "PRO", "ENTERPRISE"], default="FREE", required=False)

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
            
            # Check subscription seat limit
            from billing.models import TenantSubscription
            sub, _ = TenantSubscription.objects.get_or_create(
                organization=invite.organization,
                defaults={
                    "plan_tier": "FREE",
                    "seats_limit": 5,
                    "is_active": True,
                    "ai_credits_limit": 100
                }
            )
            if not sub.is_active:
                raise serializers.ValidationError({
                    "invite_token": "The workspace subscription is currently inactive. Please contact your administrator."
                })
            current_members = User.objects.filter(organization=invite.organization, is_active=True).count()
            if current_members >= sub.seats_limit:
                raise serializers.ValidationError({
                    "invite_token": "This workspace has reached its member seat limit. The administrator must upgrade the subscription to add more seats."
                })

            attrs["validated_invite"] = invite
        else:
            if not org_name:
                raise serializers.ValidationError({
                    "organization_name": "Organization name is required to register a new workspace."
                })
            cleaned_name = org_name.strip()
            if Organization.objects.filter(name__iexact=cleaned_name).exists():
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
            role = User.ADMIN


        # Create user (inactive until OTP verification)
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=role,
            organization=organization,
            is_active=False
        )

        # Initialize default user preferences
        UserPreference.objects.create(user=user)

        # Update tenant subscription if plan_tier was specified and is not FREE
        plan_tier = validated_data.get("plan_tier", "FREE")
        if not invite and plan_tier != "FREE":
            from billing.models import TenantSubscription
            sub, _ = TenantSubscription.objects.get_or_create(
                organization=organization,
                defaults={
                    "plan_tier": "FREE",
                    "seats_limit": 5,
                    "is_active": True,
                    "plan_verified": True,
                    "ai_credits_limit": 100
                }
            )
            sub.plan_tier = plan_tier
            sub.plan_verified = False  # Set to False until they pay!
            sub.is_active = False  # Set to False until they pay!
            sub.payment_status = "PENDING"
            if plan_tier == "PRO":
                sub.seats_limit = 20
                sub.ai_credits_limit = 1000
            elif plan_tier == "ENTERPRISE":
                sub.seats_limit = 1000
                sub.ai_credits_limit = 10000
            sub.save()

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
        username = attrs.get(self.username_field)
        password = attrs.get("password")

        try:
            user = User.objects.get(**{self.username_field: username})
        except User.DoesNotExist:
            user = None

        if user and not user.is_active:
            from users.models import EmailOTP
            has_otp = EmailOTP.objects.filter(user=user, is_verified=False).exists()
            if has_otp:
                if user.check_password(password):
                    raise serializers.ValidationError({
                        "requires_verification": True,
                        "username": user.username,
                        "detail": "This account is not verified yet. Please verify your email."
                    })

        data = super().validate(attrs)
        # Attach full user profile data to the response JSON payload
        user_serializer = UserSerializer(self.user)
        data["user"] = user_serializer.data
        return data

