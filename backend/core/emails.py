from core.email_service import EmailService

def send_html_email(subject, template_name, context, recipient_list, from_email=None, attachments=None):
    """
    Backward-compatibility wrapper for send_html_email.
    """
    return EmailService.send_async_email(
        subject=subject,
        template_name=template_name,
        context=context,
        recipient_list=recipient_list,
        from_email=from_email,
        attachments=attachments,
        email_type="notification"
    )

def send_meeting_email(meeting, is_update=False, recipient_list=None):
    """
    Backward-compatibility wrapper for send_meeting_email.
    """
    return EmailService.send_meeting_email(meeting, is_update, recipient_list)

def send_subscription_verification_email(organization_name, plan_name, seats_limit, ai_credits_limit, verify_url, recipient_list):
    """
    Backward-compatibility wrapper for send_subscription_verification_email.
    """
    context = {
        "organization_name": organization_name,
        "plan_name": plan_name.upper(),
        "seats_limit": seats_limit,
        "ai_credits_limit": ai_credits_limit,
        "verify_url": verify_url,
        "first_name": "Administrator",
    }
    return EmailService.send_async_email(
        subject=f"BAHub: Verify Your {plan_name.capitalize()} Subscription Upgrade",
        template_name="core/subscription_verification.html",
        context=context,
        recipient_list=recipient_list,
        email_type="subscription_verification"
    )

def send_organization_invitation_email(invite, inviter):
    """
    Backward-compatibility wrapper for send_organization_invitation_email.
    """
    from django.conf import settings
    frontend_url = getattr(settings, "FRONTEND_URL", "https://bahub-beta.netlify.app").rstrip("/")
    invite_url = f"{frontend_url}/register?invite={invite.token}"
    role_display = invite.role.replace("_", " ").title()
    inviter_name = inviter.get_full_name() or inviter.username
    expires_at_str = invite.expires_at.strftime("%Y-%m-%d")

    return EmailService.send_organization_invitation_email(
        first_name="",
        email=invite.email,
        organization_name=invite.organization.name,
        inviter_name=inviter_name,
        role=role_display,
        invite_url=invite_url,
        expires_at_str=expires_at_str
    )

def send_registration_otp_email(username, email, otp_code):
    """
    Backward-compatibility wrapper for send_registration_otp_email.
    """
    return EmailService.send_email_verification_email(
        first_name=username,
        email=email,
        otp_code=otp_code
    )

def send_payment_receipt_email(username, email, organization_name, plan_name, amount, receipt_number, transaction_id, pdf_content):
    """
    Backward-compatibility wrapper for send_payment_receipt_email.
    """
    return EmailService.send_payment_receipt_email(
        first_name=username,
        email=email,
        organization_name=organization_name,
        plan_name=plan_name,
        amount=amount,
        receipt_number=receipt_number,
        transaction_id=transaction_id,
        pdf_content=pdf_content
    )

def send_waitlist_confirmation_email(email):
    """
    Backward-compatibility wrapper for send_waitlist_confirmation_email.
    """
    return EmailService.send_waitlist_confirmation_email(email)

def send_waitlist_invite_email(email):
    """
    Backward-compatibility wrapper for send_waitlist_invite_email.
    """
    return EmailService.send_waitlist_invite_email(email)


def send_password_reset_email(username: str, email: str, uid: str, token: str):
    """
    Send a password reset link to the user.
    The link redirects to the frontend /reset-password?uid=...&token=... route.
    """
    from django.conf import settings
    frontend_url = getattr(settings, "FRONTEND_URL", "https://bahub-beta.netlify.app").rstrip("/")
    reset_url = f"{frontend_url}/reset-password?uid={uid}&token={token}"

    return EmailService.send_async_email(
        subject="BAHub — Reset Your Password",
        template_name="core/password_reset.html",
        context={
            "first_name": username,
            "reset_url": reset_url,
            "expiry_hours": 24,
        },
        recipient_list=[email],
        email_type="password_reset",
    )

