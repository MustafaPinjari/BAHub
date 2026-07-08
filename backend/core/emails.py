import os
import logging
from pathlib import Path
from email.mime.image import MIMEImage
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

logger = logging.getLogger("django")

def send_html_email(subject, template_name, context, recipient_list, from_email=None):
    """
    Utility to send a beautifully styled HTML email with an inline logo/banner attachment.
    """
    if from_email is None:
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@bahub.com")
        
    context["subject"] = subject
    context["has_banner"] = True
    
    try:
        # Render HTML
        html_content = render_to_string(template_name, context)
        # Try to render text content from .txt template if it exists, fallback to stripping tags
        text_template_name = template_name.replace(".html", ".txt")
        try:
            text_content = render_to_string(text_template_name, context)
        except Exception:
            text_content = strip_tags(html_content)
        
        msg = EmailMultiAlternatives(subject, text_content, from_email, recipient_list)
        msg.attach_alternative(html_content, "text/html")
        
        # Attach the marketing banner as inline image (CID)
        banner_path = Path(settings.BASE_DIR).parent / "frontend" / "src" / "assets" / "email_banner.png"
        if banner_path.exists():
            with open(banner_path, "rb") as f:
                mime_image = MIMEImage(f.read())
                mime_image.add_header("Content-ID", "<email_banner>")
                mime_image.add_header("Content-Disposition", "inline", filename="email_banner.png")
                msg.attach(mime_image)
        else:
            logger.warning(f"Email banner image not found at: {banner_path}")
            context["has_banner"] = False
            # Re-render without banner to avoid broken image symbol in some clients
            html_content = render_to_string(template_name, context)
            msg = EmailMultiAlternatives(subject, text_content, from_email, recipient_list)
            msg.attach_alternative(html_content, "text/html")

        msg.send(fail_silently=False)
        return True
    except Exception as e:
        logger.error(f"Failed to send email '{subject}' to {recipient_list}: {e}")
        return False


def send_meeting_email(meeting, is_update=False, recipient_list=None):
    """
    Send meeting scheduling & updates notifications email.
    """
    if not recipient_list:
        return False
        
    subject = f"{'Updated: ' if is_update else ''}Meeting Scheduled: {meeting.title}"
    
    frontend_url = getattr(settings, "FRONTEND_URL", "https://bahub-beta.netlify.app")
    frontend_url = frontend_url.rstrip("/")
    
    meeting_room_url = f"https://meet.jit.si/bahub-{meeting.id}"
    dashboard_url = f"{frontend_url}/meetings"
    
    context = {
        "title": f"Meeting {'Updated' if is_update else 'Scheduled'}",
        "message_intro": "You have been invited to a meeting in BAHub." if not is_update else "A meeting you are invited to in BAHub has been updated.",
        "meeting": meeting,
        "meeting_room_url": meeting_room_url,
        "dashboard_url": dashboard_url,
    }
    
    return send_html_email(
        subject=subject,
        template_name="core/meeting_notification.html",
        context=context,
        recipient_list=recipient_list
    )


def send_subscription_verification_email(organization_name, plan_name, seats_limit, ai_credits_limit, verify_url, recipient_list):
    """
    Send subscription plan upgrade verification link.
    """
    subject = f"BAHub: Verify Your {plan_name.capitalize()} Subscription Upgrade"
    
    context = {
        "organization_name": organization_name,
        "plan_name": plan_name.upper(),
        "seats_limit": seats_limit,
        "ai_credits_limit": ai_credits_limit,
        "verify_url": verify_url,
    }
    
    return send_html_email(
        subject=subject,
        template_name="core/subscription_verification.html",
        context=context,
        recipient_list=recipient_list
    )


def send_organization_invitation_email(invite, inviter):
    """
    Send workspace team member registration invitation link.
    """
    frontend_url = getattr(settings, "FRONTEND_URL", "https://bahub-beta.netlify.app")
    frontend_url = frontend_url.rstrip("/")
    invite_url = f"{frontend_url}/register?invite={invite.token}"
    
    subject = f"Invitation to join {invite.organization.name} on BAHub"
    
    # Formatted role name
    role_display = invite.role.replace("_", " ").title()
    
    context = {
        "organization_name": invite.organization.name,
        "inviter_name": inviter.get_full_name() or inviter.username,
        "role": role_display,
        "invite_url": invite_url,
        "expires_at": invite.expires_at.strftime("%Y-%m-%d"),
    }
    
    return send_html_email(
        subject=subject,
        template_name="core/organization_invitation.html",
        context=context,
        recipient_list=[invite.email]
    )


def send_registration_otp_email(username, email, otp_code):
    """
    Send email verification OTP.
    """
    subject = "BAHub: Verify your email address"
    context = {
        "username": username,
        "otp_code": otp_code,
    }
    return send_html_email(
        subject=subject,
        template_name="core/registration_otp.html",
        context=context,
        recipient_list=[email]
    )

