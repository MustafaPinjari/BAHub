from rest_framework import viewsets, permissions, status
from rest_framework.permissions import IsAuthenticated
from .models import Meeting, ActionItem
from .serializers import MeetingSerializer, ActionItemSerializer
from core.responses import api_success
from core.exceptions import ValidationError

class MeetingViewSet(viewsets.ModelViewSet):
    """
    ViewSet handling Meeting CRUD operations.
    Enforces organization context limits and optional project context queries.
    """
    serializer_class = MeetingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return Meeting.objects.none()

        queryset = Meeting.objects.filter(project__organization_id=user.organization_id)
        
        # Support ?project=uuid query filtering
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
            
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Meetings retrieved successfully.")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_success(data=serializer.data, message="Meeting details retrieved.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return api_success(
            data=serializer.data,
            message="Meeting scheduled successfully.",
            status_code=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return api_success(data=serializer.data, message="Meeting updated successfully.")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return api_success(message="Meeting cancelled and deleted successfully.", status_code=status.HTTP_200_OK)

    from rest_framework.decorators import action

    @action(detail=True, methods=['post'])
    def generate_ai_notes(self, request, pk=None):
        meeting = self.get_object()
        # Mock AI generated notes based on objective
        ai_notes = (
            f"**AI Generated Minutes of Meeting**\n\n"
            f"**Objective Discussed:**\n{meeting.objective}\n\n"
            f"**Key Discussion Points:**\n"
            f"- Reviewed project milestones and current status.\n"
            f"- Addressed potential bottlenecks and resource allocation.\n"
            f"- Agreed on the next steps and timeline for the upcoming phase.\n\n"
            f"**Decisions Made:**\n"
            f"- Proceed with the proposed technical architecture.\n"
            f"- Allocate additional QA resources starting next week.\n"
        )
        meeting.notes = ai_notes
        meeting.save(update_fields=['notes'])
        serializer = self.get_serializer(meeting)
        return api_success(data=serializer.data, message="AI notes generated.")

    def perform_create(self, serializer):
        meeting = serializer.save()
        self._send_meeting_notifications(meeting, is_update=False, serializer=serializer)

    def perform_update(self, serializer):
        meeting = serializer.save()
        self._send_meeting_notifications(meeting, is_update=True, serializer=serializer)

    def _send_meeting_notifications(self, meeting, is_update=False, serializer=None):
        from core.emails import send_meeting_email
        
        # Build recipient email list from attendees
        attendees = list(meeting.attendees.all())
        if not attendees and serializer and "attendees" in serializer.validated_data:
            attendees = serializer.validated_data["attendees"]
            
        recipients = [user.email for user in attendees if user.email]

        # Add stakeholder attendees
        stakeholders = list(meeting.stakeholder_attendees.all())
        if not stakeholders and serializer and "stakeholder_attendees" in serializer.validated_data:
            stakeholders = serializer.validated_data["stakeholder_attendees"]
            
        for sh in stakeholders:
            if sh.email:
                recipients.append(sh.email)
                
        if not recipients:
            return
            
        send_meeting_email(meeting, is_update=is_update, recipient_list=recipients)


class ActionItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet handling Meeting follow-up Action Items.
    """
    serializer_class = ActionItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return ActionItem.objects.none()

        queryset = ActionItem.objects.filter(meeting__project__organization_id=user.organization_id)
        
        # Support ?meeting=uuid query filtering
        meeting_id = self.request.query_params.get("meeting")
        if meeting_id:
            queryset = queryset.filter(meeting_id=meeting_id)

        # Support ?project=uuid query filtering
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(meeting__project_id=project_id)
            
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Action items retrieved successfully.")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_success(data=serializer.data, message="Action item details retrieved.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return api_success(
            data=serializer.data,
            message="Action item task assigned successfully.",
            status_code=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return api_success(data=serializer.data, message="Action item updated successfully.")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return api_success(message="Action item removed successfully.", status_code=status.HTTP_200_OK)
