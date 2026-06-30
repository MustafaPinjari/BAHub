from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from .models import Risk, ChangeRequest
from .serializers import RiskSerializer, ChangeRequestSerializer
from core.responses import api_success, api_error
from core.exceptions import ValidationError

class RiskViewSet(viewsets.ModelViewSet):
    """
    ViewSet handling Risk CRUD operations.
    """
    serializer_class = RiskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return Risk.objects.none()

        queryset = Risk.objects.filter(project__organization_id=user.organization_id)
        
        # Support ?project=uuid query filtering
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
            
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Risks retrieved successfully.")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_success(data=serializer.data, message="Risk details retrieved.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return api_success(
            data=serializer.data,
            message="Risk recorded successfully.",
            status_code=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return api_success(data=serializer.data, message="Risk profile updated successfully.")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return api_success(message="Risk removed from registers.", status_code=status.HTTP_200_OK)


class ChangeRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet handling ChangeRequest CRUD and approval loops.
    """
    serializer_class = ChangeRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return ChangeRequest.objects.none()

        queryset = ChangeRequest.objects.filter(project__organization_id=user.organization_id)
        
        # Support ?project=uuid query filtering
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="review")
    def review_change(self, request, pk=None):
        """
        Reviews a Change Request ticket.
        Authorized for POs and Admins. Updates reviewed_by and status.
        """
        doc = self.get_object()

        if request.user.role not in ["ADMIN", "PRODUCT_OWNER", "PROJECT_MANAGER"]:
            return api_error(message="Only Product Owners, Project Managers, and Admins can sign off change requests.")

        decision = request.data.get("status")
        if decision not in ["APPROVED", "REJECTED"]:
            return api_error(message="Review decision must be either APPROVED or REJECTED.")

        doc.status = decision
        doc.reviewed_by = request.user
        doc.reviewed_at = timezone.now()
        doc.save()

        serializer = self.get_serializer(doc)
        return api_success(data=serializer.data, message=f"Change request status updated to {decision}.")

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Change requests retrieved successfully.")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_success(data=serializer.data, message="Change request details retrieved.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return api_success(
            data=serializer.data,
            message="Change request filed successfully.",
            status_code=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return api_success(data=serializer.data, message="Change request updated successfully.")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return api_success(message="Change request deleted.", status_code=status.HTTP_200_OK)
