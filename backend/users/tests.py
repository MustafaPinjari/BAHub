import uuid
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import UserSession, UserPreference, EmailOTP
from users.validators import EnterprisePasswordValidator
from organizations.models import Organization

User = get_user_model()

class CoreAndAuthTests(APITestCase):
    def setUp(self):
        # We start with clean tables
        pass

    def test_health_check(self):
        """Verify the health check endpoint returns 200 and healthy status."""
        url = reverse("api-health")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"status": "healthy"})

    def test_new_health_check(self):
        """Verify the new unauthenticated /health/ check returns 200 with the correct metadata."""
        url = reverse("backend-health")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "ok")
        self.assertEqual(response.data["service"], "BAHub Backend")
        self.assertIn("timestamp", response.data)
        self.assertEqual(response.data["version"], "1.0")

    def test_root_check(self):
        """Verify the root URL / returns 200 with a friendly running status."""
        url = reverse("backend-root")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {
            "service": "BAHub Backend",
            "status": "running",
            "health": "/health/",
            "docs": "/api/docs/"
        })

    def test_password_policy(self):
        """Verify custom EnterprisePasswordValidator filters weak passwords."""
        validator = EnterprisePasswordValidator()
        
        # Valid password
        try:
            validator.validate("SecureP@ss123")
        except DjangoValidationError:
            self.fail("EnterprisePasswordValidator raised ValidationError for a valid password.")

        # Too short
        with self.assertRaises(DjangoValidationError) as ctx:
            validator.validate("Sh0rt!")
        self.assertIn("at least 8 characters", str(ctx.exception))

        # No uppercase
        with self.assertRaises(DjangoValidationError) as ctx:
            validator.validate("lowercase123!")
        self.assertIn("uppercase letter", str(ctx.exception))

        # No lowercase
        with self.assertRaises(DjangoValidationError) as ctx:
            validator.validate("UPPERCASE123!")
        self.assertIn("lowercase letter", str(ctx.exception))

        # No digit
        with self.assertRaises(DjangoValidationError) as ctx:
            validator.validate("NoDigitsHere!")
        self.assertIn("at least one digit", str(ctx.exception))

        # No special character
        with self.assertRaises(DjangoValidationError) as ctx:
            validator.validate("PasswordWithDigits123")
        self.assertIn("special character", str(ctx.exception))

    def test_user_registration(self):
        """Verify registration endpoints create users, preferences, and workspace organizations but require verification."""
        url = reverse("auth-register")
        payload = {
            "username": "tester",
            "email": "tester@bahub.local",
            "password": "SecureP@ss123",
            "role": "BUSINESS_ANALYST",
            "organization_name": "Test Organization"
        }
        
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["data"]["user"]["username"], "tester")
        self.assertEqual(response.data["data"]["user"]["organization_name"], "Test Organization")
        self.assertTrue(response.data["data"]["requires_verification"])
        self.assertNotIn("access", response.data["data"])
        
        # Verify db persistence and that user is not active yet
        user = User.objects.get(username="tester")
        self.assertEqual(user.email, "tester@bahub.local")
        self.assertFalse(user.is_active)
        
        # Verify nested preferences are created
        self.assertTrue(UserPreference.objects.filter(user=user).exists())
        
        # Verify OTP is created
        self.assertTrue(EmailOTP.objects.filter(user=user).exists())

    def test_user_otp_verification_success(self):
        """Verify verify-otp view activates the user and returns tokens."""
        url_register = reverse("auth-register")
        payload = {
            "username": "tester_verify",
            "email": "tester_verify@bahub.local",
            "password": "SecureP@ss123",
            "role": "BUSINESS_ANALYST",
            "organization_name": "Verify Org"
        }
        self.client.post(url_register, payload)
        user = User.objects.get(username="tester_verify")
        otp_record = EmailOTP.objects.get(user=user)
        
        url_verify = reverse("auth-verify-otp")
        response = self.client.post(url_verify, {
            "username": "tester_verify",
            "otp_code": otp_record.otp_code
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertIn("access", response.data["data"])
        self.assertIn("refresh", response.data["data"])
        
        user.refresh_from_db()
        self.assertTrue(user.is_active)

    def test_user_otp_verification_failure(self):
        """Verify verify-otp view rejects invalid/expired codes."""
        url_register = reverse("auth-register")
        payload = {
            "username": "tester_verify_fail",
            "email": "tester_verify_fail@bahub.local",
            "password": "SecureP@ss123",
            "role": "BUSINESS_ANALYST",
            "organization_name": "Verify Fail Org"
        }
        self.client.post(url_register, payload)
        
        url_verify = reverse("auth-verify-otp")
        response = self.client.post(url_verify, {
            "username": "tester_verify_fail",
            "otp_code": "000000"  # Invalid code
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])

    def test_user_otp_resend(self):
        """Verify resend-otp updates the OTP code."""
        url_register = reverse("auth-register")
        payload = {
            "username": "tester_resend",
            "email": "tester_resend@bahub.local",
            "password": "SecureP@ss123",
            "role": "BUSINESS_ANALYST",
            "organization_name": "Resend Org"
        }
        self.client.post(url_register, payload)
        user = User.objects.get(username="tester_resend")
        old_otp = EmailOTP.objects.get(user=user).otp_code
        
        url_resend = reverse("auth-resend-otp")
        response = self.client.post(url_resend, {
            "username": "tester_resend"
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        new_otp = EmailOTP.objects.get(user=user).otp_code
        self.assertNotEqual(old_otp, new_otp)

    def test_user_login_and_session_logging(self):
        """Verify login issues JWT, stores custom claims, and registers a UserSession."""
        # Create user manually first
        org = Organization.objects.create(name="Login Org")
        user = User.objects.create_user(
            username="loginuser",
            email="login@bahub.local",
            password="SecureP@ss123",
            role="ADMIN",
            organization=org
        )
        UserPreference.objects.create(user=user)

        url = reverse("token-login")
        payload = {
            "username": "loginuser",
            "password": "SecureP@ss123"
        }
        
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertIn("access", response.data["data"])
        self.assertIn("refresh", response.data["data"])
        
        # Verify custom user serialization inside response
        self.assertEqual(response.data["data"]["user"]["username"], "loginuser")
        self.assertEqual(response.data["data"]["user"]["role"], "ADMIN")
        
        # Verify session logged in SQLite
        session = UserSession.objects.filter(user=user).first()
        self.assertIsNotNone(session)
        self.assertTrue(session.is_active)
        self.assertEqual(session.browser, "Unknown Browser") # default since client mock has no User-Agent

    def test_profile_and_preferences_updates(self):
        """Verify profile retrieve and update views including nested UserPreferences updates."""
        org = Organization.objects.create(name="Profile Org")
        user = User.objects.create_user(
            username="profileuser",
            email="profile@bahub.local",
            password="SecureP@ss123",
            role="BUSINESS_ANALYST",
            organization=org
        )
        UserPreference.objects.create(user=user)

        # Authenticate
        self.client.force_authenticate(user=user)

        url = reverse("auth-profile")
        
        # Retrieve Profile
        get_response = self.client.get(url)
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)
        self.assertEqual(get_response.data["data"]["username"], "profileuser")
        self.assertEqual(get_response.data["data"]["preferences"]["theme"], "system")

        # Update Profile & nested Preferences
        update_payload = {
            "first_name": "UpdatedName",
            "phone": "1234567890",
            "bio": "A passionate Business Analyst",
            "preferences": {
                "theme": "dark",
                "accent_color": "emerald",
                "sidebar_state": "collapsed"
            }
        }
        
        put_response = self.client.put(url, update_payload, format="json")
        self.assertEqual(put_response.status_code, status.HTTP_200_OK)
        self.assertEqual(put_response.data["data"]["first_name"], "UpdatedName")
        self.assertEqual(put_response.data["data"]["phone"], "1234567890")
        self.assertEqual(put_response.data["data"]["preferences"]["theme"], "dark")
        self.assertEqual(put_response.data["data"]["preferences"]["accent_color"], "emerald")

        # Verify db change
        user.refresh_from_db()
        self.assertEqual(user.first_name, "UpdatedName")
        self.assertEqual(user.preferences.theme, "dark")
        self.assertEqual(user.preferences.sidebar_state, "collapsed")

    def test_registration_duplicate_organization_fails(self):
        """Verify registration fails if no invite token is provided and organization name already exists."""
        # Pre-create organization
        Organization.objects.create(name="Existing Org")
        
        url = reverse("auth-register")
        payload = {
            "username": "tester_dup",
            "email": "tester_dup@bahub.local",
            "password": "SecureP@ss123",
            "role": "BUSINESS_ANALYST",
            "organization_name": "Existing Org"
        }
        
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertIn("organization_name", response.data["errors"])

    def test_registration_with_valid_invite_token_succeeds(self):
        """Verify registration succeeds with a valid invitation token and links the user to the invitation's org/role."""
        import datetime
        from django.utils import timezone
        from organizations.models import OrganizationInvitation
        
        org = Organization.objects.create(name="Invite Org")
        invite = OrganizationInvitation.objects.create(
            organization=org,
            email="invitee@bahub.local",
            role="DEVELOPER",
            expires_at=timezone.now() + datetime.timedelta(days=1)
        )
        
        url = reverse("auth-register")
        payload = {
            "username": "invitee",
            "email": "invitee@bahub.local",
            "password": "SecureP@ss123",
            "invite_token": str(invite.token)
        }
        
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        user = User.objects.get(username="invitee")
        self.assertEqual(user.organization, org)
        self.assertEqual(user.role, "DEVELOPER")
        
        # Verify invitation is marked as used
        invite.refresh_from_db()
        self.assertTrue(invite.is_used)

    def test_registration_with_invalid_invite_token_fails(self):
        """Verify registration fails if the invite token is invalid, expired, or email mismatches."""
        import datetime
        from django.utils import timezone
        from organizations.models import OrganizationInvitation
        
        org = Organization.objects.create(name="Invite Org 2")
        
        # Expired token
        expired_invite = OrganizationInvitation.objects.create(
            organization=org,
            email="expired@bahub.local",
            role="DEVELOPER",
            expires_at=timezone.now() - datetime.timedelta(days=1)
        )
        
        url = reverse("auth-register")
        
        # Expired test
        payload_expired = {
            "username": "expired_user",
            "email": "expired@bahub.local",
            "password": "SecureP@ss123",
            "invite_token": str(expired_invite.token)
        }
        response = self.client.post(url, payload_expired)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Mismatched email test
        valid_invite = OrganizationInvitation.objects.create(
            organization=org,
            email="valid@bahub.local",
            role="DEVELOPER",
            expires_at=timezone.now() + datetime.timedelta(days=1)
        )
        payload_mismatch = {
            "username": "mismatch_user",
            "email": "mismatch@bahub.local",
            "password": "SecureP@ss123",
            "invite_token": str(valid_invite.token)
        }
        response = self.client.post(url, payload_mismatch)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_logout_all_blacklists_tokens(self):
        """Verify auth-logout-all blacklists outstanding tokens so that they cannot be refreshed."""
        org = Organization.objects.create(name="Logout All Org")
        user = User.objects.create_user(
            username="logoutuser",
            email="logout@bahub.local",
            password="SecureP@ss123",
            role="BUSINESS_ANALYST",
            organization=org
        )
        UserPreference.objects.create(user=user)
        
        # Get tokens
        login_url = reverse("token-login")
        login_response = self.client.post(login_url, {
            "username": "logoutuser",
            "password": "SecureP@ss123"
        })
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        refresh_token = login_response.data["data"]["refresh"]
        
        # Authenticate
        self.client.force_authenticate(user=user)
        
        # Logout All
        logout_url = reverse("auth-logout-all")
        logout_response = self.client.post(logout_url)
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)
        
        # De-authenticate client to test refreshing anonymously
        self.client.force_authenticate(user=None)
        
        # Try refreshing token
        refresh_url = reverse("token-refresh")
        refresh_response = self.client.post(refresh_url, {
            "refresh": refresh_token
        })
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_superadmin_dashboard_view_denies_non_staff_non_superuser(self):
        """Verify standard users are blocked from superadmin dashboard API."""
        org = Organization.objects.create(name="Std Org")
        user = User.objects.create_user(
            username="regular_user",
            email="regular@bahub.local",
            password="SecureP@ss123",
            role="BUSINESS_ANALYST",
            organization=org
        )
        self.client.force_authenticate(user=user)
        url = reverse("users-superadmin-dashboard")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_superadmin_dashboard_view_allows_superuser(self):
        """Verify superusers can access the superadmin dashboard API."""
        org = Organization.objects.create(name="Super Org")
        admin_user = User.objects.create_superuser(
            username="super_user",
            email="super@bahub.local",
            password="SecureP@ss123",
            role="ADMIN",
            organization=org
        )
        self.client.force_authenticate(user=admin_user)
        url = reverse("users-superadmin-dashboard")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("organizations", response.data["data"])
        self.assertIn("users", response.data["data"])

    def test_superadmin_dashboard_update_organization(self):
        """Verify superuser can update an organization's plan tier and verification status."""
        org = Organization.objects.create(name="Target Org")
        admin_user = User.objects.create_superuser(
            username="super_user_2",
            email="super2@bahub.local",
            password="SecureP@ss123",
            role="ADMIN",
            organization=org
        )
        self.client.force_authenticate(user=admin_user)
        url = reverse("users-superadmin-dashboard")
        
        # Upgrade plan to PRO and verify
        payload = {
            "action": "update_organization",
            "organization_id": str(org.id),
            "plan_tier": "PRO",
            "plan_verified": True,
            "is_active": True
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        from billing.models import TenantSubscription
        sub = TenantSubscription.objects.get(organization=org)
        self.assertEqual(sub.plan_tier, "PRO")
        self.assertTrue(sub.plan_verified)
        self.assertTrue(sub.is_active)

    def test_superadmin_dashboard_update_user_role(self):
        """Verify superuser can change a user's role."""
        org = Organization.objects.create(name="Role Org")
        admin_user = User.objects.create_superuser(
            username="super_user_3",
            email="super3@bahub.local",
            password="SecureP@ss123",
            role="ADMIN",
            organization=org
        )
        target_user = User.objects.create_user(
            username="target_member",
            email="target@bahub.local",
            password="SecureP@ss123",
            role="DEVELOPER",
            organization=org
        )
        self.client.force_authenticate(user=admin_user)
        url = reverse("users-superadmin-dashboard")
        
        payload = {
            "action": "update_user",
            "user_id": str(target_user.id),
            "role": "QA_TESTER",
            "is_active": True
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        target_user.refresh_from_db()
        self.assertEqual(target_user.role, "QA_TESTER")

    def test_superadmin_dashboard_maintenance_mode_blocks_regular_user(self):
        """Verify maintenance mode blocks regular users with 503 Service Unavailable."""
        from users.superadmin import get_system_settings, save_system_settings
        orig_settings = get_system_settings()
        
        # Turn maintenance mode on
        test_settings = {**orig_settings, "maintenance_mode": "true"}
        save_system_settings(test_settings)
        
        try:
            org = Organization.objects.create(name="Maint Org")
            user = User.objects.create_user(
                username="maint_user",
                email="maint@bahub.local",
                password="SecureP@ss123",
                role="BUSINESS_ANALYST",
                organization=org
            )
            self.client.force_authenticate(user=user)
            profile_url = reverse("auth-profile")
            response = self.client.get(profile_url, HTTP_X_TEST_MAINTENANCE="True")
            self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        finally:
            # Restore settings
            save_system_settings(orig_settings)

    def test_superadmin_dashboard_maintenance_mode_allows_superuser(self):
        """Verify maintenance mode allows superusers to bypass the block."""
        from users.superadmin import get_system_settings, save_system_settings
        orig_settings = get_system_settings()
        
        # Turn maintenance mode on
        test_settings = {**orig_settings, "maintenance_mode": "true"}
        save_system_settings(test_settings)
        
        try:
            org = Organization.objects.create(name="Maint Org 2")
            admin_user = User.objects.create_superuser(
                username="maint_super",
                email="maintsuper@bahub.local",
                password="SecureP@ss123",
                role="ADMIN",
                organization=org
            )
            self.client.force_authenticate(user=admin_user)
            profile_url = reverse("auth-profile")
            response = self.client.get(profile_url, HTTP_X_TEST_MAINTENANCE="True")
            self.assertEqual(response.status_code, status.HTTP_200_OK)
        finally:
            # Restore settings
            save_system_settings(orig_settings)

    def test_public_waitlist_signup_succeeds(self):
        """
        Verify that public users can successfully register for the waitlist.

        The waitlist was migrated from a fragile file-based approach (waitlist.json)
        to a proper database-backed model (WaitlistSignup) to survive deployments.
        This test verifies the DB-backed implementation.
        """
        from users.models import WaitlistSignup

        url = reverse("public-waitlist")
        payload = {"email": "waitlist_tester@bahub.local"}

        # Test first signup — should create a WaitlistSignup row
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])

        # Verify persisted in DB
        self.assertTrue(
            WaitlistSignup.objects.filter(email="waitlist_tester@bahub.local").exists(),
            "WaitlistSignup row should exist in the database after signup.",
        )

        # Test duplicate signup — should return 200 (already on list)
        response_dup = self.client.post(url, payload, format="json")
        self.assertEqual(response_dup.status_code, status.HTTP_200_OK)
        self.assertTrue(response_dup.data["success"])

        # Only one row should exist (no duplicates)
        count = WaitlistSignup.objects.filter(email="waitlist_tester@bahub.local").count()
        self.assertEqual(count, 1, "Duplicate signup should not create a second WaitlistSignup row.")



