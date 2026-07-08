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

    def perform_create(self, serializer):
        meeting = serializer.save()
        self._send_meeting_notifications(meeting, is_update=False, serializer=serializer)

    def perform_update(self, serializer):
        meeting = serializer.save()
        self._send_meeting_notifications(meeting, is_update=True, serializer=serializer)

    def _send_meeting_notifications(self, meeting, is_update=False, serializer=None):
        from django.core.mail import send_mail
        from django.conf import settings
        
        # Build recipient email list from attendees
        attendees = list(meeting.attendees.all())
        if not attendees and serializer and "attendees" in serializer.validated_data:
            attendees = serializer.validated_data["attendees"]
            
        recipients = [user.email for user in attendees if user.email]
        if not recipients:
            return
            
        subject = f"{'Updated: ' if is_update else ''}Meeting Scheduled: {meeting.title}"
        
        frontend_url = getattr(settings, "CORS_ALLOWED_ORIGINS", "http://localhost:5173")
        if isinstance(frontend_url, list):
            frontend_url = frontend_url[0]
        frontend_url = frontend_url.rstrip("/")
        
        meeting_room_url = f"https://meet.jit.si/bahub-{meeting.id}"
        dashboard_url = f"{frontend_url}/meetings"
        
        message = (
            f"Hello,\n\n"
            f"You have been invited to a meeting in BAHub.\n\n"
            f"Meeting Details:\n"
            f"----------------------------------------\n"
            f"Title: {meeting.title}\n"
            f"Date: {meeting.date}\n"
            f"Time: {meeting.time}\n"
            f"Objective: {meeting.objective}\n"
            f"Workspace Project: {meeting.project.name}\n"
            f"----------------------------------------\n\n"
            f"Join Video Call Room: {meeting_room_url}\n\n"
            f"View in BAHub Dashboard: {dashboard_url}\n\n"
            f"Best regards,\nThe BAHub Team"
        )
        
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "notifications@bahub.com"),
                recipient_list=recipients,
                fail_silently=True
            )
        except Exception as e:
            import logging
            logger = logging.getLogger("django")
            logger.error(f"Failed to send meeting emails: {e}")


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
