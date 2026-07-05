from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Diagram, DiagramVersion, DiagramObjectLink, DiagramComment, DiagramApproval
from .serializers import (
    DiagramSerializer,
    DiagramVersionSerializer,
    DiagramObjectLinkSerializer,
    DiagramCommentSerializer,
    DiagramApprovalSerializer
)
from core.responses import api_success, api_error
from projects.models import Project, log_activity
from requirements.models import Requirement
from stakeholders.models import Stakeholder
from stories.models import UserStory
from risks.models import Risk, ChangeRequest
from meetings.models import Meeting

from .ai_services import generate_ai_diagram
from .validators import validate_diagram_json
from .exporters import export_to_mermaid, export_to_plantuml, export_to_drawio_xml, export_to_bpmn_xml

def sync_diagram_links(diagram):
    """
    Parses the canvas nodes structure and synchronizes the DiagramObjectLink relationship table
    so search, index, and metrics reports stay consistent with the graphic workspace.
    """
    # Clear old links
    DiagramObjectLink.objects.filter(diagram=diagram).delete()
    
    nodes = diagram.canvas_json.get("nodes", []) if isinstance(diagram.canvas_json, dict) else []
    for node in nodes:
        node_id = node.get("id")
        data = node.get("data", {})
        
        # Mapped IDs
        req_id = data.get("requirementId") or data.get("requirement_id")
        stk_id = data.get("stakeholderId") or data.get("stakeholder_id")
        us_id = data.get("userStoryId") or data.get("user_story_id")
        risk_id = data.get("riskId") or data.get("risk_id")
        meet_id = data.get("meetingId") or data.get("meeting_id")
        cr_id = data.get("changeRequestId") or data.get("change_request_id")
        
        # Strings
        task = data.get("task", "")
        goal = data.get("business_goal") or data.get("businessGoal", "")
        rule = data.get("business_rule") or data.get("businessRule", "")
        ac = data.get("acceptance_criteria") or data.get("acceptanceCriteria", "")

        if any([req_id, stk_id, us_id, risk_id, meet_id, cr_id, task, goal, rule, ac]):
            try:
                DiagramObjectLink.objects.create(
                    diagram=diagram,
                    node_id=node_id,
                    node_name=data.get("label", "Unnamed Node"),
                    node_type=node.get("type", "process"),
                    requirement_id=req_id if req_id else None,
                    stakeholder_id=stk_id if stk_id else None,
                    user_story_id=us_id if us_id else None,
                    risk_id=risk_id if risk_id else None,
                    meeting_id=meet_id if meet_id else None,
                    change_request_id=cr_id if cr_id else None,
                    task=task,
                    business_goal=goal,
                    business_rule=rule,
                    acceptance_criteria=ac
                )
            except Exception as e:
                # Log error and continue to prevent saving failures due to link integrity issues
                import logging
                logging.getLogger(__name__).error(f"Error mapping node {node_id} details: {e}")


class DiagramViewSet(viewsets.ModelViewSet):
    serializer_class = DiagramSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return Diagram.objects.none()
        
        queryset = Diagram.objects.filter(project__organization_id=user.organization_id)
        
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
            
        return queryset

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        sync_diagram_links(instance)
        log_activity(instance.project, self.request.user, f"created diagram model '{instance.name}'")

    def perform_update(self, serializer):
        instance = serializer.save()
        sync_diagram_links(instance)
        log_activity(instance.project, self.request.user, f"updated diagram model '{instance.name}'")

    # Override standard responses to return api_success
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Diagrams retrieved successfully.")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_success(data=serializer.data, message="Diagram details retrieved successfully.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return api_success(data=serializer.data, message="Diagram created successfully.", status_code=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        
        # Check lock state
        if instance.is_locked and instance.locked_by != request.user:
            return api_error(
                message=f"This diagram is currently locked by {instance.locked_by.username}. Concurrency edits disabled.",
                status_code=status.HTTP_409_CONFLICT
            )
            
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return api_success(data=serializer.data, message="Diagram updated successfully.")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        project = instance.project
        name = instance.name
        instance.delete()
        log_activity(project, request.user, f"deleted diagram model '{name}'")
        return api_success(message="Diagram deleted successfully.")

    # Collaboration Locking
    @action(detail=True, methods=["post"])
    def lock(self, request, pk=None):
        diagram = self.get_object()
        if diagram.is_locked and diagram.locked_by != request.user:
            return api_error(message=f"Already locked by {diagram.locked_by.username}", status_code=status.HTTP_409_CONFLICT)
        
        diagram.is_locked = True
        diagram.locked_by = request.user
        diagram.locked_at = timezone.now()
        diagram.save(update_fields=["is_locked", "locked_by", "locked_at"])
        
        return api_success(message="Diagram locked successfully.")

    @action(detail=True, methods=["post"])
    def unlock(self, request, pk=None):
        diagram = self.get_object()
        # Admin can force-unlock diagrams
        if diagram.is_locked and diagram.locked_by != request.user and request.user.role != "ADMIN":
            return api_error(message="You do not have permission to unlock this diagram.", status_code=status.HTTP_403_FORBIDDEN)
        
        diagram.is_locked = False
        diagram.locked_by = None
        diagram.locked_at = None
        diagram.save(update_fields=["is_locked", "locked_by", "locked_at"])
        
        return api_success(message="Diagram unlocked successfully.")

    # Version Control Checkpoints
    @action(detail=True, methods=["post"], url_path="save-checkpoint")
    def save_checkpoint(self, request, pk=None):
        diagram = self.get_object()
        checkpoint_name = request.data.get("checkpoint_name", "")
        change_description = request.data.get("change_description", "")
        version_num = request.data.get("version", diagram.version)

        version = DiagramVersion.objects.create(
            diagram=diagram,
            version=version_num,
            canvas_json=diagram.canvas_json,
            documentation=diagram.documentation,
            status=diagram.status,
            created_by=request.user,
            checkpoint_name=checkpoint_name,
            change_description=change_description
        )
        
        # Update main diagram version pointer
        diagram.version = version_num
        diagram.save(update_fields=["version"])
        
        log_activity(diagram.project, request.user, f"created checkpoint v{version_num} for diagram '{diagram.name}'")
        
        serializer = DiagramVersionSerializer(version)
        return api_success(data=serializer.data, message="Version checkpoint saved successfully.")

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        diagram = self.get_object()
        version_id = request.data.get("version_id")
        
        try:
            version_snapshot = DiagramVersion.objects.get(diagram=diagram, id=version_id)
        except DiagramVersion.DoesNotExist:
            return api_error(message="Version snapshot not found.", status_code=status.HTTP_404_NOT_FOUND)
        
        diagram.canvas_json = version_snapshot.canvas_json
        diagram.documentation = version_snapshot.documentation
        diagram.status = version_snapshot.status
        diagram.version = version_snapshot.version
        diagram.save()
        
        sync_diagram_links(diagram)
        log_activity(diagram.project, request.user, f"restored diagram '{diagram.name}' to version {version_snapshot.version}")
        
        serializer = self.get_serializer(diagram)
        return api_success(data=serializer.data, message=f"Diagram restored to version {version_snapshot.version}.")

    @action(detail=True, methods=["get"])
    def versions(self, request, pk=None):
        diagram = self.get_object()
        versions = diagram.versions.all()
        serializer = DiagramVersionSerializer(versions, many=True)
        return api_success(data=serializer.data, message="Checkpoints retrieved successfully.")

    # Validation Engine
    @action(detail=True, methods=["post"])
    def validate(self, request, pk=None):
        diagram = self.get_object()
        validation_results = validate_diagram_json(diagram.canvas_json, diagram.documentation)
        return api_success(data=validation_results, message="Validation completed successfully.")

    # Exporters
    @action(detail=True, methods=["get"])
    def export(self, request, pk=None):
        diagram = self.get_object()
        export_format = request.query_params.get("format", "mermaid").lower()
        
        export_content = ""
        content_type = "text/plain"

        if export_format == "mermaid":
            export_content = export_to_mermaid(diagram.diagram_type, diagram.canvas_json)
        elif export_format == "plantuml":
            export_content = export_to_plantuml(diagram.diagram_type, diagram.canvas_json)
        elif export_format == "drawio":
            export_content = export_to_drawio_xml(diagram.canvas_json)
            content_type = "application/xml"
        elif export_format == "bpmn":
            export_content = export_to_bpmn_xml(diagram.canvas_json)
            content_type = "application/xml"
        else:
            return api_error(message="Unsupported export format.")

        return Response({
            "success": True,
            "data": {
                "format": export_format,
                "content": export_content,
                "content_type": content_type
            }
        })

    # AI-powered diagram generation
    @action(detail=False, methods=["post"])
    def generate(self, request):
        project_id = request.data.get("project")
        diagram_type = request.data.get("diagram_type", "USE_CASE")
        source_type = request.data.get("source_type", "FREE_TEXT") # REQUIREMENT, STORY, MEETING, SWOT, GAP, FREE_TEXT
        source_id = request.data.get("source_id")
        source_text = request.data.get("source_text", "")

        try:
            project = Project.objects.get(id=project_id, organization_id=request.user.organization_id)
        except Project.DoesNotExist:
            return api_error(message="Project not found.")

        # Resolve text if linked to standard models
        if source_id:
            resolved_text = ""
            if source_type == "REQUIREMENT":
                req = get_object_or_404(Requirement, id=source_id, project=project)
                resolved_text = f"Requirement: {req.title}\nDescription: {req.description}\nType: {req.req_type}"
            elif source_type == "STORY":
                us = get_object_or_404(UserStory, id=source_id, requirement__project=project)
                resolved_text = f"User Story: {us.title}\nRole: As a {us.role}\nAction: I want to {us.action}\nBenefit: So that {us.benefit}\nAcceptance: {us.acceptance_criteria}"
            elif source_type == "MEETING":
                m = get_object_or_404(Meeting, id=source_id, project=project)
                resolved_text = f"Meeting Minutes: {m.title}\nNotes: {m.minutes_notes}"
            elif source_type == "RISK":
                r = get_object_or_404(Risk, id=source_id, project=project)
                resolved_text = f"Risk: {r.title}\nDescription: {r.description}\nMitigation: {r.mitigation}"
            elif source_type == "GAP":
                g = get_object_or_404(GapAnalysis, id=source_id, project=project)
                resolved_text = f"Gap Title: {g.title}\nCurrent State: {g.current_state}\nFuture State: {g.future_state}\nGap Description: {g.gap_description}\nAction Plan: {g.action_plan}"
            
            if resolved_text:
                source_text = f"{resolved_text}\n\n{source_text}"

        # Generate structure
        generated = generate_ai_diagram(diagram_type, source_type, source_text)
        
        return api_success(data=generated, message="AI Diagram generated successfully.")


class DiagramCommentViewSet(viewsets.ModelViewSet):
    serializer_class = DiagramCommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return DiagramComment.objects.none()
            
        queryset = DiagramComment.objects.filter(diagram__project__organization_id=user.organization_id)
        
        diagram_id = self.request.query_params.get("diagram")
        if diagram_id:
            queryset = queryset.filter(diagram_id=diagram_id)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Comments retrieved successfully.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return api_success(data=serializer.data, message="Comment added.", status_code=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        comment = self.get_object()
        comment.resolved = True
        comment.resolved_by = request.user
        comment.resolved_at = timezone.now()
        comment.save(update_fields=["resolved", "resolved_by", "resolved_at"])
        
        serializer = self.get_serializer(comment)
        return api_success(data=serializer.data, message="Comment resolved successfully.")


class DiagramApprovalViewSet(viewsets.ModelViewSet):
    serializer_class = DiagramApprovalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return DiagramApproval.objects.none()
            
        queryset = DiagramApproval.objects.filter(diagram__project__organization_id=user.organization_id)
        
        diagram_id = self.request.query_params.get("diagram")
        if diagram_id:
            queryset = queryset.filter(diagram_id=diagram_id)
            
        return queryset

    def perform_create(self, serializer):
        instance = serializer.save(user=self.request.user)
        # Update main diagram status if approved
        diagram = instance.diagram
        if instance.status == "APPROVED":
            diagram.status = "APPROVED"
            diagram.save(update_fields=["status"])
        elif instance.status == "REJECTED":
            diagram.status = "DRAFT"
            diagram.save(update_fields=["status"])

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Approvals retrieved.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return api_success(data=serializer.data, status_code=status.HTTP_201_CREATED)
