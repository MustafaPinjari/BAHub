import json
import os
import time
import uuid
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from core.responses import api_success, api_error
from django.contrib.auth import get_user_model
from django.db import connection, transaction
from django.conf import settings
from organizations.models import Organization
from billing.models import TenantSubscription, Payment, ProcessedWebhookEvent
from audit.models import AuditLog
from projects.models import Project
from requirements.models import Requirement
from stories.models import UserStory
from documents.models import BusinessDocument

User = get_user_model()
SETTINGS_FILE = os.path.join(os.path.dirname(__file__), "system_settings.json")

def get_system_settings():
    default_settings = {
        "maintenance_mode": "false",
        "global_ai_disabled": "false",
        "free_tier_seats": "5",
        "free_tier_credits": "100",
        "waitlist_countdown_enabled": "false"
    }
    if not os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "w") as f:
                json.dump(default_settings, f, indent=4)
        except Exception:
            pass
        return default_settings
    try:
        with open(SETTINGS_FILE, "r") as f:
            return {**default_settings, **json.load(f)}
    except Exception:
        return default_settings

def save_system_settings(settings_dict):
    try:
        with open(SETTINGS_FILE, "w") as f:
            json.dump(settings_dict, f, indent=4)
        return True
    except Exception:
        return False


class SuperAdminDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def check_permissions(self, request):
        super().check_permissions(request)
        if not (request.user.is_superuser or request.user.is_staff):
            self.permission_denied(
                request, 
                message="Only platform superadmins and staff members can access the administration dashboard."
            )

    def get(self, request):
        # 1. Fetch all organizations with their resource utilisation counts & AI limits
        orgs = Organization.objects.all().order_by('name')
        org_list = []
        for org in orgs:
            try:
                sub = TenantSubscription.objects.get(organization=org)
                plan_tier = sub.plan_tier
                plan_verified = sub.plan_verified
                is_active = sub.is_active
                ai_credits_used = sub.ai_credits_used
                ai_credits_limit = sub.ai_credits_limit
            except TenantSubscription.DoesNotExist:
                plan_tier = "FREE"
                plan_verified = True
                is_active = True
                ai_credits_used = 0
                ai_credits_limit = 100
            
            member_count = User.objects.filter(organization=org).count()
            
            # Resource metrics
            projects_count = Project.objects.filter(organization=org).count()
            requirements_count = Requirement.objects.filter(project__organization=org).count()
            stories_count = UserStory.objects.filter(requirement__project__organization=org).count()
            documents_count = BusinessDocument.objects.filter(project__organization=org).count()
            
            org_list.append({
                "id": str(org.id),
                "name": org.name,
                "description": org.description,
                "plan_tier": plan_tier,
                "plan_verified": plan_verified,
                "is_active": is_active,
                "member_count": member_count,
                "ai_credits_used": ai_credits_used,
                "ai_credits_limit": ai_credits_limit,
                "projects_count": projects_count,
                "requirements_count": requirements_count,
                "stories_count": stories_count,
                "documents_count": documents_count,
                "created_at": org.created_at.strftime("%Y-%m-%d") if org.created_at else None
            })

        # 2. Fetch all users
        users = User.objects.all().order_by('-created_at')
        user_list = []
        for u in users:
            user_list.append({
                "id": str(u.id),
                "username": u.username,
                "email": u.email,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "role": u.role,
                "is_active": u.is_active,
                "is_staff": u.is_staff,
                "is_superuser": u.is_superuser,
                "organization_name": u.organization.name if u.organization else "No Organization",
                "organization_id": str(u.organization.id) if u.organization else None,
                "created_at": u.created_at.strftime("%Y-%m-%d") if u.created_at else None
            })

        # 3. Fetch audit logs (last 100 actions)
        audit_logs = []
        for log in AuditLog.objects.all().order_by('-created_at')[:100]:
            audit_logs.append({
                "id": str(log.id),
                "user_username": log.user_username or "system",
                "action": log.action,
                "resource_type": log.resource_type,
                "resource_name": log.resource_name or "N/A",
                "ip_address": log.ip_address or "N/A",
                "created_at": log.created_at.strftime("%Y-%m-%d %H:%M:%S") if log.created_at else None
            })

        # 4. Fetch payment transactions (last 100 actions)
        payments = []
        for p in Payment.objects.all().order_by('-created_at')[:100]:
            payments.append({
                "id": str(p.id),
                "receipt_number": p.receipt_number,
                "organization_name": p.organization.name if p.organization else "N/A",
                "plan": p.plan,
                "amount": float(p.amount),
                "payment_status": p.payment_status,
                "billing_cycle": p.billing_cycle,
                "created_at": p.created_at.strftime("%Y-%m-%d %H:%M:%S") if p.created_at else None
            })

        # 5. Fetch webhook events
        webhooks = []
        for ev in ProcessedWebhookEvent.objects.all().order_by('-processed_at')[:100]:
            webhooks.append({
                "id": str(ev.id),
                "stripe_event_id": ev.stripe_event_id,
                "processed_at": ev.processed_at.strftime("%Y-%m-%d %H:%M:%S") if ev.processed_at else None
            })

        # 6. Read system settings
        system_settings = get_system_settings()

        # 7. Execute real-time database latency query check
        try:
            start_time = time.time()
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            db_latency = int((time.time() - start_time) * 1000)
            db_status = "HEALTHY"
        except Exception:
            db_latency = 0
            db_status = "DEGRADED"

        # Mock third-party checks
        has_stripe_config = bool(getattr(settings, "STRIPE_SECRET_KEY", None))
        has_jira_config = bool(getattr(settings, "JIRA_SERVER_URL", None))

        system_health = {
            "database_status": db_status,
            "database_latency_ms": db_latency,
            "stripe_api_configured": has_stripe_config,
            "jira_api_configured": has_jira_config,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }

        return api_success(
            data={
                "organizations": org_list,
                "users": user_list,
                "audit_logs": audit_logs,
                "payments": payments,
                "webhook_events": webhooks,
                "system_settings": system_settings,
                "system_health": system_health
            },
            message="Superadmin expanded dashboard configuration payload loaded successfully."
        )

    @transaction.atomic
    def post(self, request):
        action = request.data.get("action")
        if action == "bulk_update_organizations":
            org_ids = request.data.get("organization_ids", [])
            plan_tier = request.data.get("plan_tier")
            plan_verified = request.data.get("plan_verified")
            is_active = request.data.get("is_active")
            delete_mode = request.data.get("delete", False)

            if not org_ids:
                return api_error(message="No organization IDs specified.", status_code=status.HTTP_400_BAD_REQUEST)

            orgs = Organization.objects.filter(id__in=org_ids)
            if delete_mode:
                count = orgs.count()
                # Hard-delete all users in these orgs first (SET_NULL means they'd survive otherwise)
                User.objects.filter(organization__in=orgs).delete()
                orgs.delete()
                return api_success(message=f"Successfully bulk deleted {count} organizations and all their users.")

            updated_count = 0
            for org in orgs:
                sub, _ = TenantSubscription.objects.get_or_create(
                    organization=org,
                    defaults={
                        "plan_tier": "FREE",
                        "seats_limit": 5,
                        "is_active": True,
                        "plan_verified": True,
                        "ai_credits_limit": 100
                    }
                )
                if plan_tier is not None:
                    sub.plan_tier = plan_tier
                    if plan_tier == "FREE": sub.seats_limit = 5
                    elif plan_tier == "PRO": sub.seats_limit = 20
                    elif plan_tier == "ENTERPRISE": sub.seats_limit = 1000
                if plan_verified is not None:
                    sub.plan_verified = bool(plan_verified)
                if is_active is not None:
                    sub.is_active = bool(is_active)
                sub.save()
                updated_count += 1
            return api_success(message=f"Successfully bulk updated {updated_count} organizations.")

        elif action == "bulk_update_users":
            user_ids = request.data.get("user_ids", [])
            role = request.data.get("role")
            is_active = request.data.get("is_active")
            is_staff = request.data.get("is_staff")
            delete_mode = request.data.get("delete", False)

            if not user_ids:
                return api_error(message="No user IDs specified.", status_code=status.HTTP_400_BAD_REQUEST)

            filtered_ids = [uid for uid in user_ids if str(uid) != str(request.user.id)]
            users = User.objects.filter(id__in=filtered_ids)

            if delete_mode:
                count = users.count()
                users.delete()
                return api_success(message=f"Successfully bulk deleted {count} users.")

            updated_count = 0
            for u in users:
                if role is not None:
                    u.role = role
                if is_active is not None:
                    u.is_active = bool(is_active)
                if is_staff is not None:
                    u.is_staff = bool(is_staff)
                u.save()
                updated_count += 1
            return api_success(message=f"Successfully bulk updated {updated_count} users.")

        elif action == "update_organization":
            org_id = request.data.get("organization_id")
            plan_tier = request.data.get("plan_tier")
            plan_verified = request.data.get("plan_verified")
            is_active = request.data.get("is_active")
            ai_credits_used = request.data.get("ai_credits_used")
            ai_credits_limit = request.data.get("ai_credits_limit")

            if not org_id:
                return api_error(message="Organization ID is required.", status_code=status.HTTP_400_BAD_REQUEST)

            try:
                org = Organization.objects.get(id=org_id)
                sub, _ = TenantSubscription.objects.get_or_create(
                    organization=org,
                    defaults={
                        "plan_tier": "FREE",
                        "seats_limit": 5,
                        "is_active": True,
                        "plan_verified": True,
                        "ai_credits_limit": 100
                    }
                )
                
                if plan_tier is not None:
                    if plan_tier not in ["FREE", "PRO", "ENTERPRISE"]:
                        return api_error(message="Invalid plan tier.", status_code=status.HTTP_400_BAD_REQUEST)
                    sub.plan_tier = plan_tier
                    # Update limits based on tier
                    if plan_tier == "FREE":
                        sub.seats_limit = 5
                    elif plan_tier == "PRO":
                        sub.seats_limit = 20
                    elif plan_tier == "ENTERPRISE":
                        sub.seats_limit = 1000

                if plan_verified is not None:
                    sub.plan_verified = bool(plan_verified)
                if is_active is not None:
                    sub.is_active = bool(is_active)
                if ai_credits_used is not None:
                    sub.ai_credits_used = int(ai_credits_used)
                if ai_credits_limit is not None:
                    sub.ai_credits_limit = int(ai_credits_limit)
                
                sub.save()
                return api_success(message=f"Organization '{org.name}' subscription updated successfully.")
            except Organization.DoesNotExist:
                return api_error(message="Organization not found.", status_code=status.HTTP_404_NOT_FOUND)

        elif action == "update_settings":
            settings_payload = request.data.get("settings", {})
            current_settings = get_system_settings()
            
            for key, val in settings_payload.items():
                # Allow updating registered settings
                if key in current_settings:
                    current_settings[key] = str(val)
            
            if save_system_settings(current_settings):
                return api_success(message="Global platform configuration values saved successfully.")
            return api_error(message="Failed to write system settings file.")

        elif action == "update_user":
            user_id = request.data.get("user_id")
            role = request.data.get("role")
            is_active = request.data.get("is_active")
            is_staff = request.data.get("is_staff")

            if not user_id:
                return api_error(message="User ID is required.", status_code=status.HTTP_400_BAD_REQUEST)

            try:
                user = User.objects.get(id=user_id)
                
                # Prevent self-deactivation or self-role changes to avoid lockouts
                if str(user.id) == str(request.user.id) and (is_active is False or is_staff is False):
                    return api_error(message="You cannot deactivate or demote your own account.", status_code=status.HTTP_400_BAD_REQUEST)

                if role is not None:
                    roles = [r[0] for r in User.ROLE_CHOICES]
                    if role not in roles:
                        return api_error(message="Invalid role specified.", status_code=status.HTTP_400_BAD_REQUEST)
                    user.role = role

                if is_active is not None:
                    user.is_active = bool(is_active)
                if is_staff is not None:
                    user.is_staff = bool(is_staff)

                user.save()
                return api_success(message=f"User '{user.username}' settings updated successfully.")
            except User.DoesNotExist:
                return api_error(message="User not found.", status_code=status.HTTP_404_NOT_FOUND)

        elif action == "delete_organization":
            org_id = request.data.get("organization_id")
            if not org_id:
                return api_error(message="Organization ID is required.", status_code=status.HTTP_400_BAD_REQUEST)
            try:
                org = Organization.objects.get(id=org_id)
                org_name = org.name
                # Hard-delete all users belonging to this organization first,
                # so they are permanently removed from the database.
                # (User.organization uses SET_NULL, so we must delete users explicitly.)
                User.objects.filter(organization=org).delete()
                # Now delete the organization — cascades to subscription, payments, invitations, etc.
                org.delete()
                return api_success(message=f"Organization '{org_name}' and all associated users and workspace data deleted successfully.")
            except Organization.DoesNotExist:
                return api_error(message="Organization not found.", status_code=status.HTTP_404_NOT_FOUND)

        elif action == "delete_user":
            user_id = request.data.get("user_id")
            if not user_id:
                return api_error(message="User ID is required.", status_code=status.HTTP_400_BAD_REQUEST)
            try:
                user = User.objects.get(id=user_id)
                if str(user.id) == str(request.user.id):
                    return api_error(message="You cannot delete your own account.", status_code=status.HTTP_400_BAD_REQUEST)
                user_name = user.username
                user.delete()
                return api_success(message=f"User '{user_name}' deleted successfully.")
            except User.DoesNotExist:
                return api_error(message="User not found.", status_code=status.HTTP_404_NOT_FOUND)

        return api_error(message="Invalid action specified.", status_code=status.HTTP_400_BAD_REQUEST)
