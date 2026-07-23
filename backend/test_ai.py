import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bahub_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from srs.ai_integration import ai_service
from documents.models import BusinessDocument
from projects.models import Project
import asyncio

User = get_user_model()
user = User.objects.first()
user_org = user.organization
project = Project.objects.first()

context = {
    "project_name": project.name if project else "",
    "project_description": project.description if project else "",
    "stakeholders": {},
    "requirements": [],
    "user_stories": []
}

async def run():
    print(await ai_service.generate_full_document("BRD", "test", context, user_org, user))

asyncio.run(run())
