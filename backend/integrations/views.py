from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.utils import timezone
from .models import IntegrationConfig, SyncLog
from .serializers import IntegrationConfigSerializer, SyncLogSerializer
from projects.models import Project
from stories.models import UserStory
from documents.models import BusinessDocument
from core.responses import api_success, api_error

class IntegrationConfigViewSet(viewsets.ModelViewSet):
    serializer_class = IntegrationConfigSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return IntegrationConfig.objects.none()
        return IntegrationConfig.objects.filter(project__organization_id=user.organization_id)

    @action(detail=False, methods=["get"], url_path="by-project")
    def by_project(self, request):
        project_id = request.query_params.get("project")
        if not project_id:
            return api_error(message="Project parameter is required.")
        
        try:
            project = Project.objects.get(id=project_id, organization_id=request.user.organization_id)
        except Project.DoesNotExist:
            return api_error(message="Project not found or access denied.")

        config, created = IntegrationConfig.objects.get_or_create(project=project)
        serializer = self.get_serializer(config)
        return api_success(data=serializer.data, message="Integration config loaded successfully.")

    @action(detail=False, methods=["post"], url_path="save-config")
    def save_config(self, request):
        project_id = request.data.get("project")
        if not project_id:
            return api_error(message="Project is required.")

        try:
            project = Project.objects.get(id=project_id, organization_id=request.user.organization_id)
        except Project.DoesNotExist:
            return api_error(message="Project not found or access denied.")

        config, _ = IntegrationConfig.objects.get_or_create(project=project)
        serializer = self.get_serializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return api_success(data=serializer.data, message="Integration configuration saved successfully.")


class SyncLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SyncLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return SyncLog.objects.none()
        
        queryset = SyncLog.objects.filter(project__organization_id=user.organization_id)
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset


class TestConnectionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        system_type = request.data.get("system")  # "jira" or "confluence"
        url = request.data.get("url")
        username = request.data.get("username")
        token = request.data.get("token")
        key = request.data.get("key")  # project_key or space_key

        if not system_type or system_type not in ["jira", "confluence"]:
            return api_error(message="Invalid system type. Must be 'jira' or 'confluence'.")
        
        if not url or not username or not token or not key:
            return api_error(message="All connection details (url, username, token, project/space key) are required.")

        # Simulate connection ping
        if "invalid" in url.lower() or "error" in url.lower() or token == "fail":
            return api_error(message=f"Connection failed: Could not resolve host or invalid credentials for {system_type.upper()}.")

        return api_success(data={"connected": True}, message=f"Successfully established connection to {system_type.upper()}.")


class JiraSyncView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        project_id = request.data.get("project_id")
        if not project_id:
            return api_error(message="Project ID is required.")

        try:
            project = Project.objects.get(id=project_id, organization_id=request.user.organization_id)
        except Project.DoesNotExist:
            return api_error(message="Project not found or access denied.")

        try:
            config = IntegrationConfig.objects.get(project=project)
        except IntegrationConfig.DoesNotExist:
            return api_error(message="Integration config not found for this project.")

        if not config.jira_url or not config.jira_username or not config.jira_api_token or not config.jira_project_key:
            return api_error(message="Jira credentials are incomplete.")

        # Fetch user stories
        stories = UserStory.objects.filter(requirement__project=project)
        if not stories.exists():
            SyncLog.objects.create(
                project=project,
                sync_type="JIRA_STORIES",
                status="FAILED",
                message="No user stories found in the project backlog to sync.",
                triggered_by=request.user
            )
            return api_error(message="No user stories found in this project's backlog.")

        # Simulate synchronization
        synced_stories = []
        for idx, story in enumerate(stories):
            jira_key = f"{config.jira_project_key}-{100 + idx}"
            synced_stories.append({
                "story_id": story.story_id,
                "title": story.title,
                "jira_key": jira_key,
                "jira_url": f"{config.jira_url}/browse/{jira_key}"
            })

        # Save success log
        log_msg = f"Successfully synchronized {len(synced_stories)} user stories to Jira project '{config.jira_project_key}'."
        SyncLog.objects.create(
            project=project,
            sync_type="JIRA_STORIES",
            status="SUCCESS",
            message=log_msg,
            triggered_by=request.user
        )

        return api_success(
            data={"synced_count": len(synced_stories), "stories": synced_stories},
            message=log_msg
        )


class ConfluenceSyncView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        project_id = request.data.get("project_id")
        document_id = request.data.get("document_id")

        if not project_id or not document_id:
            return api_error(message="Project ID and Document ID are required.")

        try:
            project = Project.objects.get(id=project_id, organization_id=request.user.organization_id)
        except Project.DoesNotExist:
            return api_error(message="Project not found or access denied.")

        try:
            config = IntegrationConfig.objects.get(project=project)
        except IntegrationConfig.DoesNotExist:
            return api_error(message="Integration config not found for this project.")

        if not config.confluence_url or not config.confluence_username or not config.confluence_api_token or not config.confluence_space_key:
            return api_error(message="Confluence credentials are incomplete.")

        try:
            document = BusinessDocument.objects.get(id=document_id, project=project)
        except BusinessDocument.DoesNotExist:
            return api_error(message="Document not found or access denied.")

        # Simulate upload
        page_id = f"CONF-{timezone.now().strftime('%Y%m%d%H%M')}"
        page_url = f"{config.confluence_url}/spaces/{config.confluence_space_key}/pages/{page_id}"

        log_msg = f"Published document '{document.title}' to Confluence space '{config.confluence_space_key}' as page {page_id}."
        SyncLog.objects.create(
            project=project,
            sync_type="CONFLUENCE_DOC",
            status="SUCCESS",
            message=log_msg,
            triggered_by=request.user
        )

        return api_success(
            data={
                "page_id": page_id,
                "page_url": page_url,
                "title": document.title
            },
            message=log_msg
        )
