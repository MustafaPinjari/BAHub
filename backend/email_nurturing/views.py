from rest_framework import viewsets, permissions, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.utils import timezone
from .models import EmailTemplate, EmailCampaign, EmailEvent, EmailList, Unsubscribe, EmailPreference
from .serializers import (
    EmailTemplateSerializer,
    EmailCampaignSerializer,
    EmailEventSerializer,
    EmailListSerializer,
    UnsubscribeSerializer,
    EmailPreferenceSerializer,
)
from core.responses import api_success, api_error
from django.contrib.auth import get_user_model

User = get_user_model()


class EmailTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for email templates."""
    queryset = EmailTemplate.objects.all()
    serializer_class = EmailTemplateSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Email templates retrieved successfully.")


class EmailCampaignViewSet(viewsets.ModelViewSet):
    """ViewSet for email campaigns."""
    queryset = EmailCampaign.objects.select_related("template")
    serializer_class = EmailCampaignSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["post"], url_path="send")
    def send_campaign(self, request, pk=None):
        """Trigger campaign sending."""
        campaign = self.get_object()
        if campaign.status != "DRAFT":
            return api_error(message="Only draft campaigns can be sent.")
        
        campaign.status = "SENDING"
        campaign.sent_at = timezone.now()
        campaign.save(update_fields=["status", "sent_at"])
        
        # In production, this would trigger an async task to send emails
        # For now, we'll mark it as completed
        campaign.status = "COMPLETED"
        campaign.save(update_fields=["status"])
        
        serializer = self.get_serializer(campaign)
        return api_success(data=serializer.data, message="Campaign sent successfully.")

    @action(detail=True, methods=["post"], url_path="pause")
    def pause_campaign(self, request, pk=None):
        """Pause a scheduled or sending campaign."""
        campaign = self.get_object()
        if campaign.status not in ["SCHEDULED", "SENDING"]:
            return api_error(message="Only scheduled or sending campaigns can be paused.")
        
        campaign.status = "PAUSED"
        campaign.save(update_fields=["status"])
        
        serializer = self.get_serializer(campaign)
        return api_success(data=serializer.data, message="Campaign paused successfully.")

    @action(detail=True, methods=["get"], url_path="events")
    def campaign_events(self, request, pk=None):
        """Get events for a specific campaign."""
        campaign = self.get_object()
        events = campaign.events.all()
        serializer = EmailEventSerializer(events, many=True)
        return api_success(data=serializer.data, message="Campaign events retrieved successfully.")

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Email campaigns retrieved successfully.")


class EmailEventViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for email events (read-only for tracking)."""
    queryset = EmailEvent.objects.select_related("user", "campaign")
    serializer_class = EmailEventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        campaign_id = self.request.query_params.get("campaign")
        if campaign_id:
            queryset = queryset.filter(campaign_id=campaign_id)
        event_type = self.request.query_params.get("event_type")
        if event_type:
            queryset = queryset.filter(event_type=event_type)
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Email events retrieved successfully.")


class EmailListViewSet(viewsets.ModelViewSet):
    """ViewSet for email lists."""
    queryset = EmailList.objects.prefetch_related("users")
    serializer_class = EmailListSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["post"], url_path="add-users")
    def add_users(self, request, pk=None):
        """Add users to an email list."""
        email_list = self.get_object()
        user_ids = request.data.get("user_ids", [])
        if not user_ids:
            return api_error(message="user_ids is required.")
        
        users = User.objects.filter(id__in=user_ids)
        email_list.users.add(*users)
        email_list.update_subscriber_count()
        
        serializer = self.get_serializer(email_list)
        return api_success(data=serializer.data, message=f"Added {len(users)} users to list.")

    @action(detail=True, methods=["post"], url_path="remove-users")
    def remove_users(self, request, pk=None):
        """Remove users from an email list."""
        email_list = self.get_object()
        user_ids = request.data.get("user_ids", [])
        if not user_ids:
            return api_error(message="user_ids is required.")
        
        users = User.objects.filter(id__in=user_ids)
        email_list.users.remove(*users)
        email_list.update_subscriber_count()
        
        serializer = self.get_serializer(email_list)
        return api_success(data=serializer.data, message=f"Removed {len(users)} users from list.")

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Email lists retrieved successfully.")


class UnsubscribeViewSet(viewsets.ModelViewSet):
    """ViewSet for unsubscribe records."""
    queryset = Unsubscribe.objects.select_related("user", "campaign")
    serializer_class = UnsubscribeSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["post"], url_path="global")
    def global_unsubscribe(self, request):
        """Global unsubscribe for a user."""
        email_address = request.data.get("email_address")
        user_id = request.data.get("user_id")
        reason = request.data.get("reason", "")
        
        if not email_address and not user_id:
            return api_error(message="Either email_address or user_id is required.")
        
        if user_id:
            try:
                user = User.objects.get(id=user_id)
                email_address = user.email
            except User.DoesNotExist:
                return api_error(message="User not found.")
        
        unsubscribe = Unsubscribe.objects.create(
            email_address=email_address,
            user_id=user_id,
            reason=reason
        )
        
        serializer = self.get_serializer(unsubscribe)
        return api_success(data=serializer.data, message="Unsubscribe recorded successfully.")

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Unsubscribes retrieved successfully.")


class EmailPreferenceViewSet(viewsets.ModelViewSet):
    """ViewSet for user email preferences."""
    queryset = EmailPreference.objects.select_related("user")
    serializer_class = EmailPreferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role in ["ADMIN", "PRODUCT_OWNER"]:
            return EmailPreference.objects.all()
        return EmailPreference.objects.filter(user=self.request.user)

    @action(detail=False, methods=["get", "put"], url_path="mine")
    def my_preferences(self, request):
        """Get or update current user's preferences."""
        if request.method == "GET":
            preference, created = EmailPreference.objects.get_or_create(
                user=request.user
            )
            serializer = self.get_serializer(preference)
            return api_success(data=serializer.data, message="Preferences retrieved successfully.")
        
        # PUT - update preferences
        preference, created = EmailPreference.objects.get_or_create(
            user=request.user
        )
        serializer = self.get_serializer(preference, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return api_success(data=serializer.data, message="Preferences updated successfully.")

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Email preferences retrieved successfully.")
