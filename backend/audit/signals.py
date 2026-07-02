from django.db.models.signals import pre_save, post_save, post_delete
from django.dispatch import receiver
from projects.models import Project
from requirements.models import Requirement
from stories.models import UserStory
from risks.models import Risk
from stakeholders.models import Stakeholder
from meetings.models import Meeting

from .models import AuditLog
from .context import get_current_user, get_current_ip, get_current_ua

AUDITED_MODELS = [Project, Requirement, UserStory, Risk, Stakeholder, Meeting]
EXCLUDED_FIELDS = ["id", "created_at", "updated_at"]

@receiver(pre_save)
def track_old_state(sender, instance, **kwargs):
    """
    Tracks and caches the old state of the model before save.
    """
    if sender not in AUDITED_MODELS:
        return

    # Check if instance is being updated (exists in DB)
    if instance.id:
        try:
            old_instance = sender.objects.get(id=instance.id)
            # Store the old values temporarily on the instance object
            instance._old_state = {
                field.name: field.value_to_string(old_instance)
                for field in sender._meta.fields
                if field.name not in EXCLUDED_FIELDS
            }
        except sender.DoesNotExist:
            pass

@receiver(post_save)
def log_resource_save(sender, instance, created, **kwargs):
    """
    Logs resource creation or update. Computes delta diffs for updates.
    """
    if sender not in AUDITED_MODELS:
        return

    # 1. Fetch Request Context
    user = get_current_user()
    ip = get_current_ip()
    ua = get_current_ua()

    # 2. Determine Scope Organization and Project context
    org = None
    proj = None

    if hasattr(instance, "organization") and instance.organization:
        org = instance.organization
    elif hasattr(instance, "project") and instance.project:
        proj = instance.project
        org = proj.organization

    # Standard fallback if project is associated with the model but organization is not direct
    if not org and proj:
        org = proj.organization

    if not org:
        # Cannot log without tenant context
        return

    # 3. Build Changes Diff
    changes = {}
    action = "CREATE" if created else "UPDATE"

    if created:
        for field in sender._meta.fields:
            if field.name in EXCLUDED_FIELDS:
                continue
            val = field.value_to_string(instance)
            changes[field.name] = {"old": None, "new": val}
    else:
        old_state = getattr(instance, "_old_state", {})
        for field in sender._meta.fields:
            if field.name in EXCLUDED_FIELDS:
                continue
            old_val = old_state.get(field.name)
            new_val = field.value_to_string(instance)
            if old_val != new_val:
                changes[field.name] = {"old": old_val, "new": new_val}

        if not changes:
            # Skip if no fields actually modified
            return

        # Detect soft delete: if 'is_deleted' was changed from False/None to True
        if "is_deleted" in changes:
            old_del = changes["is_deleted"]["old"]
            new_del = changes["is_deleted"]["new"]
            if (old_del == "False" or old_del is None or old_del == "") and new_del == "True":
                action = "DELETE"

    # Determine Resource Display Name
    resource_name = ""
    for name_field in ["req_id", "title", "name", "username"]:
        if hasattr(instance, name_field) and getattr(instance, name_field):
            resource_name = str(getattr(instance, name_field))
            break

    # Safely convert user ID if it is a hex string to avoid SQLite constraint issues
    user_id = None
    if user and hasattr(user, "id"):
        import uuid
        user_id = user.id
        if isinstance(user_id, str):
            try:
                user_id = uuid.UUID(user_id)
            except ValueError:
                pass

    # Save Audit Log entry
    try:
        AuditLog.objects.create(
            organization=org,
            project=proj,
            user_id=user_id,
            user_username=user.username if user else "system",
            action=action,
            resource_type=sender.__name__,
            resource_id=str(instance.id),
            resource_name=resource_name,
            changes=changes,
            ip_address=ip,
            user_agent=ua
        )
    except Exception as e:
        import logging
        logger = logging.getLogger("django")
        logger.warning(f"Failed to log save audit: {e}")

@receiver(post_delete)
def log_resource_delete(sender, instance, **kwargs):
    """
    Logs resource deletion, archiving final state.
    """
    if sender not in AUDITED_MODELS:
        return

    user = get_current_user()
    ip = get_current_ip()
    ua = get_current_ua()

    org = None
    proj = None

    if hasattr(instance, "organization") and instance.organization:
        org = instance.organization
    elif hasattr(instance, "project") and instance.project:
        proj = instance.project
        org = proj.organization

    if not org and proj:
        org = proj.organization

    if not org:
        return

    # Log deleted final state
    changes = {}
    for field in sender._meta.fields:
        if field.name in EXCLUDED_FIELDS:
            continue
        val = field.value_to_string(instance)
        changes[field.name] = {"old": val, "new": None}

    resource_name = ""
    for name_field in ["req_id", "title", "name", "username"]:
        if hasattr(instance, name_field) and getattr(instance, name_field):
            resource_name = str(getattr(instance, name_field))
            break

    # Safely convert user ID if it is a hex string to avoid SQLite constraint issues
    user_id = None
    if user and hasattr(user, "id"):
        import uuid
        user_id = user.id
        if isinstance(user_id, str):
            try:
                user_id = uuid.UUID(user_id)
            except ValueError:
                pass

    try:
        AuditLog.objects.create(
            organization=org,
            project=proj,
            user_id=user_id,
            user_username=user.username if user else "system",
            action="DELETE",
            resource_type=sender.__name__,
            resource_id=str(instance.id),
            resource_name=resource_name,
            changes=changes,
            ip_address=ip,
            user_agent=ua
        )
    except Exception as e:
        import logging
        logger = logging.getLogger("django")
        logger.warning(f"Failed to log delete audit: {e}")
