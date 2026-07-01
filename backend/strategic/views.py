import os
import json
import urllib.request
import urllib.error
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .models import SWOTAnalysis, GapAnalysis, AIJob
from .serializers import SWOTAnalysisSerializer, GapAnalysisSerializer
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
