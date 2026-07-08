from rest_framework import viewsets, permissions, status
from rest_framework.permissions import IsAuthenticated
from .models import Project, ProjectMember, ProjectAttachment, ActivityLog
from .serializers import ProjectSerializer, ProjectMemberSerializer, ProjectAttachmentSerializer, ActivityLogSerializer
from core.responses import api_success
from core.exceptions import ValidationError
from rest_framework.decorators import action

class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet handling Project CRUD operations.
    - Admins see all projects in their organization.
    - Standard roles only see projects in their organization where they are a member.
    """
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return Project.objects.none()

        if user.role in ["ADMIN", "BUSINESS_ANALYST", "PRODUCT_OWNER"]:
            return Project.objects.filter(organization_id=user.organization_id)

        return Project.objects.filter(
            organization_id=user.organization_id,
            project_members__user=user
        ).distinct()

    def perform_create(self, serializer):
        user = self.request.user
        if not user.organization:
            raise ValidationError("You must belong to an organization to create a project.")
        
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
            existing_count = Project.objects.filter(organization=user.organization).count()
            if existing_count >= 1:
                raise ValidationError("Under the Free plan, you are limited to 1 active project. Please upgrade to Pro or Enterprise.")

        project = serializer.save(organization=user.organization)
        ProjectMember.objects.get_or_create(
            project=project,
            user=user,
            defaults={"role": "PROJECT_MANAGER"}
        )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Projects retrieved successfully.")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_success(data=serializer.data, message="Project details retrieved successfully.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return api_success(
            data=serializer.data,
            message="Project created successfully.",
            status_code=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return api_success(data=serializer.data, message="Project updated successfully.")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return api_success(message="Project soft-deleted successfully.")

    @action(detail=False, methods=["post"], url_path="create-sample")
    def create_sample(self, request):
        """
        Creates a rich sample project backlog representing a SwiftPay Mobile Wallet.
        """
        user = request.user
        if not user.organization:
            return api_error(message="User does not belong to an organization.")

        # Check subscription project limits
        from billing.models import TenantSubscription
        sub, _ = TenantSubscription.objects.get_or_create(
            organization=user.organization,
            defaults={"plan_tier": "FREE", "seats_limit": 5, "is_active": True, "ai_credits_limit": 100}
        )
        if sub.plan_tier == "FREE":
            # Clear existing projects in the FREE organization to make room
            Project.objects.filter(organization=user.organization).delete()

        # 1. Create Project
        project = Project.objects.create(
            organization=user.organization,
            name="Sample: SwiftPay Mobile Wallet",
            description="Next-generation e-wallet application featuring instant payments, spend audits, and multi-currency registers."
        )
        ProjectMember.objects.create(
            project=project,
            user=user,
            role="PROJECT_MANAGER"
        )

        # 2. Stakeholders
        from stakeholders.models import Stakeholder
        Stakeholder.objects.create(
            project=project,
            name="Sarah Connor",
            title="Product Director",
            role="PRODUCT_OWNER",
            power="HIGH",
            interest="HIGH",
            department="Product Management"
        )
        Stakeholder.objects.create(
            project=project,
            name="John Doe",
            title="Lead Engineer",
            role="ARCHITECT",
            power="MEDIUM",
            interest="HIGH",
            department="Engineering"
        )
        Stakeholder.objects.create(
            project=project,
            name="Alice Vance",
            title="Finance Compliance Manager",
            role="COMPLIANCE",
            power="HIGH",
            interest="MEDIUM",
            department="Legal & Compliance"
        )

        # 3. Requirements
        from requirements.models import Requirement
        r1 = Requirement.objects.create(
            project=project,
            req_id="REQ-001",
            title="Biometric FaceID/TouchID Authentication",
            description="Users must be able to log in and authorize payment tokens using device local biometrics.",
            req_type="FUNCTIONAL",
            priority="HIGH",
            status="APPROVED"
        )
        r2 = Requirement.objects.create(
            project=project,
            req_id="REQ-002",
            title="Real-time P2P Transfer using QR Code Scan",
            description="Enables peer-to-peer funds transfer in under 5 seconds by scanning dynamic payment QR codes.",
            req_type="FUNCTIONAL",
            priority="CRITICAL",
            status="APPROVED"
        )
        r3 = Requirement.objects.create(
            project=project,
            req_id="REQ-003",
            title="Monthly Spending Limits & Compliance Checks",
            description="Users can set budget thresholds; transactions exceeding thresholds trigger multi-factor alerts.",
            req_type="COMPLIANCE",
            priority="MEDIUM",
            status="DRAFT"
        )

        # 4. User Stories
        from stories.models import UserStory
        UserStory.objects.create(
            requirement=r1,
            story_id="US-1",
            title="As a user, I want to authenticate via FaceID so that logins are seamless.",
            description="GIVEN biometric authentication is toggled ON, WHEN I launch the app, THEN biometrics prompt runs.",
            points=3,
            status="DONE"
        )
        UserStory.objects.create(
            requirement=r2,
            story_id="US-2",
            title="As a sender, I want to scan payment QR codes to send transfers quickly.",
            description="GIVEN a valid QR code, WHEN I scan it and submit amount, THEN transaction resolves under 5 seconds.",
            points=5,
            status="IN_PROGRESS"
        )

        # 5. Risks
        from risks.models import Risk
        Risk.objects.create(
            requirement=r2,
            title="Delay in third-party QR code scanner library compatibility",
            description="The camera scanner SDK might conflict with older Android device cameras.",
            severity="HIGH",
            probability="MEDIUM",
            impact="HIGH",
            mitigation_strategy="Pre-test scanner libraries on target architectures; deploy standard barcode fallbacks."
        )
        Risk.objects.create(
            requirement=r3,
            title="SAML login authentication compliance sync delays",
            description="SAML integration requires legal approval from corporate partners.",
            severity="CRITICAL",
            probability="LOW",
            impact="CRITICAL",
            mitigation_strategy="Initiate early legal reviews and use standard OAuth mocks in sandbox testing."
        )

        # 6. UAT Test Cases & Defects
        from uat.models import TestCase, Defect
        tc1 = TestCase.objects.create(
            project=project,
            requirement=r1,
            title="TC-001: Biometrics Toggle & Login Verify",
            scenario="Toggle FaceID ON in settings. Log out. Log back in and confirm system prompts biometric face scanner.",
            acceptance_criteria="Biometric prompt displays. Successful biometric scan triggers dashboard entry without password.",
            status="PASSED",
            created_by=user
        )
        tc2 = TestCase.objects.create(
            project=project,
            requirement=r2,
            title="TC-002: Scan & Pay with Low Balances",
            scenario="Ensure scanning code with insufficient funds triggers appropriate client warning card.",
            acceptance_criteria="App displays 'Insufficient Funds' overlay and blocks submit call.",
            status="FAILED",
            created_by=user
        )
        Defect.objects.create(
            project=project,
            test_case=tc2,
            title="DEF-001: QR Scan triggers infinite load on zero balances",
            description="When account balance is exactly $0, scanning a QR code locks the client UI on load spin screen.",
            severity="HIGH",
            status="OPEN",
            created_by=user
        )

        # 7. Create a draft BRD document
        from documents.models import BusinessDocument, DocumentVersion, DocumentApprovalHistory
        doc_content = (
            f"# Business Requirements Document: SwiftPay Mobile Wallet\n\n"
            f"## 1. Project Control & Scope\n"
            f"- **Project Name**: SwiftPay Mobile Wallet\n"
            f"- **Organization**: {user.organization.name}\n"
            f"- **Author**: @{user.username}\n"
            f"- **Status**: DRAFT\n\n"
            f"## 2. Key Stakeholder Registry\n"
            f"| Name | Title | Role |\n"
            f"| --- | --- | --- |\n"
            f"| Sarah Connor | Product Director | PRODUCT_OWNER |\n"
            f"| John Doe | Lead Engineer | ARCHITECT |\n"
            f"| Alice Vance | Finance Compliance Manager | COMPLIANCE |\n\n"
            f"## 3. Product Backlog Catalog\n"
            f"- **REQ-001**: Biometric FaceID/TouchID Authentication (Status: APPROVED)\n"
            f"- **REQ-002**: Real-time P2P Transfer using QR Code Scan (Status: APPROVED)\n"
            f"- **REQ-003**: Monthly Spending Limits & Compliance Checks (Status: DRAFT)\n"
        )
        doc = BusinessDocument.objects.create(
            project=project,
            doc_type="BRD",
            title="BRD - SwiftPay Wallet - Version 1.0",
            version="1.0",
            status="DRAFT",
            content=doc_content,
            created_by=user
        )
        DocumentVersion.objects.create(
            document=doc,
            version="1.0",
            content=doc_content,
            created_by=user
        )
        DocumentApprovalHistory.objects.create(
            document=doc,
            user=user,
            action="CREATE",
            comment="Synthesized initial SwiftPay specification outline.",
            version="1.0"
        )

        from core.responses import api_error
        serializer = ProjectSerializer(project)
        return api_success(data=serializer.data, message="Example SwiftPay Mobile Wallet project loaded successfully!")

    @action(detail=True, methods=["get"], url_path="report")
    def report(self, request, pk=None):
        project = self.get_object()
        
        # 1. Requirements
        reqs = project.requirements.all()
        reqs_total = reqs.count()
        reqs_by_status = {}
        for r in reqs:
            reqs_by_status[r.status] = reqs_by_status.get(r.status, 0) + 1
        reqs_by_category = {}
        for r in reqs:
            reqs_by_category[r.req_type] = reqs_by_category.get(r.req_type, 0) + 1

        # 2. User Stories
        from stories.models import UserStory
        stories = UserStory.objects.filter(requirement__project=project)
        stories_total = stories.count()
        stories_by_status = {}
        total_points = 0
        for s in stories:
            stories_by_status[s.status] = stories_by_status.get(s.status, 0) + 1
            if s.points:
                total_points += s.points

        # 3. Risks
        risks = project.risks.all()
        risks_total = risks.count()
        risks_by_prob = {}
        risks_by_impact = {}
        risks_by_status = {}
        for r in risks:
            risks_by_prob[r.probability] = risks_by_prob.get(r.probability, 0) + 1
            risks_by_impact[r.impact] = risks_by_impact.get(r.impact, 0) + 1
            risks_by_status[r.status] = risks_by_status.get(r.status, 0) + 1

        # 4. Change Requests
        crs = project.change_requests.all()
        crs_total = crs.count()
        crs_by_status = {}
        for c in crs:
            crs_by_status[c.status] = crs_by_status.get(c.status, 0) + 1

        # 5. Meetings & Action Items
        meetings_count = project.meetings.count()
        from meetings.models import ActionItem
        actions = ActionItem.objects.filter(meeting__project=project)
        actions_total = actions.count()
        actions_open = actions.filter(status="OPEN").count() + actions.filter(status="IN_PROGRESS").count()
        actions_completed = actions.filter(status="COMPLETED").count()

        data = {
            "requirements": {
                "total": reqs_total,
                "by_status": reqs_by_status,
                "by_category": reqs_by_category,
            },
            "stories": {
                "total": stories_total,
                "by_status": stories_by_status,
                "total_points": total_points,
            },
            "risks": {
                "total": risks_total,
                "by_probability": risks_by_prob,
                "by_impact": risks_by_impact,
                "by_status": risks_by_status,
            },
            "changes": {
                "total": crs_total,
                "by_status": crs_by_status,
            },
            "meetings": {
                "total": meetings_count,
                "action_items_total": actions_total,
                "action_items_open": actions_open,
                "action_items_completed": actions_completed,
            }
        }
        
        return api_success(data=data, message="Project strategic report compiled successfully.")

class ProjectMemberViewSet(viewsets.ModelViewSet):
    """
    ViewSet mapping Users to Projects.
    """
    serializer_class = ProjectMemberSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.organization_id:
            return ProjectMember.objects.filter(project__organization_id=user.organization_id)
        return ProjectMember.objects.none()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Project members retrieved successfully.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return api_success(
            data=serializer.data,
            message="Member assigned to project successfully.",
            status_code=status.HTTP_201_CREATED
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return api_success(message="Member removed from project successfully.")


class ProjectAttachmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet managing Project-associated specifications attachments.
    """
    serializer_class = ProjectAttachmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return ProjectAttachment.objects.none()
        
        queryset = ProjectAttachment.objects.filter(project__organization_id=user.organization_id)
        
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
            
        return queryset

    def perform_create(self, serializer):
        project = serializer.validated_data["project"]
        if project.organization_id != self.request.user.organization_id:
            raise ValidationError("You do not have access to this project.")
            
        uploaded_file = self.request.FILES.get("file")
        size_str = "0 KB"
        if uploaded_file:
            size_bytes = uploaded_file.size
            if size_bytes >= 1024 * 1024:
                size_str = f"{size_bytes / (1024 * 1024):.1f} MB"
            else:
                size_str = f"{size_bytes / 1024:.1f} KB"
                
        serializer.save(
            uploaded_by=self.request.user,
            size_str=size_str
        )
        from .models import log_activity
        log_activity(
            project,
            self.request.user,
            f"uploaded {serializer.instance.name}"
        )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Project attachments retrieved successfully.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return api_success(
            data=serializer.data,
            message="Attachment uploaded successfully.",
            status_code=status.HTTP_201_CREATED
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        project = instance.project
        name = instance.name
        if instance.file:
            instance.file.delete(save=False)
        instance.delete()
        from .models import log_activity
        log_activity(
            project,
            self.request.user,
            f"deleted file {name}"
        )
        return api_success(message="Attachment deleted successfully.")

class ActivityLogViewSet(viewsets.ModelViewSet):
    """
    ViewSet listing ActivityLog audit logs scoped by project and organization.
    """
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not user.organization_id:
            return ActivityLog.objects.none()

        queryset = ActivityLog.objects.filter(project__organization_id=user.organization_id)

        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_success(data=serializer.data, message="Activity logs retrieved successfully.")
