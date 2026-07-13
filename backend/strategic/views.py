import os
import json
import urllib.request
import urllib.error
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .models import SWOTAnalysis, GapAnalysis, AIJob, KnowledgeNode, KnowledgeEdge, WorkflowExecution
from .serializers import (
    SWOTAnalysisSerializer,
    GapAnalysisSerializer,
    KnowledgeNodeSerializer,
    KnowledgeEdgeSerializer,
    WorkflowExecutionSerializer
)
from .executor import submit_ai_job
from projects.models import Project
from core.responses import api_success, api_error
from core.exceptions import ValidationError

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
        return SWOTAnalysis.objects.filter(
            project__organization_id=user.organization_id
        ).select_related('project', 'project__organization')

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
        project = serializer.validated_data["project"]
        swot, created = SWOTAnalysis.objects.get_or_create(project=project)
        if not created:
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

        queryset = GapAnalysis.objects.filter(
            project__organization_id=user.organization_id
        ).select_related('project', 'project__organization')
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

    def perform_create(self, serializer):
        user = self.request.user
        if not user.organization:
            raise ValidationError("You must belong to an organization to log a Gap Analysis.")
        
        # Check plan limits
        from billing.models import TenantSubscription
        sub, _ = TenantSubscription.objects.get_or_create(
            organization=user.organization,
            defaults={
                "plan_tier": "FREE",
                "seats_limit": 5,
                "is_active": True,
                "ai_credits_limit": 100
            }
        )
        if sub.plan_tier == "FREE":
            existing_count = GapAnalysis.objects.filter(project__organization_id=user.organization_id).count()
            if existing_count >= 1:
                raise ValidationError("Under the Free plan, you are limited to 1 Gap Analysis record. Please upgrade to Pro or Enterprise.")
        serializer.save()

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






class AIChatView(APIView):
    """
    Asynchronous context-aware AI Business Analyst assistant.
    Creates an AIJob and dispatches it to a background thread pool, returning a 202 Accepted response.
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

        # Check subscription credit limit
        from billing.models import TenantSubscription
        sub, _ = TenantSubscription.objects.get_or_create(
            organization=request.user.organization,
            defaults={
                "plan_tier": "FREE",
                "seats_limit": 5,
                "is_active": True,
                "ai_credits_limit": 100
            }
        )
        if sub.plan_tier != "FREE" and not sub.plan_verified:
            return api_error(
                message="Your subscription is pending verification. Please verify it via the email sent to your administrator.",
                status_code=status.HTTP_402_PAYMENT_REQUIRED
            )
        if not sub.is_active:
            return api_error(
                message="Your workspace subscription is inactive. Please update billing.",
                status_code=status.HTTP_402_PAYMENT_REQUIRED
            )
        if sub.ai_credits_used >= sub.ai_credits_limit:
            return api_error(
                message="You have consumed your monthly AI credits quota. Please upgrade your subscription plan.",
                status_code=status.HTTP_402_PAYMENT_REQUIRED
            )

        # Create the AI job in PENDING state
        job = AIJob.objects.create(
            project=project,
            user=request.user,
            job_type=action_type,
            prompt=message,
            status="PENDING"
        )

        # Dispatch the job to the thread pool executor
        submit_ai_job(job.id)

        # Return 202 Accepted status with the job details
        return api_success(
            data={
                "job_id": str(job.id),
                "status": job.status
            },
            message="AI job queued successfully.",
            status_code=status.HTTP_202_ACCEPTED
        )


class AIJobDetailView(APIView):
    """
    View to retrieve the execution status and results of a queued AI job.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, job_id):
        try:
            job = AIJob.objects.get(
                id=job_id,
                project__organization_id=request.user.organization_id
            )
        except AIJob.DoesNotExist:
            return api_error(
                message="AI job not found or access denied.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        return api_success(
            data={
                "id": str(job.id),
                "status": job.status,
                "result": job.result,
                "error_message": job.error_message,
                "created_at": job.created_at,
            },
            message="AI job status retrieved successfully."
        )


class KnowledgeNodeViewSet(viewsets.ModelViewSet):
    serializer_class = KnowledgeNodeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return KnowledgeNode.objects.none()
        queryset = KnowledgeNode.objects.filter(project__organization_id=user.organization_id)
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset

    def create(self, request, *args, **kwargs):
        project_id = request.data.get("project")
        try:
            Project.objects.get(id=project_id, organization_id=request.user.organization_id)
        except Project.DoesNotExist:
            return api_error(message="Project not found or access denied.")
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return api_success(data=serializer.data, message="Knowledge node created.", status_code=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return api_success(data=serializer.data, message="Knowledge node updated successfully.")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return api_success(message="Knowledge node deleted.")


class KnowledgeEdgeViewSet(viewsets.ModelViewSet):
    serializer_class = KnowledgeEdgeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return KnowledgeEdge.objects.none()
        queryset = KnowledgeEdge.objects.filter(project__organization_id=user.organization_id)
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset

    def create(self, request, *args, **kwargs):
        project_id = request.data.get("project")
        try:
            Project.objects.get(id=project_id, organization_id=request.user.organization_id)
        except Project.DoesNotExist:
            return api_error(message="Project not found or access denied.")
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return api_success(data=serializer.data, message="Knowledge edge created.", status_code=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return api_success(message="Knowledge edge deleted.")


class WorkflowExecutionViewSet(viewsets.ModelViewSet):
    serializer_class = WorkflowExecutionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return WorkflowExecution.objects.none()
        queryset = WorkflowExecution.objects.filter(project__organization_id=user.organization_id)
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset

    def create(self, request, *args, **kwargs):
        project_id = request.data.get("project")
        input_data = request.data.get("input_data", "")

        if not project_id:
            return api_error(message="Project ID is required.")

        try:
            project = Project.objects.get(id=project_id, organization_id=request.user.organization_id)
        except Project.DoesNotExist:
            return api_error(message="Project not found or access denied.")

        execution = WorkflowExecution.objects.create(
            project=project,
            user=request.user,
            status="PENDING",
            input_data=input_data
        )

        from .agent_orchestrator import submit_agent_workflow
        submit_agent_workflow(execution.id)

        serializer = self.get_serializer(execution)
        return api_success(
            data=serializer.data,
            message="Multi-Agent BA workflow execution queued successfully.",
            status_code=status.HTTP_201_CREATED
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_success(data=serializer.data, message="Workflow execution details loaded.")


class ProjectKnowledgeGraphView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        project_id = request.query_params.get("project")
        if not project_id:
            return api_error(message="Project parameter is required.")

        try:
            project = Project.objects.get(id=project_id, organization_id=request.user.organization_id)
        except Project.DoesNotExist:
            return api_error(message="Project not found or access denied.")

        nodes = KnowledgeNode.objects.filter(project=project)
        edges = KnowledgeEdge.objects.filter(project=project)

        node_serializer = KnowledgeNodeSerializer(nodes, many=True)
        edge_serializer = KnowledgeEdgeSerializer(edges, many=True)

        return api_success(
            data={
                "nodes": node_serializer.data,
                "edges": edge_serializer.data
            },
            message="Knowledge graph loaded successfully."
        )


class ProjectGraphSyncView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        project_id = request.data.get("project")
        if not project_id:
            return api_error(message="Project ID is required.")

        try:
            project = Project.objects.get(id=project_id, organization_id=request.user.organization_id)
        except Project.DoesNotExist:
            return api_error(message="Project not found or access denied.")

        from .agent_orchestrator import sync_entire_project_db_to_graph
        success = sync_entire_project_db_to_graph(project.id)

        if success:
            return api_success(message="Traceability knowledge graph synced successfully.")
        else:
            return api_error(message="Graph sync execution failed.")

