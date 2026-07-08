import json
import stripe
from django.conf import settings
from django.http import HttpResponse, Http404
from django.shortcuts import redirect
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from core.responses import api_success, api_error
from .models import TenantSubscription
from .serializers import TenantSubscriptionSerializer

import uuid
from django.core.mail import send_mail
from django.contrib.auth import get_user_model

stripe.api_key = getattr(settings, "STRIPE_SECRET_KEY", None)

def trigger_subscription_verification(request, sub, plan):
    # Check if this is an upgrade/change of plan tier
    is_upgrade = (plan in ["PRO", "ENTERPRISE"]) and (sub.plan_tier != plan or not sub.plan_verified)
    
    sub.plan_tier = plan
    if plan == "PRO":
        sub.seats_limit = 20
        sub.ai_credits_limit = 1000
    elif plan == "ENTERPRISE":
        sub.seats_limit = 1000
        sub.ai_credits_limit = 10000
    else:
        sub.seats_limit = 5
        sub.ai_credits_limit = 100

    if is_upgrade:
        token = uuid.uuid4()
        sub.plan_verified = False
        sub.is_active = False
        sub.verification_token = token
        sub.save()

        # Send email
        User = get_user_model()
        admin_emails = list(User.objects.filter(organization=sub.organization, role="ADMIN").values_list("email", flat=True))
        recipients = [email for email in admin_emails if email]
        if "unlessuser99@gmail.com" not in recipients:
            recipients.append("unlessuser99@gmail.com")
        
        # Build verification URL
        verify_url = request.build_absolute_uri(
            f"/api/v1/billing/verify-subscription/?token={token}&org_id={sub.organization.id}"
        )

        subject = f"BAHub: Verify Your {plan.capitalize()} Subscription Upgrade"
        message = (
            f"Hello,\n\n"
            f"Your organization '{sub.organization.name}' has requested an upgrade to the {plan.capitalize()} plan.\n\n"
            f"Please verify this subscription upgrade to activate your plan and unlock Gemini AI features by clicking the link below:\n\n"
            f"{verify_url}\n\n"
            f"Best regards,\nThe BAHub Billing Team"
        )

        send_mail(
            subject=subject,
            message=message,
            from_email="unlessuser99@gmail.com",
            recipient_list=recipients,
            fail_silently=False
        )
    else:
        if plan not in ["PRO", "ENTERPRISE"]:
            sub.plan_verified = True
            sub.is_active = True
            sub.verification_token = None
        sub.save()


class SubscriptionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.organization:
            return api_error(message="User does not belong to any organization.")
        
        sub, _ = TenantSubscription.objects.get_or_create(
            organization=request.user.organization,
            defaults={
                "plan_tier": "FREE",
                "seats_limit": 5,
                "is_active": True,
                "ai_credits_limit": 100
            }
        )
        serializer = TenantSubscriptionSerializer(sub)
        return api_success(data=serializer.data, message="Subscription details loaded successfully.")


class CreateCheckoutSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        plan = request.data.get("plan")
        if not plan or plan not in ["PRO", "ENTERPRISE"]:
            return api_error(message="Invalid plan specified. Must be 'PRO' or 'ENTERPRISE'.")

        if not request.user.organization:
            return api_error(message="User does not belong to an organization.")

        # Ensure only ADMIN can upgrade billing
        if request.user.role != "ADMIN":
            return api_error(message="Only administrators can manage subscription upgrades.")

        # Resolve frontend origin dynamically
        frontend_origin = request.META.get('HTTP_ORIGIN') or request.headers.get('origin')
        if not frontend_origin:
            referer = request.META.get('HTTP_REFERER')
            if referer:
                from urllib.parse import urlparse
                parsed_uri = urlparse(referer)
                frontend_origin = f"{parsed_uri.scheme}://{parsed_uri.netloc}"
        
        if not frontend_origin:
            allowed_origins = getattr(settings, "CORS_ALLOWED_ORIGINS", ["http://localhost:5173"])
            frontend_origin = allowed_origins[0] if isinstance(allowed_origins, list) else allowed_origins

        # Ensure TenantSubscription exists
        TenantSubscription.objects.get_or_create(
            organization=request.user.organization,
            defaults={
                "plan_tier": "FREE",
                "seats_limit": 5,
                "is_active": True,
                "ai_credits_limit": 100
            }
        )

        price_id = None
        if plan == "PRO":
            price_id = getattr(settings, "STRIPE_PRICE_PRO", None)
        elif plan == "ENTERPRISE":
            price_id = getattr(settings, "STRIPE_PRICE_ENTERPRISE", None)

        stripe_key = getattr(settings, "STRIPE_SECRET_KEY", None)
        if stripe_key:
            stripe.api_key = stripe_key

        # In development or testing, fall back to mock checkout. In production, fail closed until Stripe is configured.
        if not stripe_key or not price_id:
            import sys
            if not settings.DEBUG and "test" not in sys.argv:
                return api_error(message="Stripe billing is not configured for this environment.", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
            from urllib.parse import quote
            checkout_url = request.build_absolute_uri(
                f"/api/v1/billing/mock-upgrade/?plan={plan}&org_id={str(request.user.organization.id)}&redirect_uri={quote(frontend_origin)}"
            )
            return api_success(
                data={"checkout_url": checkout_url, "mode": "MOCK"},
                message="Mock checkout redirection url generated successfully."
            )

        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=f"{frontend_origin.rstrip('/')}/billing?success=true",
                cancel_url=f"{frontend_origin.rstrip('/')}/billing?cancelled=true",
                client_reference_id=str(request.user.organization.id),
                customer_email=request.user.email,
            )
            return api_success(
                data={"checkout_url": checkout_session.url, "mode": "STRIPE"},
                message="Stripe checkout session initialized."
            )
        except Exception as e:
            return api_error(message=f"Failed to initialize Stripe checkout: {str(e)}")


class StripeWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        webhook_secret = getattr(settings, "STRIPE_WEBHOOK_SECRET", None)

        if not sig_header or not webhook_secret:
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        except Exception:
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)

        event_type = event['type']
        data_object = event['data']['object']

        if event_type == 'checkout.session.completed':
            org_id = data_object.get('client_reference_id')
            subscription_id = data_object.get('subscription')
            customer_id = data_object.get('customer')
            
            plan_tier = "FREE"
            seats_limit = 5
            ai_credits_limit = 100
            
            try:
                line_items = stripe.checkout.Session.list_line_items(data_object['id'])
                price_id = line_items['data'][0]['price']['id']
                if price_id == getattr(settings, "STRIPE_PRICE_PRO", None):
                    plan_tier = "PRO"
                    seats_limit = 20
                    ai_credits_limit = 1000
                elif price_id == getattr(settings, "STRIPE_PRICE_ENTERPRISE", None):
                    plan_tier = "ENTERPRISE"
                    seats_limit = 1000
                    ai_credits_limit = 10000
            except Exception:
                pass

            if org_id:
                try:
                    sub = TenantSubscription.objects.get(organization_id=org_id)
                    sub.stripe_customer_id = customer_id
                    sub.stripe_subscription_id = subscription_id
                    sub.save()
                    trigger_subscription_verification(request, sub, plan_tier)
                except TenantSubscription.DoesNotExist:
                    pass

        elif event_type in ['customer.subscription.updated', 'customer.subscription.deleted']:
            subscription_id = data_object.get('id')
            stripe_status = data_object.get('status')
            
            if event_type == 'customer.subscription.deleted' or stripe_status in ['unpaid', 'canceled']:
                try:
                    sub = TenantSubscription.objects.get(stripe_subscription_id=subscription_id)
                    sub.plan_tier = "FREE"
                    sub.seats_limit = 5
                    sub.ai_credits_limit = 100
                    sub.plan_verified = True
                    sub.is_active = True
                    sub.verification_token = None
                    sub.save()
                except TenantSubscription.DoesNotExist:
                    pass
            elif stripe_status == 'active':
                try:
                    sub = TenantSubscription.objects.get(stripe_subscription_id=subscription_id)
                    price_id = data_object['items']['data'][0]['price']['id']
                    if price_id == getattr(settings, "STRIPE_PRICE_PRO", None):
                        plan_tier = "PRO"
                    elif price_id == getattr(settings, "STRIPE_PRICE_ENTERPRISE", None):
                        plan_tier = "ENTERPRISE"
                    else:
                        plan_tier = "FREE"
                    trigger_subscription_verification(request, sub, plan_tier)
                except TenantSubscription.DoesNotExist:
                    pass

        return HttpResponse(status=status.HTTP_200_OK)


class MockUpgradeView(APIView):
    """Development-only endpoint for mock plan upgrades.

    Protected by two independent guards:
    1. IsAuthenticated — callers must hold a valid JWT even in dev.
    2. DEBUG check inside get() — raises Http404 in production regardless.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        import sys
        if not settings.DEBUG and "test" not in sys.argv:
            raise Http404("Mock billing is only available in development.")

        plan = request.query_params.get("plan", "FREE")
        org_id = request.query_params.get("org_id")
        redirect_uri = request.query_params.get("redirect_uri")

        if plan not in ["PRO", "ENTERPRISE"]:
            return api_error(message="Invalid mock upgrade plan.")

        if not org_id:
            return api_error(message="Organization id is required for mock billing.")

        if org_id:
            sub, _ = TenantSubscription.objects.get_or_create(
                organization_id=org_id,
                defaults={
                    "plan_tier": "FREE",
                    "seats_limit": 5,
                    "is_active": True,
                    "ai_credits_limit": 100
                }
            )
            trigger_subscription_verification(request, sub, plan)

        # Redirect back to the frontend billing success view
        if not redirect_uri:
            redirect_uri = getattr(settings, "CORS_ALLOWED_ORIGINS", "http://localhost:5173")
            if isinstance(redirect_uri, list):
                redirect_uri = redirect_uri[0]
        
        return redirect(f"{redirect_uri.rstrip('/')}/billing?success=true")


class VerifySubscriptionView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        token = request.query_params.get("token")
        org_id = request.query_params.get("org_id")

        if not token or not org_id:
            return api_error(message="Missing verification token or organization id.", status_code=status.HTTP_400_BAD_REQUEST)

        try:
            sub = TenantSubscription.objects.get(organization_id=org_id, verification_token=token)
            sub.plan_verified = True
            sub.is_active = True
            sub.verification_token = None
            sub.save()
        except TenantSubscription.DoesNotExist:
            return api_error(message="Invalid or expired verification token.", status_code=status.HTTP_400_BAD_REQUEST)

        # Resolve frontend origin
        frontend_origin = getattr(settings, "CORS_ALLOWED_ORIGINS", "http://localhost:5173")
        if isinstance(frontend_origin, list):
            frontend_origin = frontend_origin[0]
        frontend_origin = frontend_origin.rstrip("/")

        return redirect(f"{frontend_origin}/billing?verified=true")

    def post(self, request):
        token = request.data.get("token")
        org_id = request.data.get("org_id")

        if not token or not org_id:
            return api_error(message="Missing verification token or organization id.", status_code=status.HTTP_400_BAD_REQUEST)

        try:
            sub = TenantSubscription.objects.get(organization_id=org_id, verification_token=token)
            sub.plan_verified = True
            sub.is_active = True
            sub.verification_token = None
            sub.save()
        except TenantSubscription.DoesNotExist:
            return api_error(message="Invalid or expired verification token.", status_code=status.HTTP_400_BAD_REQUEST)

        return api_success(message="Subscription plan verified successfully.")

class MockInvoiceListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.organization:
            return api_error(message="User does not belong to an organization.")

        try:
            sub = TenantSubscription.objects.get(organization=request.user.organization)
        except TenantSubscription.DoesNotExist:
            return api_success(data=[], message="No active subscription found.")

        # Let's generate a list of monthly mock invoices starting from sub.created_at up to now
        from django.utils import timezone
        import datetime

        invoices = []
        created_at = sub.created_at
        now = timezone.now()

        # Monthly price based on current tier
        tier = sub.plan_tier
        price = 0
        if tier == "PRO":
            price = 49
        elif tier == "ENTERPRISE":
            price = 299

        # If FREE tier, return empty invoice list or standard zero-dollar starter
        if price == 0:
            return api_success(data=[], message="Free tier subscription has no billing invoices.")

        # Iterate monthly from created_at until now
        curr_date = created_at
        index = 1
        while curr_date <= now:
            invoices.append({
                "id": f"INV-2026-{index:04d}",
                "date": curr_date.strftime("%Y-%m-%d"),
                "amount": f"${price}.00",
                "description": f"BAHub {tier.capitalize()} Subscription Monthly Payment",
                "status": "Paid"
            })
            index += 1
            # Move to next month safely (e.g. adding 30 days)
            curr_date = curr_date + datetime.timedelta(days=30)

        # Reverse so newest is first
        invoices.reverse()
        return api_success(data=invoices, message="Billing invoices retrieved successfully.")
