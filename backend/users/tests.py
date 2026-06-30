import uuid
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import UserSession, UserPreference
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
        """Verify registration endpoints create users, preferences, and workspace organizations."""
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
        self.assertEqual(response.data["data"]["username"], "tester")
        self.assertEqual(response.data["data"]["organization_name"], "Test Organization")
        
        # Verify db persistence
        user = User.objects.get(username="tester")
        self.assertEqual(user.email, "tester@bahub.local")
        self.assertEqual(user.role, "BUSINESS_ANALYST")
        self.assertIsNotNone(user.organization)
        self.assertEqual(user.organization.name, "Test Organization")
        
        # Verify nested preferences are created
        self.assertTrue(UserPreference.objects.filter(user=user).exists())
        self.assertEqual(user.preferences.theme, "system")

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
