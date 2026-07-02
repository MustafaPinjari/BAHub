from django.contrib.auth import get_user_model
from organizations.models import Organization
from billing.models import TenantSubscription
from django.db import transaction

User = get_user_model()

def provision_user_organization(user_info):
    """
    Hook triggered by django-saml2-auth after user creation.
    Associates the user with an organization based on their email domain,
    creating the organization (and upgrading to ENTERPRISE subscription) if needed.
    """
    # 1. Extract email and username
    email = user_info.get("email", "")
    if isinstance(email, (list, tuple)) and email:
        email = email[0]
    if not email:
        return None

    username = user_info.get("username", "")
    if isinstance(username, (list, tuple)) and username:
        username = username[0]
    if not username:
        username = email.split("@")[0]

    # 2. Get the user from the database
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return None

    # 3. Determine organization name and website domain from email
    domain = email.split("@")[-1].lower()
    # Skip common free email domains
    if domain in ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "aol.com"]:
        org_name = f"{username.capitalize()} Personal Org"
    else:
        org_name = domain.split(".")[0].capitalize()

    with transaction.atomic():
        # Check if organization exists by name or website domain
        org = Organization.objects.filter(name__iexact=org_name).first()
        if not org:
            org = Organization.objects.filter(website__icontains=domain).first()

        if not org:
            # Create organization
            org = Organization.objects.create(
                name=f"{org_name} Org",
                website=f"https://{domain}",
                email=email,
            )

        # Associate user with organization
        user.organization = org
        
        # Set user's role to ADMIN if they are the first user in the org, else DEVELOPER
        if org.users.count() == 0:
            user.role = User.ADMIN
        else:
            user.role = User.DEVELOPER
        user.save()

        # Retrieve or create TenantSubscription and upgrade to ENTERPRISE since they are logging via Enterprise SSO
        subscription, created = TenantSubscription.objects.get_or_create(
            organization=org,
            defaults={
                "plan_tier": "ENTERPRISE",
                "seats_limit": 1000,
                "is_active": True,
                "ai_credits_limit": 10000,
                "ai_credits_used": 0,
            }
        )
        if not created and subscription.plan_tier != "ENTERPRISE":
            subscription.plan_tier = "ENTERPRISE"
            subscription.seats_limit = 1000
            subscription.ai_credits_limit = 10000
            subscription.save()

    return user
