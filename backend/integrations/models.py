from django.db import models
from django.conf import settings
from core.models import BaseModel
from projects.models import Project
from cryptography.fernet import Fernet
import base64
import hashlib

class EncryptedCharField(models.CharField):
    description = "An encrypted character field that stores values encrypted in the DB"

    def get_fernet(self):
        # Derive a 32-byte url-safe base64 key from Django's SECRET_KEY
        key_bytes = settings.SECRET_KEY.encode('utf-8')
        h = hashlib.sha256(key_bytes).digest()
        return Fernet(base64.urlsafe_b64encode(h))

    def get_prep_value(self, value):
        value = super().get_prep_value(value)
        if value is None:
            return value
        # Encrypt
        f = self.get_fernet()
        try:
            return f.encrypt(value.encode('utf-8')).decode('utf-8')
        except Exception:
            return value

    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        # Decrypt
        f = self.get_fernet()
        try:
            return f.decrypt(value.encode('utf-8')).decode('utf-8')
        except Exception:
            # Fallback if decryption fails (e.g. data was stored plaintext before encryption)
            return value

    def to_python(self, value):
        if value is None or not isinstance(value, str):
            return value
        if value.startswith('gAAAAA'):
            f = self.get_fernet()
            try:
                return f.decrypt(value.encode('utf-8')).decode('utf-8')
            except Exception:
                pass
        return value


class IntegrationConfig(BaseModel):
    project = models.OneToOneField(
        Project,
        on_delete=models.CASCADE,
        related_name="integration_config"
    )
    
    # Jira Connection Details
    jira_url = models.URLField(max_length=255, blank=True, null=True)
    jira_username = models.CharField(max_length=255, blank=True, null=True)
    jira_api_token = EncryptedCharField(max_length=1024, blank=True, null=True)
    jira_project_key = models.CharField(max_length=50, blank=True, null=True)
    
    # Confluence Connection Details
    confluence_url = models.URLField(max_length=255, blank=True, null=True)
    confluence_username = models.CharField(max_length=255, blank=True, null=True)
    confluence_api_token = EncryptedCharField(max_length=1024, blank=True, null=True)
    confluence_space_key = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = "integration_configs"

    def __str__(self):
        return f"Integration Config - {self.project.name}"


class SyncLog(BaseModel):
    SYNC_TYPES = [
        ("JIRA_STORIES", "Jira User Stories Sync"),
        ("CONFLUENCE_DOC", "Confluence Document Publish"),
    ]
    STATUS_CHOICES = [
        ("SUCCESS", "Success"),
        ("FAILED", "Failed"),
    ]
    
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="sync_logs"
    )
    sync_type = models.CharField(max_length=50, choices=SYNC_TYPES)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES)
    message = models.TextField(blank=True)
    triggered_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="sync_logs"
    )
    
    class Meta:
        db_table = "integration_sync_logs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.sync_type} - {self.status} ({self.created_at})"

class FigmaDesign(BaseModel):
    requirement = models.ForeignKey(
        "requirements.Requirement",
        on_delete=models.CASCADE,
        related_name="figma_designs"
    )
    figma_file_id = models.CharField(max_length=255)
    figma_node_id = models.CharField(max_length=255)
    name = models.CharField(max_length=255, blank=True)
    image_url = models.URLField(max_length=2000, blank=True)
    last_synced = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "integration_figma_designs"
        unique_together = ("figma_file_id", "figma_node_id", "requirement")

    def __str__(self):
        return f"Figma {self.figma_file_id}/{self.figma_node_id} -> {self.requirement.title}"

class CodeCommit(BaseModel):
    requirement = models.ForeignKey(
        "requirements.Requirement",
        on_delete=models.CASCADE,
        related_name="code_commits"
    )
    repository_url = models.URLField(max_length=2000)
    commit_hash = models.CharField(max_length=40)
    commit_message = models.TextField(blank=True)
    author_name = models.CharField(max_length=255, blank=True)
    pr_url = models.URLField(max_length=2000, blank=True, null=True)
    branch_name = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "integration_code_commits"
        unique_together = ("repository_url", "commit_hash", "requirement")

    def __str__(self):
        return f"Commit {self.commit_hash[:7]} -> {self.requirement.title}"
