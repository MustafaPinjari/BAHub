import os
import time
import uuid
import logging
import threading
import smtplib
from pathlib import Path
from email import encoders
from email.mime.base import MIMEBase
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from django.core.mail.message import SafeMIMEMultipart

from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.core.signing import TimestampSigner, SignatureExpired, BadSignature
from django.utils.timezone import now

# Brevo API support (fallback when SMTP is blocked)
try:
    from sib_api_v3_sdk import ApiClient, Configuration, TransactionalEmailsApi, SendSmtpEmail, SendSmtpEmailSender
    BREVO_AVAILABLE = True
except ImportError:
    BREVO_AVAILABLE = False

# Resolved once at import time — works on both local and Render
BANNER_PATH = Path(__file__).resolve().parent / "static" / "core" / "email_banner.png"
COMING_SOON_PATH = Path(__file__).resolve().parent / "static" / "core" / "CommingSoon.png"

logger = logging.getLogger("django")

class EmailService:
    """
    Centralized, enterprise-grade, thread-safe asynchronous email delivery service
    designed to maximize inbox placement for BAHub.
    """

    # Read sender config from Django settings so switching email providers
    # only requires updating env vars — no code change needed.
    @classmethod
    def _default_sender(cls):
        from django.conf import settings as _s
        from_email = getattr(_s, "DEFAULT_FROM_EMAIL", "noreply@bahub.com")
        # Wrap in a display name if it's a bare address
        if "<" not in from_email:
            return f"BAHub Team <{from_email}>"
        return from_email

    @classmethod
    def _support_email(cls):
        from django.conf import settings as _s
        return getattr(_s, "DEFAULT_FROM_EMAIL", "bahubofficial@gmail.com").split("<")[-1].rstrip(">")

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
    def _send_via_brevo_api(cls, subject, html_content, text_content, recipient_list, from_email, attachments):
        """
        Fallback: Send via Brevo API when SMTP is blocked (e.g., Render free tier).
        Uses HTTPS (port 443) which isn't blocked.
        """
        if not BREVO_AVAILABLE:
            raise ImportError("Brevo SDK not installed. Add sib-api-v3-sdk to requirements.txt")

        api_key = os.getenv("BREVO_API_KEY")
        if not api_key:
            raise ValueError("BREVO_API_KEY environment variable not set")

        configuration = Configuration()
        configuration.api_key['api-key'] = api_key
        api_client = ApiClient(configuration)
        api_instance = TransactionalEmailsApi(api_client)

        # Parse sender email (handle both "Name <email>" and just "email" formats)
        if "<" in from_email and ">" in from_email:
            # Format: "Name <email@example.com>"
            sender_name = from_email.split("<")[0].strip()
            sender_email = from_email.split("<")[-1].rstrip(">")
        else:
            # Format: just "email@example.com"
            sender_email = from_email.strip()
            sender_name = "BAHub Team"

        if not sender_name or "@" in sender_name:
            sender_name = "BAHub Team"

        send_smtp_email = SendSmtpEmail()
        send_smtp_email.sender = SendSmtpEmailSender(email=sender_email, name=sender_name)
        send_smtp_email.to = [{"email": email} for email in recipient_list]
        send_smtp_email.subject = subject
        send_smtp_email.html_content = html_content
        send_smtp_email.text_content = text_content

        # Handle attachments (base64 encoded)
        if attachments:
            import base64
            send_smtp_email.attachment = []
            for name, data, mime_type in attachments:
                send_smtp_email.attachment.append({
                    "name": name,
                    "content": base64.b64encode(data).decode('utf-8'),
                })

        try:
            api_instance.send_transac_email(send_smtp_email)
            return True
        except Exception as e:
            logger.error(f"[EmailService] Brevo API failed: {e}")
            raise

    @classmethod
    def _send_email_worker(cls, subject, template_name, context, recipient_list, from_email, attachments, headers, email_type, max_retries=3):
        """
        Background worker: renders templates, builds a correct multipart/related
        MIME structure so CID images appear inline (never as attachments), then
        delivers via Django's configured SMTP backend with exponential backoff.
        Falls back to Brevo API if SMTP fails.

        MIME structure:
          multipart/mixed          ← outer (allows PDF attachments)
            multipart/alternative  ← plain-text + html wrapper
              text/plain
              multipart/related    ← HTML + inline images
                text/html
                image/png  (email_banner,   Content-ID: <email_banner>)
                image/png  (coming_soon,    Content-ID: <coming_soon_banner>, waitlist only)
            application/pdf  (optional receipt attachment)
        """
        retry_count = 0
        success = False
        start_time = now()
        use_brevo_api = os.getenv("USE_BREVO_API", "False").lower() in ("true", "1", "yes")

        while retry_count < max_retries and not success:
            try:
                # ── Render templates ──────────────────────────────────────
                html_content = render_to_string(template_name, context)
                txt_name = template_name.replace(".html", ".txt")
                try:
                    text_content = render_to_string(txt_name, context)
                except Exception:
                    text_content = strip_tags(html_content)

                # ── Try Brevo API first if configured or forced ─────────────
                if use_brevo_api or (not use_brevo_api and retry_count >= 1):
                    try:
                        cls._send_via_brevo_api(subject, html_content, text_content, recipient_list, from_email or cls._default_sender(), attachments)
                        success = True
                        logger.info(
                            f"[EmailService] Delivered via Brevo API. Type: {email_type} | "
                            f"Subject: '{subject}' | Recipients: {recipient_list} | "
                            f"Attempts: {retry_count + 1} | Time: {now() - start_time}"
                        )
                        break
                    except Exception as api_error:
                        logger.warning(f"[EmailService] Brevo API attempt {retry_count + 1} failed: {api_error}")
                        if use_brevo_api:
                            raise  # If Brevo is forced, don't fall back to SMTP

                # ── Headers ───────────────────────────────────────────────
                msg_id = f"<{uuid.uuid4()}@{cls.DOMAIN}>"
                extra_headers = {
                    "Reply-To": cls._default_sender(),
                    "Message-ID": msg_id,
                    # NOTE: Do NOT add X-Mailer — some filters treat custom
                    # mailer strings as a spam/promotions signal.
                }

                # Transactional emails (invitations, OTP, approvals, etc.) must
                # NOT carry List-Unsubscribe — Gmail uses that header as its
                # primary signal to route mail to the Promotions tab.
                # Only add it for genuine bulk marketing sends.
                BULK_EMAIL_TYPES = {"waitlist_confirm"}
                if email_type in BULK_EMAIL_TYPES:
                    extra_headers["List-Unsubscribe"] = (
                        f"<mailto:{cls._support_email()}?subject=unsubscribe>"
                    )
                    extra_headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click"

                if headers:
                    extra_headers.update(headers)


                # ── Build inline images list ──────────────────────────────
                inline_images = []
                if BANNER_PATH.exists() and context.get("has_banner", True):
                    inline_images.append((BANNER_PATH, "email_banner", "email_banner.png"))
                if email_type in ["waitlist_confirm", "waitlist_invite"] and COMING_SOON_PATH.exists():
                    inline_images.append((COMING_SOON_PATH, "coming_soon_banner", "CommingSoon.png"))

                # ── Assemble MIME ─────────────────────────────────────────
                # Outer container: SafeMIMEMultipart (Django's subclass) so that
                # Django's SMTP backend can call as_bytes(linesep='\r\n') on it.
                outer = SafeMIMEMultipart("mixed")
                outer["Subject"] = subject
                outer["From"]    = from_email or cls._default_sender()
                outer["To"]      = ", ".join(recipient_list)
                for k, v in extra_headers.items():
                    outer[k] = v

                # multipart/alternative wraps plain-text and the related block
                alternative = MIMEMultipart("alternative")

                # Plain-text part
                alternative.attach(MIMEText(text_content, "plain", "utf-8"))

                if inline_images:
                    # multipart/related: html + inline images
                    related = MIMEMultipart("related")
                    related.attach(MIMEText(html_content, "html", "utf-8"))
                    for img_path, cid, filename in inline_images:
                        with open(img_path, "rb") as f:
                            img = MIMEImage(f.read(), _subtype="png")
                        img.add_header("Content-ID", f"<{cid}>")
                        img.add_header("Content-Disposition", "inline", filename=filename)
                        related.attach(img)
                    alternative.attach(related)
                else:
                    # No inline images — plain html is fine
                    alternative.attach(MIMEText(html_content, "html", "utf-8"))

                outer.attach(alternative)

                # Optional file attachments (e.g. PDF receipts)
                if attachments:
                    for name, data, mime_type in attachments:
                        main_type, sub_type = mime_type.split("/", 1)
                        part = MIMEBase(main_type, sub_type)
                        part.set_payload(data)
                        encoders.encode_base64(part)
                        part.add_header("Content-Disposition", "attachment", filename=name)
                        outer.attach(part)

                # ── Send via Django's EmailMessage ─────────────────────────
                # Uses Django's EmailMessage as the transport layer so it works
                # with ANY configured backend (SMTP, console, locmem).
                # outer is a SafeMIMEMultipart so Django can call
                # as_bytes(linesep='\r\n') on it without TypeError.
                from django.core.mail import EmailMessage

                email_msg = EmailMessage(
                    subject=subject,
                    body="",  # body is carried inside outer MIME tree
                    from_email=from_email or cls._default_sender(),
                    to=recipient_list,
                    headers=extra_headers,
                )
                # Replace Django's auto-built message with our pre-built MIME tree.
                email_msg.message = lambda: outer  # type: ignore[method-assign]
                email_msg.send(fail_silently=False)
                success = True

                logger.info(
                    f"[EmailService] Delivered successfully via SMTP. Type: {email_type} | "
                    f"Subject: '{subject}' | Recipients: {recipient_list} | "
                    f"Attempts: {retry_count + 1} | Time: {now() - start_time}"
                )

            except Exception as e:
                retry_count += 1
                logger.warning(
                    f"[EmailService] Failed attempt {retry_count}/{max_retries} to send "
                    f"'{subject}' to {recipient_list}. Error: {e}"
                )
                if retry_count < max_retries:
                    time.sleep(2 ** (retry_count - 1))
                else:
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
