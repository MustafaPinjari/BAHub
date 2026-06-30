import os
import django

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "bahub_backend.settings")
django.setup()

from django.contrib.auth import get_user_model
from organizations.models import Organization
from users.models import UserPreference

User = get_user_model()

def create_demo_data():
    print("Initializing demo workspace setup...")
    
    # 1. Create or get organization
    org, created = Organization.objects.get_or_create(
        name="Apex Business Solutions",
        defaults={
            "description": "Enterprise workspace for business analytics and project design.",
            "timezone": "UTC",
            "email": "apex-workspace@bahub.local",
            "phone": "+1 800 555 0199",
            "website": "https://apex-analytics.local",
            "address": "100 Innovation Way, Suite 400, Tech City",
        }
    )
    if created:
        print(f"Created organization: {org.name}")
    else:
        print(f"Found existing organization: {org.name}")

    # 2. Define users to create
    demo_users = [
        {
            "username": "admin",
            "email": "admin@bahub.local",
            "password": "AdminP@ss123",
            "first_name": "Sarah",
            "last_name": "Jenkins",
            "role": "ADMIN",
        },
        {
            "username": "analyst",
            "email": "analyst@bahub.local",
            "password": "AnalystP@ss123",
            "first_name": "David",
            "last_name": "Miller",
            "role": "BUSINESS_ANALYST",
        }
    ]

    # 3. Create users
    for user_info in demo_users:
        username = user_info["username"]
        email = user_info["email"]
        password = user_info["password"]
        
        user, u_created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "first_name": user_info["first_name"],
                "last_name": user_info["last_name"],
                "role": user_info["role"],
                "organization": org,
                "is_staff": user_info["role"] == "ADMIN",
                "is_superuser": user_info["role"] == "ADMIN",
            }
        )
        
        if u_created:
            user.set_password(password)
            user.save()
            
            # Setup preferences
            UserPreference.objects.get_or_create(user=user)
            print(f"Created user: {username} (Password: {password}, Role: {user_info['role']})")
        else:
            print(f"User already exists: {username}")

    # 4. Seed default permissions registry
    from permissions.models import Permission
    default_perms = [
        ("Create Project", "create_project", "Ability to create new projects."),
        ("Edit Project", "edit_project", "Ability to update project configurations."),
        ("Delete Project", "delete_project", "Ability to soft delete projects."),
        ("Create Team", "create_team", "Ability to build new teams."),
        ("Edit Team", "edit_team", "Ability to edit team details and membership."),
        ("Delete Team", "delete_team", "Ability to delete teams."),
        ("Manage Permissions", "manage_permissions", "Ability to configure role-permission assignments."),
        ("Create Requirement", "create_requirement", "Ability to add requirement records."),
        ("Edit Requirement", "edit_requirement", "Ability to update requirements."),
        ("Delete Requirement", "delete_requirement", "Ability to remove requirement entries."),
        ("Approve BRD", "approve_brd", "Ability to authorize business requirements documents."),
    ]
    for name, codename, desc in default_perms:
        perm, p_created = Permission.objects.get_or_create(
            codename=codename,
            defaults={"name": name, "description": desc}
        )
        if p_created:
            print(f"Registered permission: {codename}")

    print("Demo workspace initialization completed successfully.")

if __name__ == "__main__":
    create_demo_data()
