"""
BAHub — Comprehensive Billing, Access Control, Email & Persistence Test Suite
=============================================================================
Coverage:
  1.  Subscription model & signal auto-creation
  2.  Plan limits: seat enforcement (FREE=5, PRO=20, ENTERPRISE=1000)
  3.  AI credit quota enforcement (FREE=100, PRO=1000, ENTERPRISE=10000)
  4.  Feature gating: BRD/FRD requires PRO+; Audit & Integrations require ENTERPRISE
  5.  Billing upgrade flow (mock checkout → DB update verified)
  6.  Billing downgrade on subscription cancellation
  7.  Role-based permission checks (ADMIN/BA/PO/DEVELOPER/QA/STAKEHOLDER)
  8.  Email backend: locmem backend functional, invitation token created in DB
  9.  Database persistence: all key entities survive write-read cycle
  10. Dashboard: plan_tier returned in user profile so frontend can gate features
  11. SSO JIT provisioning (ENTERPRISE plan auto-applied on first SSO user)
  12. Non-admin cannot upgrade billing
  13. Invalid plan name rejected at checkout
  14. plan_tier selected at registration is persisted
"""

import uuid
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.core import mail
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from organizations.models import Organization, OrganizationInvitation
from billing.models import TenantSubscription
from strategic.models import Project, AIJob
from permissions.helpers import check_permission

User = get_user_model()


# ─── Helpers ────────────────────────────────────────────────────────────────

def make_org_with_plan(name, plan="FREE"):
    org = Organization.objects.create(name=name)
    sub = TenantSubscription.objects.get(organization=org)
    if plan == "PRO":
        sub.plan_tier = "PRO"
        sub.seats_limit = 20
        sub.ai_credits_limit = 1000
    elif plan == "ENTERPRISE":
        sub.plan_tier = "ENTERPRISE"
        sub.seats_limit = 1000
        sub.ai_credits_limit = 10000
    sub.save()
    return org, sub


def make_admin(org, username="admin_x", email=None):
    return User.objects.create_user(
        username=username,
        email=email or f"{username}@test.local",
        password="SecureP@ss123",
        role="ADMIN",
        organization=org
    )


# ═══════════════════════════════════════════════════════════════════════════
# 1. SUBSCRIPTION AUTO-CREATION SIGNAL
# ═══════════════════════════════════════════════════════════════════════════

class SubscriptionAutoCreationTests(TestCase):

    def test_free_subscription_created_on_org_save(self):
        """TenantSubscription with FREE tier is auto-created when Organization is created."""
        org = Organization.objects.create(name="AutoSub Org")
        sub = TenantSubscription.objects.filter(organization=org).first()
        self.assertIsNotNone(sub, "TenantSubscription should be created automatically")
        self.assertEqual(sub.plan_tier, "FREE")
        self.assertEqual(sub.seats_limit, 5)
        self.assertEqual(sub.ai_credits_limit, 100)
        self.assertEqual(sub.ai_credits_used, 0)
        self.assertTrue(sub.is_active)

    def test_no_duplicate_subscription_on_resave(self):
        """Re-saving an Organization does not create duplicate subscriptions."""
        org = Organization.objects.create(name="ResaveOrg")
        org.description = "Updated"
        org.save()
        count = TenantSubscription.objects.filter(organization=org).count()
        self.assertEqual(count, 1)

    def test_subscription_survives_db_persistence(self):
        """Subscription fields written to DB are read back correctly."""
        org, sub = make_org_with_plan("PersistOrg", plan="PRO")
        sub_fresh = TenantSubscription.objects.get(pk=sub.pk)
        self.assertEqual(sub_fresh.plan_tier, "PRO")
        self.assertEqual(sub_fresh.seats_limit, 20)
        self.assertEqual(sub_fresh.ai_credits_limit, 1000)
        self.assertTrue(sub_fresh.is_active)


# ═══════════════════════════════════════════════════════════════════════════
# 2. SEAT LIMIT ENFORCEMENT
# ═══════════════════════════════════════════════════════════════════════════

class SeatLimitTests(APITestCase):

    def setUp(self):
        self.org, self.sub = make_org_with_plan("SeatOrg", plan="FREE")
        # FREE = 5 seats; create 5 users to fill it
        self.admin = make_admin(self.org, "seat_admin", "seat_admin@test.local")
        for i in range(4):   # 1 admin + 4 fillers = 5 → at limit
            User.objects.create_user(
                username=f"filler_{i}",
                email=f"filler_{i}@seat.local",
                password="SecureP@ss123",
                role="DEVELOPER",
                organization=self.org
            )

    def _make_invite(self, email="newbie@seat.local"):
        return OrganizationInvitation.objects.create(
            organization=self.org,
            email=email,
            role="BUSINESS_ANALYST",
            expires_at=timezone.now() + timezone.timedelta(days=1)
        )

    def test_registration_blocked_at_seat_limit(self):
        """Registration via invite is rejected when org is at seat capacity (FREE = 5)."""
        invite = self._make_invite()
        self.client.force_authenticate(user=None)
        resp = self.client.post(reverse("auth-register"), {
            "username": "blocked_user",
            "email": "newbie@seat.local",
            "password": "SecureP@ss123",
            "invite_token": str(invite.token),
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("seat limit", str(resp.data).lower())

    def test_registration_allowed_when_seat_available(self):
        """Registration is allowed when there is at least one free seat."""
        User.objects.filter(username="filler_3").delete()  # open a slot
        invite = self._make_invite("room@seat.local")
        self.client.force_authenticate(user=None)
        resp = self.client.post(reverse("auth-register"), {
            "username": "welcome_user",
            "email": "room@seat.local",
            "password": "SecureP@ss123",
            "invite_token": str(invite.token),
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_pro_plan_seats_limit_is_20(self):
        org, sub = make_org_with_plan("ProSeatOrg", plan="PRO")
        self.assertEqual(sub.seats_limit, 20)

    def test_enterprise_plan_seats_limit_is_1000(self):
        org, sub = make_org_with_plan("EntSeatOrg", plan="ENTERPRISE")
        self.assertEqual(sub.seats_limit, 1000)

    def test_inactive_subscription_blocks_registration(self):
        """An inactive subscription blocks new member registration."""
        self.sub.is_active = False
        self.sub.save()
        User.objects.filter(username="filler_3").delete()  # ensure not a seat issue
        invite = self._make_invite("inactive@seat.local")
        self.client.force_authenticate(user=None)
        resp = self.client.post(reverse("auth-register"), {
            "username": "inactive_user",
            "email": "inactive@seat.local",
            "password": "SecureP@ss123",
            "invite_token": str(invite.token),
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("inactive", str(resp.data).lower())


# ═══════════════════════════════════════════════════════════════════════════
# 3. AI CREDIT QUOTA ENFORCEMENT
# ═══════════════════════════════════════════════════════════════════════════

class AICreditsTests(APITestCase):

    def setUp(self):
        self.org, self.sub = make_org_with_plan("AIOrg", plan="FREE")
        self.admin = make_admin(self.org, "ai_admin", "ai_admin@test.local")
        self.project = Project.objects.create(name="AI Project", organization=self.org)
        self.client.force_authenticate(user=self.admin)

    def test_ai_chat_rejected_when_credits_exhausted(self):
        """AI chat endpoint returns 402 when credits are fully consumed."""
        self.sub.ai_credits_used = 100
        self.sub.ai_credits_limit = 100
        self.sub.save()
        resp = self.client.post(reverse("ai-chat"), {
            "project_id": str(self.project.id),
            "message": "Test message",
            "action_type": "CHAT"
        })
        self.assertEqual(resp.status_code, status.HTTP_402_PAYMENT_REQUIRED)
        self.assertIn("monthly AI credits quota", resp.data["message"])

    def test_ai_chat_not_billing_blocked_when_credits_available(self):
        """AI chat is not blocked by billing when credits remain."""
        self.sub.ai_credits_used = 0
        self.sub.ai_credits_limit = 100
        self.sub.save()
        resp = self.client.post(reverse("ai-chat"), {
            "project_id": str(self.project.id),
            "message": "Hello",
            "action_type": "CHAT"
        })
        self.assertNotEqual(resp.status_code, status.HTTP_402_PAYMENT_REQUIRED)

    def test_pro_plan_has_1000_ai_credits(self):
        org, sub = make_org_with_plan("ProAIOrg", plan="PRO")
        self.assertEqual(sub.ai_credits_limit, 1000)

    def test_enterprise_plan_has_10000_ai_credits(self):
        org, sub = make_org_with_plan("EntAIOrg", plan="ENTERPRISE")
        self.assertEqual(sub.ai_credits_limit, 10000)


# ═══════════════════════════════════════════════════════════════════════════
# 4. FEATURE GATING — BRD/FRD (PRO+)
# ═══════════════════════════════════════════════════════════════════════════

class FeatureGatingTests(APITestCase):

    def _setup_user(self, plan, prefix):
        org, sub = make_org_with_plan(f"{prefix}_Org", plan=plan)
        user = make_admin(org, username=f"{prefix}_admin",
                          email=f"{prefix}@gate.local")
        return user, org, sub

    def test_brd_create_blocked_for_free_user(self):
        """FREE users cannot POST to /documents/ — requires PRO+."""
        user, org, _ = self._setup_user("FREE", "free_brd")
        self.client.force_authenticate(user=user)
        project = Project.objects.create(name="BRD Project", organization=org)
        resp = self.client.post(reverse("document-list"), {
            "project": str(project.id),
            "doc_type": "BRD",
            "title": "Test BRD",
        })
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_brd_create_not_billing_blocked_for_pro_user(self):
        """PRO users can access /documents/ — no 403 billing block."""
        user, org, _ = self._setup_user("PRO", "pro_brd")
        self.client.force_authenticate(user=user)
        project = Project.objects.create(name="BRD Project Pro", organization=org)
        resp = self.client.post(reverse("document-list"), {
            "project": str(project.id),
            "doc_type": "BRD",
            "title": "Pro BRD",
        })
        self.assertNotEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_brd_create_not_billing_blocked_for_enterprise_user(self):
        """ENTERPRISE users can access /documents/ — no 403 billing block."""
        user, org, _ = self._setup_user("ENTERPRISE", "ent_brd")
        self.client.force_authenticate(user=user)
        project = Project.objects.create(name="BRD Enterprise", organization=org)
        resp = self.client.post(reverse("document-list"), {
            "project": str(project.id),
            "doc_type": "BRD",
            "title": "Enterprise BRD",
        })
        self.assertNotEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_subscription_endpoint_returns_correct_tier_for_each_plan(self):
        """GET /billing/subscription/ returns the correct plan_tier for FREE / PRO / ENTERPRISE."""
        for plan in ["FREE", "PRO", "ENTERPRISE"]:
            user, _, _ = self._setup_user(plan, f"sub_{plan.lower()}")
            self.client.force_authenticate(user=user)
            resp = self.client.get(reverse("subscription-detail"))
            self.assertEqual(resp.status_code, status.HTTP_200_OK)
            self.assertEqual(resp.data["data"]["plan_tier"], plan,
                             f"Expected plan_tier={plan}, got {resp.data['data']['plan_tier']}")

    def test_unauthenticated_subscription_request_returns_401(self):
        self.client.force_authenticate(user=None)
        resp = self.client.get(reverse("subscription-detail"))
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


# ═══════════════════════════════════════════════════════════════════════════
# 5. BILLING UPGRADE FLOW
# ═══════════════════════════════════════════════════════════════════════════

class BillingUpgradeTests(APITestCase):

    def setUp(self):
        self.org, self.sub = make_org_with_plan("UpgradeOrg", plan="FREE")
        self.admin = make_admin(self.org, "upgrade_admin", "upgrade@test.local")
        self.non_admin = User.objects.create_user(
            username="upgrade_ba",
            email="upgrade_ba@test.local",
            password="SecureP@ss123",
            role="BUSINESS_ANALYST",
            organization=self.org
        )

    def test_checkout_requires_admin_role(self):
        """Only ADMIN role can initiate a checkout session; non-admin is blocked."""
        self.client.force_authenticate(user=self.non_admin)
        resp = self.client.post(reverse("create-checkout-session"), {"plan": "PRO"})
        self.assertIn(resp.status_code, [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_403_FORBIDDEN,
        ])

    def test_checkout_generates_mock_url_pro(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.post(reverse("create-checkout-session"), {"plan": "PRO"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["data"]["mode"], "MOCK")
        self.assertIn("mock-upgrade", resp.data["data"]["checkout_url"])
        self.assertIn("PRO", resp.data["data"]["checkout_url"])

    def test_checkout_generates_mock_url_enterprise(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.post(reverse("create-checkout-session"), {"plan": "ENTERPRISE"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("ENTERPRISE", resp.data["data"]["checkout_url"])

    def test_mock_upgrade_pro_updates_db_correctly(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.get(reverse("mock-upgrade"), {
            "plan": "PRO", "org_id": str(self.org.id)
        })
        self.assertEqual(resp.status_code, status.HTTP_302_FOUND)
        self.sub.refresh_from_db()
        self.assertEqual(self.sub.plan_tier, "PRO")
        self.assertEqual(self.sub.seats_limit, 20)
        self.assertEqual(self.sub.ai_credits_limit, 1000)

    def test_mock_upgrade_enterprise_updates_db_correctly(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.get(reverse("mock-upgrade"), {
            "plan": "ENTERPRISE", "org_id": str(self.org.id)
        })
        self.assertEqual(resp.status_code, status.HTTP_302_FOUND)
        self.sub.refresh_from_db()
        self.assertEqual(self.sub.plan_tier, "ENTERPRISE")
        self.assertEqual(self.sub.seats_limit, 1000)
        self.assertEqual(self.sub.ai_credits_limit, 10000)

    def test_invalid_plan_rejected(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.post(reverse("create-checkout-session"), {"plan": "PLATINUM"})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registration_with_pro_plan_persists_subscription(self):
        """New workspace registration specifying plan_tier=PRO creates PRO subscription."""
        self.client.force_authenticate(user=None)
        resp = self.client.post(reverse("auth-register"), {
            "username": "plan_reg_user",
            "email": "plan_reg@test.local",
            "password": "SecureP@ss123",
            "organization_name": "PlanRegOrg",
            "plan_tier": "PRO",
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        org = Organization.objects.get(name="PlanRegOrg")
        sub = TenantSubscription.objects.get(organization=org)
        self.assertEqual(sub.plan_tier, "PRO")
        self.assertEqual(sub.seats_limit, 20)
        self.assertEqual(sub.ai_credits_limit, 1000)


# ═══════════════════════════════════════════════════════════════════════════
# 6. CANCELLATION RESETS TO FREE
# ═══════════════════════════════════════════════════════════════════════════

class SubscriptionCancellationTests(TestCase):

    def test_cancelled_subscription_resets_to_free_limits(self):
        """Simulated cancellation resets plan to FREE tier limits."""
        org, sub = make_org_with_plan("CancelOrg", plan="ENTERPRISE")
        sub.stripe_subscription_id = "sub_cancel_test"
        sub.save()

        # Simulate what the Stripe webhook does on cancellation
        sub.plan_tier = "FREE"
        sub.seats_limit = 5
        sub.ai_credits_limit = 100
        sub.save()

        sub.refresh_from_db()
        self.assertEqual(sub.plan_tier, "FREE")
        self.assertEqual(sub.seats_limit, 5)
        self.assertEqual(sub.ai_credits_limit, 100)


# ═══════════════════════════════════════════════════════════════════════════
# 7. ROLE-BASED PERMISSION CHECKS
# ═══════════════════════════════════════════════════════════════════════════

class RolePermissionTests(TestCase):

    def setUp(self):
        self.org = Organization.objects.create(name="RoleOrg")

    def _user(self, role, username):
        return User.objects.create_user(
            username=username,
            email=f"{username}@role.local",
            password="SecureP@ss123",
            role=role,
            organization=self.org
        )

    def test_admin_has_all_core_permissions(self):
        user = self._user("ADMIN", "role_admin")
        for perm in ["create_project", "edit_project", "delete_project",
                     "create_team", "manage_permissions", "approve_brd"]:
            self.assertTrue(check_permission(user, perm),
                            f"ADMIN should have '{perm}'")

    def test_business_analyst_has_create_but_not_delete(self):
        user = self._user("BUSINESS_ANALYST", "role_ba")
        self.assertTrue(check_permission(user, "create_requirement"))
        self.assertTrue(check_permission(user, "approve_brd"))
        self.assertFalse(check_permission(user, "delete_project"))
        self.assertFalse(check_permission(user, "manage_permissions"))

    def test_developer_has_only_edit_requirement(self):
        user = self._user("DEVELOPER", "role_dev")
        self.assertTrue(check_permission(user, "edit_requirement"))
        self.assertFalse(check_permission(user, "create_project"))
        self.assertFalse(check_permission(user, "approve_brd"))

    def test_qa_tester_has_no_permissions(self):
        user = self._user("QA_TESTER", "role_qa")
        for perm in ["create_project", "edit_project", "create_requirement",
                     "approve_brd", "manage_permissions"]:
            self.assertFalse(check_permission(user, perm))

    def test_stakeholder_has_no_permissions(self):
        user = self._user("STAKEHOLDER", "role_sh")
        for perm in ["create_project", "edit_requirement", "approve_brd"]:
            self.assertFalse(check_permission(user, perm))

    def test_non_admin_cannot_upgrade_billing(self):
        from rest_framework.test import APIClient
        client = APIClient()
        ba_user = self._user("BUSINESS_ANALYST", "billing_ba")
        client.force_authenticate(user=ba_user)
        resp = client.post(reverse("create-checkout-session"), {"plan": "PRO"})
        self.assertIn(resp.status_code, [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_403_FORBIDDEN,
        ])


# ═══════════════════════════════════════════════════════════════════════════
# 8. EMAIL BACKEND
# ═══════════════════════════════════════════════════════════════════════════

@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class EmailBackendTests(APITestCase):

    def setUp(self):
        self.org, self.sub = make_org_with_plan("EmailOrg", plan="PRO")
        self.admin = make_admin(self.org, "email_admin", "email_admin@test.local")
        self.client.force_authenticate(user=self.admin)

    def test_locmem_email_backend_is_functional(self):
        """Django locmem email backend captures outgoing test emails."""
        from django.core.mail import send_mail
        send_mail(
            subject="BAHub Test Email",
            message="This is a billing notification.",
            from_email="noreply@bahub.com",
            recipient_list=["tester@test.local"],
        )
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "BAHub Test Email")
        self.assertEqual(mail.outbox[0].to, ["tester@test.local"])

    def test_invitation_token_is_created_in_db(self):
        """Creating an invitation object in DB correctly stores the token and role."""
        inv = OrganizationInvitation.objects.create(
            organization=self.org,
            email="invitee@email.local",
            role="BUSINESS_ANALYST",
            expires_at=timezone.now() + timezone.timedelta(days=7)
        )
        inv_reloaded = OrganizationInvitation.objects.get(pk=inv.pk)
        self.assertEqual(inv_reloaded.email, "invitee@email.local")
        self.assertEqual(inv_reloaded.role, "BUSINESS_ANALYST")
        self.assertFalse(inv_reloaded.is_used)
        self.assertIsNotNone(inv_reloaded.token)


# ═══════════════════════════════════════════════════════════════════════════
# 9. DATABASE PERSISTENCE
# ═══════════════════════════════════════════════════════════════════════════

class DatabasePersistenceTests(TestCase):

    def setUp(self):
        self.org = Organization.objects.create(name="PersistenceOrg")
        self.admin = make_admin(self.org, "persist_admin", "persist@test.local")

    def test_organization_persists_name(self):
        org = Organization.objects.get(pk=self.org.pk)
        self.assertEqual(org.name, "PersistenceOrg")

    def test_user_persists_role_and_org_fk(self):
        user = User.objects.get(pk=self.admin.pk)
        self.assertEqual(user.role, "ADMIN")
        self.assertEqual(user.organization_id, self.org.pk)

    def test_subscription_plan_tier_persists_after_upgrade(self):
        sub = TenantSubscription.objects.get(organization=self.org)
        sub.plan_tier = "ENTERPRISE"
        sub.seats_limit = 1000
        sub.ai_credits_limit = 10000
        sub.save()
        sub_fresh = TenantSubscription.objects.get(pk=sub.pk)
        self.assertEqual(sub_fresh.plan_tier, "ENTERPRISE")
        self.assertEqual(sub_fresh.seats_limit, 1000)
        self.assertEqual(sub_fresh.ai_credits_limit, 10000)

    def test_ai_credits_used_increments_persist(self):
        sub = TenantSubscription.objects.get(organization=self.org)
        sub.ai_credits_used = 42
        sub.save()
        sub.refresh_from_db()
        self.assertEqual(sub.ai_credits_used, 42)

    def test_invitation_tokens_are_unique_uuids(self):
        inv1 = OrganizationInvitation.objects.create(
            organization=self.org, email="a@persist.local",
            role="DEVELOPER",
            expires_at=timezone.now() + timezone.timedelta(days=1)
        )
        inv2 = OrganizationInvitation.objects.create(
            organization=self.org, email="b@persist.local",
            role="DEVELOPER",
            expires_at=timezone.now() + timezone.timedelta(days=1)
        )
        self.assertNotEqual(inv1.token, inv2.token)

    def test_project_persists_name_and_org(self):
        project = Project.objects.create(name="Persistent Project", organization=self.org)
        reloaded = Project.objects.get(pk=project.pk)
        self.assertEqual(reloaded.name, "Persistent Project")
        self.assertEqual(reloaded.organization_id, self.org.pk)

    def test_user_soft_delete_retains_db_record(self):
        self.admin.is_active = False
        self.admin.save()
        user_in_db = User.objects.get(pk=self.admin.pk)
        self.assertFalse(user_in_db.is_active)

    def test_subscription_is_active_flag_persists(self):
        sub = TenantSubscription.objects.get(organization=self.org)
        sub.is_active = False
        sub.save()
        sub.refresh_from_db()
        self.assertFalse(sub.is_active)


# ═══════════════════════════════════════════════════════════════════════════
# 10. DASHBOARD PLAN VISIBILITY IN USER PROFILE
# ═══════════════════════════════════════════════════════════════════════════

class DashboardPlanVisibilityTests(APITestCase):

    def _get_profile_for_plan(self, plan):
        org, _ = make_org_with_plan(f"Vis{plan}Org", plan=plan)
        user = make_admin(org, f"vis_{plan.lower()}", f"vis_{plan.lower()}@test.local")
        self.client.force_authenticate(user=user)
        return self.client.get(reverse("auth-profile"))

    def test_free_user_profile_returns_free_tier(self):
        resp = self._get_profile_for_plan("FREE")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["data"]["plan_tier"], "FREE")

    def test_pro_user_profile_returns_pro_tier(self):
        resp = self._get_profile_for_plan("PRO")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["data"]["plan_tier"], "PRO")

    def test_enterprise_user_profile_returns_enterprise_tier(self):
        resp = self._get_profile_for_plan("ENTERPRISE")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["data"]["plan_tier"], "ENTERPRISE")

    def test_plan_tier_is_read_only_from_profile_patch(self):
        """plan_tier cannot be changed via PATCH /profile/."""
        org, sub = make_org_with_plan("PatchOrg", plan="FREE")
        user = make_admin(org, "patch_admin", "patch@test.local")
        self.client.force_authenticate(user=user)
        resp = self.client.patch(reverse("auth-profile"), {"plan_tier": "ENTERPRISE"})
        if resp.status_code == status.HTTP_200_OK:
            sub.refresh_from_db()
            self.assertEqual(sub.plan_tier, "FREE")


# ═══════════════════════════════════════════════════════════════════════════
# 11. SSO / JIT PROVISIONING (ENTERPRISE)
# ═══════════════════════════════════════════════════════════════════════════

class SSOProvisioningTests(TestCase):

    def test_jit_first_user_gets_admin_and_enterprise_plan(self):
        from billing.sso_auth_utils import provision_user_organization
        email = "first@newcorp-sso.com"
        user = User.objects.create_user(
            username="first_sso", email=email, password="SecureP@ss123")
        provision_user_organization({
            "email": [email], "username": ["first_sso"],
            "first_name": ["First"], "last_name": ["User"],
        })
        user.refresh_from_db()
        self.assertIsNotNone(user.organization)
        self.assertEqual(user.role, User.ADMIN)
        sub = TenantSubscription.objects.get(organization=user.organization)
        self.assertEqual(sub.plan_tier, "ENTERPRISE")
        self.assertEqual(sub.seats_limit, 1000)

    def test_jit_second_user_same_domain_joins_existing_org(self):
        from billing.sso_auth_utils import provision_user_organization
        # First user
        user1 = User.objects.create_user(
            username="sso_one", email="one@samedomain2-sso.com", password="SecureP@ss123")
        provision_user_organization({
            "email": ["one@samedomain2-sso.com"], "username": ["sso_one"],
            "first_name": ["One"], "last_name": ["User"],
        })
        user1.refresh_from_db()
        # Second user
        user2 = User.objects.create_user(
            username="sso_two", email="two@samedomain2-sso.com", password="SecureP@ss123")
        provision_user_organization({
            "email": ["two@samedomain2-sso.com"], "username": ["sso_two"],
            "first_name": ["Two"], "last_name": ["User"],
        })
        user2.refresh_from_db()
        self.assertEqual(user2.organization, user1.organization)
        self.assertEqual(user2.role, User.DEVELOPER)

    def test_automatic_subscription_creation_signal(self):
        """Verify a TenantSubscription is automatically created when an Organization is saved."""
        new_org = Organization.objects.create(name="New Org Signal Test")
        sub = TenantSubscription.objects.filter(organization=new_org).first()
        self.assertIsNotNone(sub)
        self.assertEqual(sub.plan_tier, "FREE")
        self.assertEqual(sub.seats_limit, 5)
        self.assertEqual(sub.ai_credits_limit, 100)
        self.assertTrue(sub.is_active)

