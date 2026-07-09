from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from core.responses import api_success, api_error
from django.contrib.auth import get_user_model
from organizations.models import Organization
from billing.models import TenantSubscription
from django.db import transaction

User = get_user_model()

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
        # 1. Fetch all organizations
        orgs = Organization.objects.all().order_by('name')
        org_list = []
        for org in orgs:
            # Get subscription details
            try:
                sub = TenantSubscription.objects.get(organization=org)
                plan_tier = sub.plan_tier
                plan_verified = sub.plan_verified
                is_active = sub.is_active
            except TenantSubscription.DoesNotExist:
                plan_tier = "FREE"
                plan_verified = True
                is_active = True
            
            member_count = User.objects.filter(organization=org).count()
            
            org_list.append({
                "id": str(org.id),
                "name": org.name,
                "description": org.description,
                "plan_tier": plan_tier,
                "plan_verified": plan_verified,
                "is_active": is_active,
                "member_count": member_count,
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

        return api_success(
            data={
                "organizations": org_list,
                "users": user_list
            },
            message="Superadmin platform metrics loaded successfully."
        )

    @transaction.atomic
    def post(self, request):
        action = request.data.get("action")
        
        if action == "update_organization":
            org_id = request.data.get("organization_id")
            plan_tier = request.data.get("plan_tier")
            plan_verified = request.data.get("plan_verified")
            is_active = request.data.get("is_active")

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
                        sub.ai_credits_limit = 100
                    elif plan_tier == "PRO":
                        sub.seats_limit = 20
                        sub.ai_credits_limit = 1000
                    elif plan_tier == "ENTERPRISE":
                        sub.seats_limit = 1000
                        sub.ai_credits_limit = 10000

                if plan_verified is not None:
                    sub.plan_verified = bool(plan_verified)
                if is_active is not None:
                    sub.is_active = bool(is_active)
                
                sub.save()
                return api_success(message=f"Organization '{org.name}' subscription updated successfully.")
            except Organization.DoesNotExist:
                return api_error(message="Organization not found.", status_code=status.HTTP_404_NOT_FOUND)

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
                    # Validate role choice
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
                org.delete()  # Cascade deletions occur here
                return api_success(message=f"Organization '{org_name}' and all associated workspace data deleted successfully.")
            except Organization.DoesNotExist:
                return api_error(message="Organization not found.", status_code=status.HTTP_444_NOT_FOUND)

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
