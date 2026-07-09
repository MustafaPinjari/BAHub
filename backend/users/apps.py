from django.apps import AppConfig
import sys


class UsersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "users"

    def ready(self):
        # Prevent running this code during database migration commands
        if "migrate" in sys.argv or "makemigrations" in sys.argv:
            return

        try:
            from django.contrib.auth import get_user_model
            from django.db.utils import OperationalError, ProgrammingError
            User = get_user_model()
            
            # Check if superuser already exists
            if not User.objects.filter(is_superuser=True).exists():
                from organizations.models import Organization
                from users.models import UserPreference
                
                # Ensure Apex organization exists
                org, _ = Organization.objects.get_or_create(
                    name="Apex Business Solutions",
                    defaults={
                        "description": "Enterprise workspace for business analytics and project design.",
                        "email": "apex-workspace@bahub.local"
                    }
                )
                
                # Create default admin superuser
                admin = User.objects.create_superuser(
                    username="admin",
                    email="admin@bahub.local",
                    password="AdminP@ss123",
                    role="ADMIN",
                    organization=org,
                    first_name="Sarah",
                    last_name="Jenkins"
                )
                
                # Create user preferences
                UserPreference.objects.get_or_create(user=admin)
                print("--- Automatically seeded default superuser 'admin' ('AdminP@ss123') in production database ---")
        except (OperationalError, ProgrammingError, Exception):
            # Silence errors if tables don't exist yet during initial setup
            pass
