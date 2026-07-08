from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import TestCase, Defect
from .serializers import TestCaseSerializer, DefectSerializer

class TestCaseViewSet(viewsets.ModelViewSet):
    """
    ViewSet handling UAT Test Case CRUD.
    Enforces tenant isolation and maps records to active project context.
    """
    serializer_class = TestCaseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return TestCase.objects.none()

        queryset = TestCase.objects.filter(project__organization_id=user.organization_id)
        
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class DefectViewSet(viewsets.ModelViewSet):
    """
    ViewSet handling Defect CRUD.
    Enforces tenant isolation and maps records to active project context.
    """
    serializer_class = DefectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return Defect.objects.none()

        queryset = Defect.objects.filter(project__organization_id=user.organization_id)
        
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
