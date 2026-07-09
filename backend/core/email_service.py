import os
import time
import uuid
import logging
import threading
from pathlib import Path
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.core.signing import TimestampSigner, SignatureExpired, BadSignature
from django.utils.timezone import now
from email.mime.image import MIMEImage

logger = logging.getLogger("django")

class EmailService:
    """
    Centralized, enterprise-grade, thread-safe asynchronous email delivery service
    designed to maximize inbox placement for BAHub.
    """

    DEFAULT_SENDER = "BAHub Team <bahubofficial@gmail.com>"
    SUPPORT_EMAIL = "bahubofficial@gmail.com"
    DOMAIN = "bahub.com"

    @staticmethod
    def get_signer():
        return TimestampSigner(salt="bahub-email-secure-signature-salt")

    @classmethod
    def generate_secure_token(cls, value: str) -> str:
        """
        Generates a secure cryptographically signed token with current timestamp.
        """
        signer = cls.get_signer()
        return signer.sign(value)

    @classmethod
    def verify_secure_token(cls, token: str, max_age_seconds: int = 86400) -> str:
        """
        Verifies a cryptographically signed token. Raises SignatureExpired or BadSignature if invalid.
        """
        signer = cls.get_signer()
        return signer.unsign(token, max_age=max_age_seconds)

    @classmethod
    def _send_email_worker(cls, subject, template_name, context, recipient_list, from_email, attachments, headers, email_type, max_retries=3):
        """
        Background worker that handles rendering, header generation, SMTP delivery, and exponential backoff retry logic.
        """
        retry_count = 0
        success = False
        start_time = now()
        
        while retry_count < max_retries and not success:
            try:
                # Render HTML template
                html_content = render_to_string(template_name, context)
                
                # Check for explicit text template, otherwise auto-generate from HTML content
                text_template_name = template_name.replace(".html", ".txt")
                try:
                    text_content = render_to_string(text_template_name, context)
                except Exception:
                    text_content = strip_tags(html_content)
                
                # Setup custom headers
                msg_id = f"<{uuid.uuid4()}@{cls.DOMAIN}>"
                current_headers = {
                    "Reply-To": cls.DEFAULT_SENDER,
                    "Message-ID": msg_id,
                    "X-Mailer": "BAHub-Mailer-Service-v1",
                }
                
                # List-Unsubscribe header for newsletters or waitlist emails
                if email_type in ["waitlist_confirm", "waitlist_invite", "welcome"]:
                    current_headers["List-Unsubscribe"] = f"<mailto:{cls.SUPPORT_EMAIL}?subject=unsubscribe>"
                
                if headers:
                    current_headers.update(headers)
                
                msg = EmailMultiAlternatives(
                    subject=subject,
                    body=text_content,
                    from_email=from_email or cls.DEFAULT_SENDER,
                    to=recipient_list,
                    headers=current_headers
                )
                msg.attach_alternative(html_content, "text/html")
                
                # Attach custom attachments
                if attachments:
                    for attachment in attachments:
                        msg.attach(*attachment)
                
                # Attach marketing banner as inline image (CID) if present in template
                banner_path = Path(settings.BASE_DIR).parent / "frontend" / "src" / "assets" / "email_banner.png"
                if banner_path.exists() and context.get("has_banner", True):
                    with open(banner_path, "rb") as f:
                        mime_image = MIMEImage(f.read())
                        mime_image.add_header("Content-ID", "<email_banner>")
                        mime_image.add_header("Content-Disposition", "inline", filename="email_banner.png")
                        msg.attach(mime_image)
                
                # Send email (throws SMTPException/SocketError on failure)
                msg.send(fail_silently=False)
                success = True
                
                # Log successful delivery
                logger.info(
                    f"[EmailService] Delivered successfully. Type: {email_type} | Subject: '{subject}' | "
                    f"Recipients: {recipient_list} | Attempts: {retry_count + 1} | Time: {now() - start_time}"
                )
                
            except Exception as e:
                retry_count += 1
                logger.warning(
                    f"[EmailService] Failed attempt {retry_count}/{max_retries} to send '{subject}' to {recipient_list}. "
                    f"Error: {e}"
                )
                if retry_count < max_retries:
                    # Exponential backoff sleep (1s, 2s, 4s...)
                    time.sleep(2 ** (retry_count - 1))
                else:
                    # Log hard failure
                    logger.error(
                        f"[EmailService] Hard Failure. Type: {email_type} | Subject: '{subject}' | "
                        f"Recipients: {recipient_list} | Retries exhausted. Final Error: {e}"
                    )

    @classmethod
    def send_async_email(cls, subject, template_name, context, recipient_list, from_email=None, attachments=None, headers=None, email_type="notification"):
        """
        Spawns a background thread to handle email compilation and delivery asynchronously.
        """
        # Ensure has_banner is explicitly controlled
        if "has_banner" not in context:
            context["has_banner"] = True
            
        thread = threading.Thread(
            target=cls._send_email_worker,
            kwargs={
                "subject": subject,
                "template_name": template_name,
                "context": context,
                "recipient_list": recipient_list,
                "from_email": from_email,
                "attachments": attachments,
                "headers": headers,
                "email_type": email_type
            },
            daemon=True
        )
        thread.start()
        return True

    # ─── Email Action Methods ────────────────────────────────────────────────

    @classmethod
    def send_welcome_email(cls, first_name: str, email: str):
        subject = "Welcome to BAHub"
        context = {
            "first_name": first_name.strip().title(),
            "email": email,
            "subject": subject,
        }
        return cls.send_async_email(
            subject=subject,
            template_name="core/welcome_email.html",
            context=context,
            recipient_list=[email],
            email_type="welcome"
        )

    @classmethod
    def send_email_verification_email(cls, first_name: str, email: str, otp_code: str):
        subject = "Verify your BAHub account"
        context = {
            "first_name": first_name.strip().title(),
            "otp_code": otp_code,
            "subject": subject,
        }
        return cls.send_async_email(
            subject=subject,
            template_name="core/registration_otp.html",
            context=context,
            recipient_list=[email],
            email_type="verification"
        )

    @classmethod
    def send_password_reset_email(cls, first_name: str, email: str, reset_url: str):
        subject = "Reset your BAHub password"
        context = {
            "first_name": first_name.strip().title(),
            "reset_url": reset_url,
            "subject": subject,
        }
        return cls.send_async_email(
            subject=subject,
            template_name="core/password_reset.html",
            context=context,
            recipient_list=[email],
            email_type="password_reset"
        )

    @classmethod
    def send_account_approved_email(cls, first_name: str, email: str):
        subject = "Your BAHub account has been approved"
        frontend_url = getattr(settings, "FRONTEND_URL", "https://bahub-beta.netlify.app").rstrip("/")
        context = {
            "first_name": first_name.strip().title(),
            "login_url": f"{frontend_url}/login",
            "subject": subject,
        }
        return cls.send_async_email(
            subject=subject,
            template_name="core/account_approved.html",
            context=context,
            recipient_list=[email],
            email_type="account_approved"
        )

    @classmethod
    def send_payment_receipt_email(cls, first_name: str, email: str, organization_name: str, plan_name: str, amount: float, receipt_number: str, transaction_id: str, pdf_content=None):
        subject = "Payment received"
        context = {
            "first_name": first_name.strip().title(),
            "organization_name": organization_name,
            "plan_name": plan_name.upper(),
            "amount": amount,
            "receipt_number": receipt_number,
            "transaction_id": transaction_id or "N/A",
            "date": now().strftime("%Y-%m-%d"),
            "subject": subject,
        }
        attachments = None
        if pdf_content:
            attachments = [
                (f"receipt_{receipt_number}.pdf", pdf_content, "application/pdf")
            ]
        return cls.send_async_email(
            subject=subject,
            template_name="core/payment_receipt.html",
            context=context,
            recipient_list=[email],
            attachments=attachments,
            email_type="payment_receipt"
        )

    @classmethod
    def send_subscription_activated_email(cls, first_name: str, email: str, organization_name: str, plan_name: str, seats_limit: int, ai_credits_limit: int):
        subject = "Your subscription is active"
        context = {
            "first_name": first_name.strip().title(),
            "organization_name": organization_name,
            "plan_name": plan_name.upper(),
            "seats_limit": seats_limit,
            "ai_credits_limit": ai_credits_limit,
            "subject": subject,
        }
        return cls.send_async_email(
            subject=subject,
            template_name="core/subscription_activated.html",
            context=context,
            recipient_list=[email],
            email_type="subscription_activated"
        )

    @classmethod
    def send_organization_invitation_email(cls, first_name: str, email: str, organization_name: str, inviter_name: str, role: str, invite_url: str, expires_at_str: str):
        subject = f"Invitation to join {organization_name} on BAHub"
        context = {
            "first_name": first_name.strip().title() if first_name else "there",
            "organization_name": organization_name,
            "inviter_name": inviter_name,
            "role": role,
            "invite_url": invite_url,
            "expires_at": expires_at_str,
            "subject": subject,
        }
        return cls.send_async_email(
            subject=subject,
            template_name="core/organization_invitation.html",
            context=context,
            recipient_list=[email],
            email_type="invitation"
        )

    @classmethod
    def send_waitlist_confirmation_email(cls, email: str):
        subject = "BAHub: You are on the list!"
        context = {
            "first_name": "Early Supporter",
            "email": email,
            "subject": subject,
        }
        return cls.send_async_email(
            subject=subject,
            template_name="core/waitlist_confirmation.html",
            context=context,
            recipient_list=[email],
            email_type="waitlist_confirm"
        )

    @classmethod
    def send_waitlist_invite_email(cls, email: str):
        subject = "BAHub: Your Invitation to Join the Beta!"
        frontend_url = getattr(settings, "FRONTEND_URL", "https://bahub-beta.netlify.app").rstrip("/")
        invite_url = f"{frontend_url}/register?waitlist_bypass=true&email={email}"
        context = {
            "first_name": "Beta Subscriber",
            "email": email,
            "invite_url": invite_url,
            "subject": subject,
        }
        return cls.send_async_email(
            subject=subject,
            template_name="core/waitlist_invite.html",
            context=context,
            recipient_list=[email],
            email_type="waitlist_invite"
        )

    @classmethod
    def send_meeting_email(cls, meeting, is_update=False, recipient_list=None):
        if not recipient_list:
            return False
        subject = f"{'Updated: ' if is_update else ''}Meeting Scheduled: {meeting.title}"
        frontend_url = getattr(settings, "FRONTEND_URL", "https://bahub-beta.netlify.app").rstrip("/")
        
        meeting_room_url = f"https://meet.jit.si/bahub-{meeting.id}"
        dashboard_url = f"{frontend_url}/meetings"
        
        context = {
            "first_name": "Team Member",
            "title": f"Meeting {'Updated' if is_update else 'Scheduled'}",
            "message_intro": "You have been invited to a meeting in BAHub." if not is_update else "A meeting you are invited to in BAHub has been updated.",
            "meeting": meeting,
            "meeting_room_url": meeting_room_url,
            "dashboard_url": dashboard_url,
            "subject": subject,
        }
        return cls.send_async_email(
            subject=subject,
            template_name="core/meeting_notification.html",
            context=context,
            recipient_list=recipient_list,
            email_type="meeting"
        )
