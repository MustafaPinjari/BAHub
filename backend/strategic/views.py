from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from .models import SWOTAnalysis, GapAnalysis
from .serializers import SWOTAnalysisSerializer, GapAnalysisSerializer
from projects.models import Project
from core.responses import api_success, api_error

class SWOTAnalysisViewSet(viewsets.ModelViewSet):
    """
    ViewSet for SWOT Analysis. Auto-provisions a SWOT record for a project if queried.
    """
    serializer_class = SWOTAnalysisSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return SWOTAnalysis.objects.none()
        return SWOTAnalysis.objects.filter(project__organization_id=user.organization_id)

    def list(self, request, *args, **kwargs):
        project_id = request.query_params.get("project")
        if not project_id:
            return api_error(message="Project query parameter is required.")

        try:
            project = Project.objects.get(id=project_id, organization_id=request.user.organization_id)
        except Project.DoesNotExist:
            return api_error(message="Project not found or access denied.")

        # Auto-provision a blank grid if none exists
        swot, _ = SWOTAnalysis.objects.get_or_create(project=project)
        serializer = self.get_serializer(swot)
        return api_success(data=serializer.data, message="SWOT grid loaded successfully.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Avoid duplicate SWOT grids
        project = serializer.validated_data["project"]
        swot, created = SWOTAnalysis.objects.get_or_create(project=project)
        if not created:
            # Update existing instead of creating duplicate
            for key, val in serializer.validated_data.items():
                setattr(swot, key, val)
            swot.save()
            serializer = self.get_serializer(swot)
            return api_success(data=serializer.data, message="SWOT grid updated successfully.")
        
        self.perform_create(serializer)
        return api_success(
            data=serializer.data,
            message="SWOT grid initialized successfully.",
            status_code=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return api_success(data=serializer.data, message="SWOT grid updated.")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return api_success(message="SWOT grid deleted.", status_code=status.HTTP_200_OK)


class GapAnalysisViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Gap Analysis logs.
    """
    serializer_class = GapAnalysisSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return GapAnalysis.objects.none()

        queryset = GapAnalysis.objects.filter(project__organization_id=user.organization_id)
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Gap analyses retrieved successfully.")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_success(data=serializer.data, message="Gap analysis details loaded.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return api_success(
            data=serializer.data,
            message="Gap analysis record logged successfully.",
            status_code=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return api_success(data=serializer.data, message="Gap analysis updated successfully.")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return api_success(message="Gap analysis record removed.", status_code=status.HTTP_200_OK)


from rest_framework.views import APIView

class AIChatView(APIView):
    """
    Simulated context-aware AI Business Analyst assistant.
    Consumes project requirements, story aggregates, and stakeholder scopes to return detailed strategic analysis templates.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        project_id = request.data.get("project_id")
        message = request.data.get("message", "")
        action_type = request.data.get("action_type", "CHAT")

        if not project_id:
            return api_error(message="Project context is required.")

        try:
            project = Project.objects.get(id=project_id, organization_id=request.user.organization_id)
        except Project.DoesNotExist:
            return api_error(message="Project not found or access denied.")

        # Gather context
        req_count = project.requirements.count()
        
        # Safely fetch stories through requirements
        from stories.models import UserStory
        story_count = UserStory.objects.filter(requirement__project=project).count()
        risk_count = project.risks.count()
        stakeholder_count = project.stakeholders.count()

        # Build contextual templates depending on prompt keywords
        response_text = ""
        prompt_lower = message.lower()

        if action_type == "GENERATE_STORIES" or "user story" in prompt_lower or "stories" in prompt_lower:
            response_text = (
                f"### 🤖 Generated Agile User Stories\n"
                f"Based on the **{project.name}** context (Total Requirements: {req_count}):\n\n"
                f"1. **US-010: Dashboard Analytics View**\n"
                f"   - **As a** Business Analyst\n"
                f"   - **I want to** view aggregated status charts of requirements and active user story points\n"
                f"   - **So that** I can track pipeline velocity instantly.\n"
                f"   - *Acceptance Criteria*: \n"
                f"     - Renders responsive bars representing Approved vs. Draft tickets.\n"
                f"     - Refreshes automatically when projects switch.\n\n"
                f"2. **US-011: Automated Stakeholder Notices**\n"
                f"   - **As a** Product Owner\n"
                f"   - **I want to** receive email triggers when stakeholder sign-offs are submitted\n"
                f"   - **So that** deployment schedules can align with strategic objectives.\n"
            )
        elif action_type == "ANALYZE_RISKS" or "risk" in prompt_lower or "mitigation" in prompt_lower:
            response_text = (
                f"### 🤖 Projected Threat Vectors & Mitigations\n"
                f"Audit summary for **{project.name}** (Active Risks: {risk_count}):\n\n"
                f"| Threat Vector | Severity | Mitigation Strategy |\n"
                f"| :--- | :---: | :--- |\n"
                f"| API Integration Latency | **High** | Establish fallbacks to cache query profiles. |\n"
                f"| Multi-Tenant Leakage | **High** | Enforce tenant scoping validations on all model objects. |\n"
                f"| Scope Creep on Sprint | **Medium** | Route all modifications through PO Change Request pipelines. |\n"
            )
        elif action_type == "DRAFT_TEST_CASES" or "test case" in prompt_lower or "qa" in prompt_lower or "test" in prompt_lower:
            response_text = (
                f"### 🤖 Generated QA Validation Scripts\n"
                f"Drafted test scenarios for **{project.name}** specifications:\n\n"
                f"#### **Scenario 1: Project Swapping Scoping Validation**\n"
                f"- **Given** the user selects a project context in localStorage.\n"
                f"- **When** they navigate to Stakeholders or Risks log dashboard.\n"
                f"- **Then** the page must load data filtered strictly to the selected project ID.\n\n"
                f"#### **Scenario 2: Action Item Status Switch**\n"
                f"- **Given** an action item has status 'OPEN'.\n"
                f"- **When** the manager toggles the checkbox.\n"
                f"- **Then** the record status changes to 'COMPLETED' and is persisted to backend."
            )
        else:
            # Default chat dialogue
            response_text = (
                f"Hello! I am your **AI Business Analyst Assistant**.\n\n"
                f"I am fully integrated with your workspace **{project.name}**:\n"
                f"- 📋 **{req_count}** Requirements registered.\n"
                f"- 📝 **{story_count}** Agile User Stories mapped.\n"
                f"- 👤 **{stakeholder_count}** Stakeholders cataloged.\n"
                f"- ⚠️ **{risk_count}** Risks in database.\n\n"
                f"How can I help you compile BRD documents, audit requirements for ambiguities, or generate test cases today?"
            )

        return api_success(data={"reply": response_text}, message="AI analysis processed.")
