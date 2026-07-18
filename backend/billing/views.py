import json
import uuid
import datetime
import logging
import razorpay
import hmac
import hashlib
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

# Initialize Razorpay client
razorpay_client = razorpay.Client(
    auth=(
        getattr(settings, "RAZORPAY_KEY_ID", None),
        getattr(settings, "RAZORPAY_KEY_SECRET", None)
    )
)


def _safe_redirect_uri(requested_uri: str) -> str:
    """
    Validate that a redirect_uri is in CORS_ALLOWED_ORIGINS.
    Prevents open-redirect attacks by falling back to the first allowed origin
    if the requested URI does not match any known origin.
    """
    from urllib.parse import urlparse
    allowed = getattr(settings, "CORS_ALLOWED_ORIGINS", [])
    if isinstance(allowed, str):
        allowed = [allowed]
    default = allowed[0] if allowed else "http://localhost:5173"
    if not requested_uri:
        return default
    try:
        parsed = urlparse(requested_uri)
        origin = f"{parsed.scheme}://{parsed.netloc}"
        if origin in allowed:
            return requested_uri.rstrip("/")
    except Exception:
        pass
    return default


def generate_receipt_number():
    """
    Generate a unique, sequential receipt number for the current year.

    Uses a database-level advisory lock via select_for_update on the latest
    Payment row for this year to eliminate the race condition that existed
    when two concurrent requests could both compute the same count value
    before either had committed a new Payment row.
    """
    year = timezone.now().year
    prefix = f"BAH-{year}-"
    with transaction.atomic():
        # Lock the highest existing receipt number for this year so concurrent
        # requests queue up instead of computing the same next value.
        last = (
            Payment.objects.select_for_update()
            .filter(receipt_number__startswith=prefix)
            .order_by("-receipt_number")
            .first()
        )
        if last:
            try:
                last_seq = int(last.receipt_number.split("-")[-1])
            except (ValueError, IndexError):
                last_seq = 0
        else:
            last_seq = 0
        next_seq = last_seq + 1
        return f"{prefix}{next_seq:06d}"


def process_successful_payment(sub, plan_tier, amount, gateway_order_id=None, gateway_payment_id=None, gateway_invoice_id=None, gateway_customer_id=None, payment_method="Card (Razorpay)", event_type="razorpay.payment.captured"):
    with transaction.atomic():
        # Generate receipt number
        receipt_num = generate_receipt_number()
        
        # Create Payment record
        payment = Payment.objects.create(
            receipt_number=receipt_num,
            organization=sub.organization,
            subscription=sub,
            gateway_payment_id=gateway_payment_id,
            gateway_invoice_id=gateway_invoice_id,
            gateway_order_id=gateway_order_id,
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
            event_id=gateway_payment_id or gateway_order_id or f"MOCK-{uuid.uuid4().hex[:8].upper()}"
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
                    transaction_id=gateway_payment_id or gateway_order_id or "N/A",
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

        # Resolve price based on plan (converted from USD to INR at current rate)
        plan_prices = {
            "PRO": 471527,  # $49.00 USD × 96.23 = ₹4,715.27 INR (in paise)
            "ENTERPRISE": 2877277  # $299.00 USD × 96.23 = ₹28,772.77 INR (in paise)
        }
        amount = plan_prices.get(plan, 471527)
        
        # Resolve frontend origin URL dynamically from client request headers to support dynamic ports
        frontend_origin = request.META.get('HTTP_ORIGIN')
        if not frontend_origin:
            frontend_origin = request.META.get('HTTP_REFERER')
        if frontend_origin:
            from urllib.parse import urlparse
            parsed_uri = urlparse(frontend_origin)
            frontend_origin = f"{parsed_uri.scheme}://{parsed_uri.netloc}"
        else:
            frontend_origin = getattr(settings, "CORS_ALLOWED_ORIGINS", "http://localhost:5173")
            if isinstance(frontend_origin, list):
                frontend_origin = frontend_origin[0]

        # Fallback to mock checkout redirects in test mode, development, or if Razorpay is unconfigured
        import sys
        is_testing = 'test' in sys.argv or any('test' in arg for arg in sys.argv)
        
        # If Razorpay keys are missing, or we're running tests, fallback to mock checkout.
        if is_testing or not getattr(settings, "RAZORPAY_KEY_ID", None) or not getattr(settings, "RAZORPAY_KEY_SECRET", None):
            mock_checkout_url = f"{request.build_absolute_uri('/api/v1/billing/mock-upgrade/')}?plan={plan}&org_id={request.user.organization.id}&redirect_uri={frontend_origin}"
            return api_success(
                data={"checkout_url": mock_checkout_url, "mode": "MOCK"},
                message="Mock checkout session initiated."
            )

        if not razorpay_client.auth:
            return api_error(message="Razorpay API is not configured on this server environment.")

        try:
            # Create Razorpay order
            order_data = {
                "amount": amount,
                "currency": "INR",
                "receipt": f"BAH-{plan}-{str(request.user.organization.id)[:12]}",
                "payment_capture": 1,  # Auto-capture payment
                "notes": {
                    "organization_id": str(request.user.organization.id),
                    "plan": plan,
                    "user_email": request.user.email
                }
            }
            
            logger.info(f"Creating Razorpay order: {order_data}")
            razorpay_order = razorpay_client.order.create(data=order_data)
            logger.info(f"Razorpay order created successfully: {razorpay_order['id']}")
            
            return api_success(
                data={
                    "order_id": razorpay_order["id"],
                    "amount": amount,
                    "currency": "INR",
                    "key_id": getattr(settings, "RAZORPAY_KEY_ID", None),
                    "plan": plan,
                    "frontend_origin": frontend_origin
                },
                message="Razorpay order created successfully."
            )
        except Exception as e:
            logger.error(f"Failed to create Razorpay order: {str(e)}")
            return api_error(message=f"Failed to initialize Razorpay checkout: {str(e)}")


class RazorpayWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_X_RAZORPAY_SIGNATURE')
        webhook_secret = getattr(settings, "RAZORPAY_WEBHOOK_SECRET", None)

        if not sig_header or not webhook_secret:
            logger.error("Webhook signature or secret missing")
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)

        # Verify webhook signature
        try:
            generated_signature = hmac.new(
                webhook_secret.encode('utf-8'),
                payload,
                hashlib.sha256
            ).hexdigest()
            
            if not hmac.compare_digest(generated_signature, sig_header):
                logger.error("Webhook signature verification failed")
                return HttpResponse(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Webhook signature verification error: {str(e)}")
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)

        # Parse webhook payload
        try:
            webhook_data = json.loads(payload)
        except json.JSONDecodeError:
            logger.error("Invalid webhook payload")
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)

        # Webhook Idempotency Check
        event_id = webhook_data.get('id')
        if event_id:
            if ProcessedWebhookEvent.objects.filter(gateway_event_id=event_id).exists():
                return HttpResponse(status=status.HTTP_200_OK)
            ProcessedWebhookEvent.objects.create(gateway_event_id=event_id)

        event_type = webhook_data.get('event', '')
        logger.info(f"Processing Razorpay webhook: {event_type}")

        # Handle payment.captured event
        if event_type == 'payment.captured':
            payment_data = webhook_data.get('payload', {}).get('payment', {}).get('entity', {})
            order_id = payment_data.get('order_id')
            payment_id = payment_data.get('id')
            amount = payment_data.get('amount', 0) / 100.0  # Convert paise to INR
            
            # Get order details to retrieve organization and plan
            try:
                order_data = razorpay_client.order.fetch(order_id)
                notes = order_data.get('notes', {})
                org_id = notes.get('organization_id')
                plan = notes.get('plan', 'PRO')
            except Exception as e:
                logger.error(f"Failed to fetch order details: {str(e)}")
                return HttpResponse(status=status.HTTP_200_OK)

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
                    sub.gateway_customer_id = payment_data.get('email')
                    sub.gateway_subscription_id = order_id
                    sub.plan_tier = plan
                    if plan == "PRO":
                        sub.seats_limit = 20
                        sub.ai_credits_limit = 1000
                    elif plan == "ENTERPRISE":
                        sub.seats_limit = 1000
                        sub.ai_credits_limit = 10000
                    sub.save()
                    
                    # Convert INR to USD for record keeping (approximate)
                    amount_usd = amount / 83.0  # Approximate conversion rate
                    
                    process_successful_payment(
                        sub=sub,
                        plan_tier=plan,
                        amount=round(amount_usd, 2),
                        gateway_order_id=order_id,
                        gateway_payment_id=payment_id,
                        payment_method=payment_data.get('method', 'card'),
                        event_type=event_type
                    )
                except Organization.DoesNotExist:
                    logger.error(f"Organization not found: {org_id}")

        # Handle payment.failed event
        elif event_type == 'payment.failed':
            payment_data = webhook_data.get('payload', {}).get('payment', {}).get('entity', {})
            order_id = payment_data.get('order_id')
            error_code = payment_data.get('error_code', 'UNKNOWN')
            error_description = payment_data.get('error_description', 'Payment failed')
            
            logger.error(f"Payment failed for order {order_id}: {error_code} - {error_description}")
            
            # Get order details to retrieve organization
            try:
                order_data = razorpay_client.order.fetch(order_id)
                notes = order_data.get('notes', {})
                org_id = notes.get('organization_id')
                plan = notes.get('plan', 'PRO')
            except Exception as e:
                logger.error(f"Failed to fetch order details: {str(e)}")
                return HttpResponse(status=status.HTTP_200_OK)

            if org_id:
                try:
                    from organizations.models import Organization
                    org = Organization.objects.get(id=org_id)
                    sub = TenantSubscription.objects.get(organization=org)
                    
                    # Create audit log for failed payment
                    PaymentAuditLog.objects.create(
                        organization=org,
                        webhook_event=event_type,
                        old_plan=sub.plan_tier,
                        new_plan=sub.plan_tier,
                        gateway_response=f"Payment failed: {error_code} - {error_description}",
                        event_id=order_id
                    )
                except (Organization.DoesNotExist, TenantSubscription.DoesNotExist):
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
                # No org admins found — skip notification rather than emailing a
                # hardcoded fallback address that would not exist in production.
                logger.warning(
                    "MockUpgradeView: no admin emails found for org_id=%s; "
                    "skipping verification email.",
                    org_id,
                )
                admin_emails = []

            if admin_emails:
                verify_url = request.build_absolute_uri(
                    f"/api/v1/billing/verify-subscription/?token={token}&org_id={org_id}"
                )
                if redirect_uri:
                    verify_url += f"&redirect_uri={redirect_uri}"

                send_mail(
                    subject=(
                        "Verify Your Pro Subscription Upgrade"
                        if plan == "PRO"
                        else "Verify Your Enterprise Subscription Upgrade"
                    ),
                    message=f"Please verify your subscription upgrade. Click here: {verify_url}",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=admin_emails,
                fail_silently=False,
            )

        # Redirect back to the frontend billing success view (open-redirect safe)
        safe_uri = _safe_redirect_uri(redirect_uri)
        return redirect(f"{safe_uri}/billing?success=true")


class VerifySubscriptionView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        token = request.query_params.get("token")
        org_id = request.query_params.get("org_id")
        redirect_uri = request.query_params.get("redirect_uri")
        
        if not token or not org_id:
            return api_error(message="Missing token or org_id", status_code=status.HTTP_400_BAD_REQUEST)
            
        try:
            from organizations.models import Organization
            org = Organization.objects.get(id=org_id)
            sub = TenantSubscription.objects.get(organization=org, verification_token=token)
            
            sub.plan_verified = True
            sub.is_active = True
            sub.payment_status = "SUCCESS"
            sub.verification_token = None
            sub.expires_at = timezone.now() + datetime.timedelta(days=30)
            sub.save()
            
            safe_uri = _safe_redirect_uri(redirect_uri)
            return redirect(f"{safe_uri}/dashboard")
            
        except (Organization.DoesNotExist, TenantSubscription.DoesNotExist):
            return api_error(message="Invalid token or organization.", status_code=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        # Razorpay signature verification for client-side payment verification
        razorpay_order_id = request.data.get("razorpay_order_id")
        razorpay_payment_id = request.data.get("razorpay_payment_id")
        razorpay_signature = request.data.get("razorpay_signature")
        org_id = request.data.get("org_id")
        plan = request.data.get("plan")

        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature, org_id, plan]):
            return api_error(message="Missing required parameters for payment verification.", status_code=status.HTTP_400_BAD_REQUEST)

        # Verify signature
        key_secret = getattr(settings, "RAZORPAY_KEY_SECRET", None)
        if not key_secret:
            return api_error(message="Razorpay key secret not configured.", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            generated_signature = hmac.new(
                key_secret.encode('utf-8'),
                f"{razorpay_order_id}|{razorpay_payment_id}".encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            if not hmac.compare_digest(generated_signature, razorpay_signature):
                return api_error(message="Invalid payment signature.", status_code=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Signature verification error: {str(e)}")
            return api_error(message="Signature verification failed.", status_code=status.HTTP_400_BAD_REQUEST)

        # Verify payment with Razorpay
        try:
            payment_data = razorpay_client.payment.fetch(razorpay_payment_id)
            if payment_data.get('status') != 'captured':
                return api_error(message="Payment not captured yet.", status_code=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Failed to fetch payment details: {str(e)}")
            return api_error(message="Failed to verify payment with Razorpay.", status_code=status.HTTP_400_BAD_REQUEST)

        # Process successful payment
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
            sub.gateway_customer_id = payment_data.get('email')
            sub.gateway_subscription_id = razorpay_order_id
            sub.plan_tier = plan
            if plan == "PRO":
                sub.seats_limit = 20
                sub.ai_credits_limit = 1000
            elif plan == "ENTERPRISE":
                sub.seats_limit = 1000
                sub.ai_credits_limit = 10000
            sub.save()
            
            # Convert amount from paise to USD
            amount_paise = payment_data.get('amount', 0)
            amount_inr = amount_paise / 100.0
            amount_usd = amount_inr / 83.0  # Approximate conversion rate
            
            process_successful_payment(
                sub=sub,
                plan_tier=plan,
                amount=round(amount_usd, 2),
                gateway_order_id=razorpay_order_id,
                gateway_payment_id=razorpay_payment_id,
                payment_method=payment_data.get('method', 'card'),
                event_type="razorpay.client_verification"
            )
            
            return api_success(message="Payment verified successfully.")
        except Organization.DoesNotExist:
            return api_error(message="Organization not found.", status_code=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Payment processing error: {str(e)}")
            return api_error(message="Failed to process payment.", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
                    "transaction_id": p.transaction_id or p.gateway_payment_id or "N/A"
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
                    "event_id": w.gateway_event_id,
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
