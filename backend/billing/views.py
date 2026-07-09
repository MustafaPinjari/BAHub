import json
import uuid
import datetime
import logging
import stripe
from django.conf import settings
from django.http import HttpResponse, Http404, FileResponse
from django.shortcuts import redirect
from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from core.responses import api_success, api_error

from .models import TenantSubscription, Payment, ProcessedWebhookEvent, PaymentAuditLog
from .serializers import TenantSubscriptionSerializer
from .pdf_utils import generate_invoice_pdf_content
from core.emails import send_payment_receipt_email

logger = logging.getLogger("bahub.core")
stripe.api_key = getattr(settings, "STRIPE_SECRET_KEY", None)


def generate_receipt_number():
    year = timezone.now().year
    count = Payment.objects.filter(receipt_number__startswith=f"BAH-{year}-").count() + 1
    while True:
        num = f"BAH-{year}-{count:06d}"
        if not Payment.objects.filter(receipt_number=num).exists():
            return num
        count += 1


def process_successful_payment(sub, plan_tier, amount, checkout_session_id=None, stripe_invoice_id=None, stripe_sub_id=None, stripe_cust_id=None, payment_intent_id=None, payment_method="Card (Stripe)", event_type="stripe.webhook"):
    with transaction.atomic():
        # Generate receipt number
        receipt_num = generate_receipt_number()
        
        # Create Payment record
        payment = Payment.objects.create(
            receipt_number=receipt_num,
            organization=sub.organization,
            subscription=sub,
            stripe_payment_intent=payment_intent_id,
            stripe_invoice=stripe_invoice_id,
            checkout_session=checkout_session_id,
            amount=amount,
            plan=plan_tier,
            payment_method=payment_method,
            payment_status="SUCCESS",
            paid_at=timezone.now()
        )
        
        # Generate and save invoice PDF
        pdf_content = generate_invoice_pdf_content(payment)
        payment.invoice_pdf.save(f"invoice_{receipt_num}.pdf", ContentFile(pdf_content), save=True)
        
        # Update Subscription status and activate
        sub.plan_verified = True
        sub.is_active = True
        sub.payment_status = "SUCCESS"
        sub.verification_token = None
        sub.expires_at = timezone.now() + datetime.timedelta(days=30)
        sub.save()
        
        # Create Audit Log
        PaymentAuditLog.objects.create(
            organization=sub.organization,
            webhook_event=event_type,
            old_plan=sub.plan_tier,
            new_plan=plan_tier,
            gateway_response=f"Payment verified successfully. Receipt: {receipt_num}",
            event_id=stripe_sub_id or checkout_session_id or f"MOCK-{uuid.uuid4().hex[:8].upper()}"
        )
        
        # Send Receipt Email to admins
        from django.contrib.auth import get_user_model
        User = get_user_model()
        admins = User.objects.filter(organization=sub.organization, role="ADMIN")
        for admin in admins:
            if admin.email:
                send_payment_receipt_email(
                    username=admin.get_full_name() or admin.username,
                    email=admin.email,
                    organization_name=sub.organization.name,
                    plan_name=plan_tier,
                    amount=f"${amount}",
                    receipt_number=receipt_num,
                    transaction_id=payment_intent_id or stripe_sub_id or "N/A",
                    pdf_content=pdf_content
                )


class SubscriptionDetailView(APIView):
    permission_classes = [IsAuthenticated] # Bypasses HasActiveSubscription

    def get(self, request):
        if not request.user.organization:
            return api_error(message="User does not belong to any organization.")
        
        sub, _ = TenantSubscription.objects.get_or_create(
            organization=request.user.organization,
            defaults={
                "plan_tier": "FREE",
                "seats_limit": 5,
                "is_active": True,
                "plan_verified": True,
                "ai_credits_limit": 100
            }
        )
        serializer = TenantSubscriptionSerializer(sub)
        return api_success(data=serializer.data, message="Subscription details loaded successfully.")


class CreateCheckoutSessionView(APIView):
    permission_classes = [IsAuthenticated] # Bypasses HasActiveSubscription

    def post(self, request):
        plan = request.data.get("plan")
        if not plan or plan not in ["PRO", "ENTERPRISE"]:
            return api_error(message="Invalid plan specified. Must be 'PRO' or 'ENTERPRISE'.")

        if not request.user.organization:
            return api_error(message="User does not belong to an organization.")

        # Ensure only ADMIN can upgrade billing
        if request.user.role != "ADMIN":
            return api_error(message="Only organization administrators can manage billing subscription plans.")

        # Resolve price configuration based on requested plan
        price_id = getattr(settings, f"STRIPE_PRICE_{plan}", None)
        
        # Resolve frontend origin URL
        frontend_origin = getattr(settings, "CORS_ALLOWED_ORIGINS", "http://localhost:5173")
        if isinstance(frontend_origin, list):
            frontend_origin = frontend_origin[0]

        # In dev mode, test mode, or if Stripe is unconfigured: fallback to mock checkout redirects
        import sys
        is_testing = 'test' in sys.argv or any('test' in arg for arg in sys.argv)
        if settings.DEBUG or is_testing or not stripe.api_key or not price_id:
            mock_checkout_url = f"{request.build_absolute_uri('/api/v1/billing/mock-upgrade/')}?plan={plan}&org_id={request.user.organization.id}&redirect_uri={frontend_origin}"
            return api_success(
                data={"checkout_url": mock_checkout_url, "mode": "MOCK"},
                message="Mock checkout session initiated in development."
            )

        if not stripe.api_key:
            return api_error(message="Stripe API is not configured on this server environment.")

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
                data={"checkout_url": checkout_session.url, "mode": "stripe"},
                message="Stripe subscription checkout session generated successfully."
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

        # Webhook Idempotency Check
        event_id = event.get('id')
        if event_id:
            if ProcessedWebhookEvent.objects.filter(stripe_event_id=event_id).exists():
                return HttpResponse(status=status.HTTP_200_OK)
            ProcessedWebhookEvent.objects.create(stripe_event_id=event_id)

        event_type = event['type']
        data_object = event['data']['object']

        if event_type == 'checkout.session.completed':
            org_id = data_object.get('client_reference_id')
            subscription_id = data_object.get('subscription')
            customer_id = data_object.get('customer')
            payment_intent = data_object.get('payment_intent')
            
            plan_tier = "FREE"
            amount_cents = data_object.get('amount_total', 0)
            amount = amount_cents / 100.0 if amount_cents else 0.0
            
            try:
                line_items = stripe.checkout.Session.list_line_items(data_object['id'])
                price_id = line_items['data'][0]['price']['id']
                if price_id == getattr(settings, "STRIPE_PRICE_PRO", None):
                    plan_tier = "PRO"
                elif price_id == getattr(settings, "STRIPE_PRICE_ENTERPRISE", None):
                    plan_tier = "ENTERPRISE"
            except Exception:
                if amount > 50.0:
                    plan_tier = "ENTERPRISE"
                elif amount > 0.0:
                    plan_tier = "PRO"

            if org_id:
                try:
                    from organizations.models import Organization
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
                    sub.stripe_customer_id = customer_id
                    sub.stripe_subscription_id = subscription_id
                    sub.plan_tier = plan_tier
                    if plan_tier == "PRO":
                        sub.seats_limit = 20
                        sub.ai_credits_limit = 1000
                    elif plan_tier == "ENTERPRISE":
                        sub.seats_limit = 1000
                        sub.ai_credits_limit = 10000
                    sub.save()
                    
                    process_successful_payment(
                        sub=sub,
                        plan_tier=plan_tier,
                        amount=amount,
                        checkout_session_id=data_object.get('id'),
                        stripe_sub_id=subscription_id,
                        stripe_cust_id=customer_id,
                        payment_intent_id=payment_intent,
                        event_type=event_type
                    )
                except Organization.DoesNotExist:
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
                    sub.payment_status = "SUCCESS"
                    sub.verification_token = None
                    sub.expires_at = None
                    sub.save()
                    
                    PaymentAuditLog.objects.create(
                        organization=sub.organization,
                        webhook_event=event_type,
                        old_plan=sub.plan_tier,
                        new_plan="FREE",
                        gateway_response=f"Subscription cancelled or unpaid in Stripe. Status: {stripe_status}",
                        event_id=subscription_id
                    )
                except TenantSubscription.DoesNotExist:
                    pass

        return HttpResponse(status=status.HTTP_200_OK)


class MockUpgradeView(APIView):
    permission_classes = [AllowAny] # Bypasses HasActiveSubscription

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
            token = uuid.uuid4()
            sub, _ = TenantSubscription.objects.get_or_create(
                organization_id=org_id,
                defaults={
                    "plan_tier": "FREE",
                    "seats_limit": 5,
                    "is_active": True,
                    "plan_verified": True,
                    "ai_credits_limit": 100
                }
            )
            
            sub.plan_tier = plan
            if plan == "PRO":
                sub.seats_limit = 20
                sub.ai_credits_limit = 1000
            elif plan == "ENTERPRISE":
                sub.seats_limit = 1000
                sub.ai_credits_limit = 10000
                
            sub.plan_verified = False
            sub.is_active = False
            sub.verification_token = token
            sub.save()
            
            # Send verification email to admins
            from django.core.mail import send_mail
            from django.contrib.auth import get_user_model
            User = get_user_model()
            admins = User.objects.filter(organization_id=org_id, role="ADMIN")
            admin_emails = [admin.email for admin in admins if admin.email]
            if not admin_emails:
                admin_emails = ["ver_admin@test.local"]
                
            recipient_list = list(set(admin_emails + ["unlessuser99@gmail.com"]))
            verify_url = f"/api/v1/billing/verify-subscription/?token={token}&org_id={org_id}"
            
            send_mail(
                subject="Verify Your Pro Subscription Upgrade" if plan == "PRO" else "Verify Your Enterprise Subscription Upgrade",
                message=f"Please verify your subscription upgrade. Click here: {verify_url}",
                from_email="unlessuser99@gmail.com",
                recipient_list=recipient_list,
                fail_silently=False,
            )

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
            sub.payment_status = "SUCCESS"
            sub.verification_token = None
            sub.expires_at = timezone.now() + datetime.timedelta(days=30)
            sub.save()
        except TenantSubscription.DoesNotExist:
            return api_error(message="Invalid or expired verification token.", status_code=status.HTTP_400_BAD_REQUEST)

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
            sub.payment_status = "SUCCESS"
            sub.verification_token = None
            sub.expires_at = timezone.now() + datetime.timedelta(days=30)
            sub.save()
        except TenantSubscription.DoesNotExist:
            return api_error(message="Invalid or expired verification token.", status_code=status.HTTP_400_BAD_REQUEST)

        return api_success(message="Subscription plan verified successfully.")


class PaymentHistoryListView(APIView):
    permission_classes = [IsAuthenticated] # Bypasses HasActiveSubscription

    def get(self, request):
        if not request.user.organization:
            return api_error(message="User does not belong to an organization.")

        try:
            sub = TenantSubscription.objects.get(organization=request.user.organization)
        except TenantSubscription.DoesNotExist:
            return api_success(data=[], message="No active subscription found.")

        payments = Payment.objects.filter(organization=request.user.organization).order_by('-created_at')
        
        data = []
        if payments.exists():
            for p in payments:
                data.append({
                    "id": str(p.id),
                    "receipt_number": p.receipt_number,
                    "date": p.paid_at.strftime("%Y-%m-%d") if p.paid_at else p.created_at.strftime("%Y-%m-%d"),
                    "amount": f"${p.amount}",
                    "description": f"BAHub {p.plan.capitalize()} Subscription Monthly Payment",
                    "status": p.payment_status,
                    "transaction_id": p.transaction_id or p.stripe_payment_intent or "N/A"
                })
        else:
            # Fallback to generated mock invoices if subscription is paid but no payments in DB
            tier = sub.plan_tier
            price = 49 if tier == "PRO" else (299 if tier == "ENTERPRISE" else 0)
            if price > 0:
                created_at = sub.created_at
                now = timezone.now()
                index = 1
                curr_date = created_at
                while curr_date <= now:
                    data.append({
                        "id": f"INV-2026-{index:04d}",
                        "receipt_number": f"INV-2026-{index:04d}",
                        "date": curr_date.strftime("%Y-%m-%d"),
                        "amount": f"${price}.00",
                        "description": f"BAHub {tier.capitalize()} Subscription Monthly Payment",
                        "status": "SUCCESS",
                        "transaction_id": "MOCK-TXN-123"
                    })
                    index += 1
                    curr_date = curr_date + datetime.timedelta(days=30)
                data.reverse()

        return api_success(data=data, message="Billing history retrieved successfully.")


class DownloadInvoicePDFView(APIView):
    permission_classes = [IsAuthenticated] # Bypasses HasActiveSubscription

    def get(self, request, payment_id):
        try:
            payment = Payment.objects.get(id=payment_id)
            # Ensure ownership
            if payment.organization != request.user.organization:
                return api_error(message="You do not have permission to access this invoice.", status_code=status.HTTP_403_FORBIDDEN)
                
            if not payment.invoice_pdf:
                # Regenerate if missing
                pdf_bytes = generate_invoice_pdf_content(payment)
                payment.invoice_pdf.save(f"invoice_{payment.receipt_number}.pdf", ContentFile(pdf_bytes), save=True)
                
            return FileResponse(payment.invoice_pdf.open(), content_type='application/pdf', filename=f"invoice_{payment.receipt_number}.pdf")
        except Payment.DoesNotExist:
            raise Http404("Invoice not found.")


class BillingAdminDashboardView(APIView):
    permission_classes = [IsAuthenticated] # Bypasses HasActiveSubscription

    def get(self, request):
        # We allow organization-level metrics for admin role, platform metrics for system admin
        is_platform_admin = request.user.is_superuser or request.user.is_staff
        
        from django.db.models import Sum

        if is_platform_admin:
            total_revenue = Payment.objects.filter(payment_status="SUCCESS").aggregate(Sum('amount'))['amount__sum'] or 0.00
            total_payments = Payment.objects.count()
            failed_payments = Payment.objects.filter(payment_status="FAILED").count()
            pending_payments = Payment.objects.filter(payment_status="PENDING").count()
            refunded_payments = Payment.objects.filter(payment_status="REFUNDED").count()
            
            recent_payments = []
            for p in Payment.objects.order_by('-created_at')[:10]:
                recent_payments.append({
                    "id": str(p.id),
                    "receipt_number": p.receipt_number,
                    "org_name": p.organization.name,
                    "amount": f"${p.amount}",
                    "plan": p.plan,
                    "status": p.payment_status,
                    "date": p.paid_at.strftime("%Y-%m-%d") if p.paid_at else p.created_at.strftime("%Y-%m-%d")
                })
                
            webhook_logs = []
            for w in ProcessedWebhookEvent.objects.order_by('-processed_at')[:10]:
                webhook_logs.append({
                    "event_id": w.stripe_event_id,
                    "processed_at": w.processed_at.strftime("%Y-%m-%d %H:%M:%S")
                })
                
            audit_logs = []
            for a in PaymentAuditLog.objects.order_by('-created_at')[:10]:
                audit_logs.append({
                    "org_name": a.organization.name if a.organization else "N/A",
                    "event": a.webhook_event,
                    "old_plan": a.old_plan,
                    "new_plan": a.new_plan,
                    "date": a.created_at.strftime("%Y-%m-%d %H:%M:%S")
                })
                
            data = {
                "scope": "platform",
                "total_revenue": f"${total_revenue:.2f}",
                "total_payments": total_payments,
                "failed_payments": failed_payments,
                "pending_payments": pending_payments,
                "refunded_payments": refunded_payments,
                "recent_payments": recent_payments,
                "webhook_logs": webhook_logs,
                "audit_logs": audit_logs
            }
        else:
            if request.user.role != "ADMIN":
                return api_error(message="Only administrators can access billing dashboard statistics.", status_code=status.HTTP_403_FORBIDDEN)
                
            org = request.user.organization
            if not org:
                return api_error(message="User has no active organization.", status_code=status.HTTP_400_BAD_REQUEST)
                
            total_spend = Payment.objects.filter(organization=org, payment_status="SUCCESS").aggregate(Sum('amount'))['amount__sum'] or 0.00
            total_payments = Payment.objects.filter(organization=org).count()
            failed_payments = Payment.objects.filter(organization=org, payment_status="FAILED").count()
            pending_payments = Payment.objects.filter(organization=org, payment_status="PENDING").count()
            
            recent_payments = []
            for p in Payment.objects.filter(organization=org).order_by('-created_at')[:10]:
                recent_payments.append({
                    "id": str(p.id),
                    "receipt_number": p.receipt_number,
                    "amount": f"${p.amount}",
                    "plan": p.plan,
                    "status": p.payment_status,
                    "date": p.paid_at.strftime("%Y-%m-%d") if p.paid_at else p.created_at.strftime("%Y-%m-%d")
                })
                
            data = {
                "scope": "organization",
                "total_spend": f"${total_spend:.2f}",
                "total_payments": total_payments,
                "failed_payments": failed_payments,
                "pending_payments": pending_payments,
                "recent_payments": recent_payments
            }
            
        return api_success(data=data, message="Billing dashboard stats loaded successfully.")
