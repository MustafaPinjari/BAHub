import os
import django
import datetime

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "bahub_backend.settings")
django.setup()

from django.contrib.auth import get_user_model
from organizations.models import Organization
from billing.models import TenantSubscription
from users.models import UserPreference
from projects.models import Project, ProjectMember, ActivityLog
from stakeholders.models import Stakeholder
from requirements.models import Requirement
from stories.models import UserStory
from meetings.models import Meeting, ActionItem
from risks.models import Risk, ChangeRequest
from strategic.models import SWOTAnalysis, GapAnalysis

User = get_user_model()

def seed_rich_data():
    print("===================================================")
    print("        Starting Rich Demo Data Seeding            ")
    print("===================================================")

    # 1. Create Organization
    org, created = Organization.objects.get_or_create(
        name="Apex Business Solutions",
        defaults={
            "description": "Enterprise workspace for business analytics and project design.",
            "timezone": "UTC",
            "email": "apex-workspace@bahub.local",
            "phone": "+1 800 555 0199",
            "website": "https://apex-analytics.local",
            "address": "100 Innovation Way, Suite 400, Tech City",
        }
    )
    print(f"{'Created' if created else 'Found'} Organization: {org.name}")

    # 2. Create Tenant Subscription
    sub, sub_created = TenantSubscription.objects.get_or_create(
        organization=org,
        defaults={
            "plan_tier": "ENTERPRISE",
            "seats_limit": 1000,
            "is_active": True,
            "ai_credits_used": 15,
            "ai_credits_limit": 10000,
        }
    )
    if not sub_created and sub.plan_tier != "ENTERPRISE":
        sub.plan_tier = "ENTERPRISE"
        sub.seats_limit = 1000
        sub.save()
    print(f"Verified Enterprise Subscription for organization.")

    # 3. Create Users
    users_data = [
        {
            "username": "admin",
            "email": "admin@bahub.local",
            "password": "AdminP@ss123",
            "first_name": "Sarah",
            "last_name": "Jenkins",
            "role": "ADMIN",
            "is_staff": True,
            "is_superuser": True
        },
        {
            "username": "analyst",
            "email": "analyst@bahub.local",
            "password": "AnalystP@ss123",
            "first_name": "David",
            "last_name": "Miller",
            "role": "BUSINESS_ANALYST",
            "is_staff": False,
            "is_superuser": False
        },
        {
            "username": "developer",
            "email": "dev@bahub.local",
            "password": "DeveloperP@ss123",
            "first_name": "Alex",
            "last_name": "Mercer",
            "role": "DEVELOPER",
            "is_staff": False,
            "is_superuser": False
        },
        {
            "username": "qa",
            "email": "qa@bahub.local",
            "password": "QATesterP@ss123",
            "first_name": "Emma",
            "last_name": "Watson",
            "role": "QA_TESTER",
            "is_staff": False,
            "is_superuser": False
        }
    ]

    users = {}
    for ud in users_data:
        user, u_created = User.objects.get_or_create(
            username=ud["username"],
            defaults={
                "email": ud["email"],
                "first_name": ud["first_name"],
                "last_name": ud["last_name"],
                "role": ud["role"],
                "organization": org,
                "is_staff": ud["is_staff"],
                "is_superuser": ud["is_superuser"]
            }
        )
        if u_created:
            user.set_password(ud["password"])
            user.save()
            UserPreference.objects.get_or_create(user=user)
            print(f"Created User: {user.username}")
        else:
            print(f"Found User: {user.username}")
        users[ud["username"]] = user

    # Ensure analyst theme preference is Dark Mode as shown in design
    pref = UserPreference.objects.get(user=users["analyst"])
    pref.theme = "dark"
    pref.save()

    # 4. Seed Permissions Registry
    from permissions.models import Permission
    default_perms = [
        ("Create Project", "create_project", "Ability to create new projects."),
        ("Edit Project", "edit_project", "Ability to update project configurations."),
        ("Delete Project", "delete_project", "Ability to soft delete projects."),
        ("Create Team", "create_team", "Ability to build new teams."),
        ("Edit Team", "edit_team", "Ability to edit team details and membership."),
        ("Delete Team", "delete_team", "Ability to delete teams."),
        ("Manage Permissions", "manage_permissions", "Ability to configure role-permission assignments."),
        ("Create Requirement", "create_requirement", "Ability to add requirement records."),
        ("Edit Requirement", "edit_requirement", "Ability to update requirements."),
        ("Delete Requirement", "delete_requirement", "Ability to remove requirement entries."),
        ("Approve BRD", "approve_brd", "Ability to authorize business requirements documents."),
    ]
    for name, codename, desc in default_perms:
        Permission.objects.get_or_create(
            codename=codename,
            defaults={"name": name, "description": desc}
        )

    # 5. Create Projects
    projects_data = [
        {
            "name": "Apex Payment Gateway Integration",
            "description": "Integration of third-party gateways (Stripe, PayPal) to support multi-currency checkouts, chargeback audits, and compliance regulations.",
            "status": "ACTIVE",
            "start_date": datetime.date(2026, 6, 1),
            "end_date": datetime.date(2026, 8, 31)
        },
        {
            "name": "Customer Loyalty & Reward System",
            "description": "Building a real-time points accumulation and tier-rewards engine linked directly with transaction checkout APIs.",
            "status": "ACTIVE",
            "start_date": datetime.date(2026, 7, 1),
            "end_date": datetime.date(2026, 10, 31)
        },
        {
            "name": "Legacy Database Migration",
            "description": "Extract-Transform-Load (ETL) processing migrating 5+ years of historical transaction metadata from MS-SQL server to AWS PostgreSQL cluster.",
            "status": "COMPLETED",
            "start_date": datetime.date(2026, 1, 1),
            "end_date": datetime.date(2026, 5, 31)
        }
    ]

    projects = {}
    for pd in projects_data:
        p, p_created = Project.objects.get_or_create(
            organization=org,
            name=pd["name"],
            defaults={
                "description": pd["description"],
                "status": pd["status"],
                "start_date": pd["start_date"],
                "end_date": pd["end_date"]
            }
        )
        print(f"{'Created' if p_created else 'Found'} Project: {p.name}")
        projects[pd["name"]] = p

        # Map Members
        ProjectMember.objects.get_or_create(project=p, user=users["analyst"], defaults={"role": "PROJECT_MANAGER"})
        ProjectMember.objects.get_or_create(project=p, user=users["admin"], defaults={"role": "PROJECT_MANAGER"})
        ProjectMember.objects.get_or_create(project=p, user=users["developer"], defaults={"role": "CONTRIBUTOR"})
        ProjectMember.objects.get_or_create(project=p, user=users["qa"], defaults={"role": "CONTRIBUTOR"})

    # 6. Populate "Apex Payment Gateway Integration"
    p1 = projects["Apex Payment Gateway Integration"]
    analyst_user = users["analyst"]

    # Stakeholders
    sh1, _ = Stakeholder.objects.get_or_create(
        organization=org, project=p1, name="Mustafa Mukhtar Pinjari",
        defaults={"title": "VP of Sales", "department": "Sales", "email": "mustafa@apex.local", "power": "HIGH", "interest": "HIGH", "influence": 5, "impact": 5, "notes": "Sponsor for multi-currency transactions."}
    )
    sh2, _ = Stakeholder.objects.get_or_create(
        organization=org, project=p1, name="Alice Smith",
        defaults={"title": "Compliance & Security Auditor", "department": "Risk & Security", "email": "alice@apex.local", "power": "HIGH", "interest": "MEDIUM", "influence": 4, "impact": 5, "notes": "PCI compliance check off signatory."}
    )
    sh3, _ = Stakeholder.objects.get_or_create(
        organization=org, project=p1, name="Bob Johnson",
        defaults={"title": "Customer Support Director", "department": "Operations", "email": "bob@apex.local", "power": "LOW", "interest": "HIGH", "influence": 2, "impact": 3, "notes": "Focus on administrative refund tooling ease."}
    )

    # Requirements
    req1, r1_created = Requirement.objects.get_or_create(
        project=p1, title="Multi-Gateway Stripe & PayPal Integration",
        defaults={
            "description": "Build external integration layers connecting to Stripe Checkout APIs and PayPal SDK. Support Visa, MasterCard, AMEX, and localized digital wallets.",
            "req_type": "FUNCTIONAL", "status": "APPROVED", "priority": "HIGH", "version": "1.0",
            "source_stakeholder": sh1, "created_by": analyst_user
        }
    )
    req2, _ = Requirement.objects.get_or_create(
        project=p1, title="Payment Event Webhook Listeners",
        defaults={
            "description": "Implement HTTP webhook callbacks processing transaction state alerts. Handler must securely authorize payment_intent.succeeded and order.completed events.",
            "req_type": "FUNCTIONAL", "status": "APPROVED", "priority": "HIGH", "version": "1.0",
            "source_stakeholder": sh1, "created_by": analyst_user
        }
    )
    req3, _ = Requirement.objects.get_or_create(
        project=p1, title="PCI-DSS Transport Layer Encryption",
        defaults={
            "description": "Guarantee complete encryption of financial payloads. No credit card numbers or personal details must be written to log files. TLS 1.3 enforced on all transaction channels.",
            "req_type": "NON_FUNCTIONAL", "status": "APPROVED", "priority": "HIGH", "version": "1.1",
            "source_stakeholder": sh2, "created_by": analyst_user
        }
    )
    req4, _ = Requirement.objects.get_or_create(
        project=p1, title="Customer Portal Refund API Flow",
        defaults={
            "description": "Provide internal backend API endpoints supporting partial and complete transaction refunds, communicating directly with checkout providers asynchronously.",
            "req_type": "TECHNICAL", "status": "REVIEW", "priority": "MEDIUM", "version": "1.0",
            "source_stakeholder": sh3, "created_by": analyst_user
        }
    )

    # User Stories
    # Link to req1
    UserStory.objects.get_or_create(
        requirement=req1, title="Stripe Tokenization",
        defaults={
            "role": "Business Analyst",
            "action": "obtain secure tokenization response from Stripe Element fields",
            "benefit": "ensure card data is encrypted and passed securely without hitting app database directly.",
            "acceptance_criteria": "- **GIVEN** checkout form is open\n- **WHEN** user types card info and clicks Submit\n- **THEN** Stripe returns a source token `tok_xxx`.",
            "status": "DONE", "points": 5
        }
    )
    UserStory.objects.get_or_create(
        requirement=req1, title="PayPal Redirection URL",
        defaults={
            "role": "Checkout Customer",
            "action": "click 'Pay with PayPal' and get redirected to the authentication checkout flow",
            "benefit": "complete transaction using PayPal account credit holdings.",
            "acceptance_criteria": "- **GIVEN** order summary review panel\n- **WHEN** PayPal checkbox selected and paid\n- **THEN** redirect client browser successfully to sandbox PayPal auth endpoint.",
            "status": "IN_PROGRESS", "points": 3
        }
    )
    # Link to req2
    UserStory.objects.get_or_create(
        requirement=req2, title="Webhook Succeeded Transaction State Update",
        defaults={
            "role": "Backend Server",
            "action": "verify Stripe webhook signature headers and process successfully paid orders",
            "benefit": "automatically fulfill purchase carts and generate dynamic billing receipt specs.",
            "acceptance_criteria": "- **GIVEN** incoming post request to webhooks endpoint\n- **WHEN** signature matches secret and event is `charge.succeeded`\n- **THEN** update database cart status to paid and dispatch notification.",
            "status": "QA", "points": 5
        }
    )
    # Link to req3
    UserStory.objects.get_or_create(
        requirement=req3, title="Secure Log Filters for Card Info",
        defaults={
            "role": "Compliance Engineer",
            "action": "intercept stdout and log streams to strip potential CC numbers",
            "benefit": "remain aligned with ISO and PCI audits.",
            "acceptance_criteria": "- **GIVEN** system print actions\n- **WHEN** strings match card regex\n- **THEN** redact string output completely to `XXXX-XXXX-XXXX-XXXX`.",
            "status": "TODO", "points": 8
        }
    )

    # Strategic Analyzes
    swot, _ = SWOTAnalysis.objects.get_or_create(
        project=p1,
        defaults={
            "strengths": "- Pre-configured integration SDKs.\n- Experienced payment development team.\n- Centralized DRF logging architecture.",
            "weaknesses": "- High dependency on Stripe service uptime.\n- Local sandboxes do not simulate regional compliance limits.",
            "opportunities": "- Implement Apple Pay and Google Wallet in subsequent sprints.\n- Expand transaction auditing logs to auto-report taxes.",
            "threats": "- Sudden changes in Atlassian sync Webhook policies.\n- Evolving security requirements on customer details storage."
        }
    )

    gap, _ = GapAnalysis.objects.get_or_create(
        project=p1, title="Multi-Currency Exchange rates Gap",
        defaults={
            "current_state": "All transactions processed strictly in single base currency (USD).",
            "future_state": "Checkout allows localized customer currency checkouts (USD, EUR, GBP, JPY) converting accurately.",
            "gap_description": "System database lacks real-time exchange rates lookup and caching tables.",
            "action_plan": "Integrate OpenExchangeRates API fetching currency values once every 24 hours, caching in redis/sqlite.",
            "status": "IN_PROGRESS"
        }
    )

    # Meetings & Mom
    meeting, m_created = Meeting.objects.get_or_create(
        project=p1, title="Payment Architecture & PCI Compliance Sync",
        defaults={
            "date": datetime.date.today() - datetime.timedelta(days=1),
            "time": datetime.time(10, 0, 0),
            "objective": "Align on Webhook handlers, security scopes, and BRD document reviews."
        }
    )
    if m_created:
        meeting.attendees.set([users["analyst"], users["developer"], users["qa"]])
        meeting.notes = "### MoM Notes\n- David presented the initial BRD skeleton.\n- Alex confirmed Stripe webhooks endpoint structures.\n- Emma Watson is writing the QA verification matrix.\n- Alice Smith (Stakeholder) confirmed that log scrubbing is required to proceed with sign-off."
        meeting.save()

        # Action Items
        ActionItem.objects.create(
            meeting=meeting, description="Write secure webhook regex filters",
            assignee=users["developer"], due_date=datetime.date.today() + datetime.date.resolution * 7, status="OPEN"
        )
        ActionItem.objects.create(
            meeting=meeting, description="Review sandbox account Stripe dashboard settings",
            assignee=users["analyst"], due_date=datetime.date.today() + datetime.date.resolution, status="COMPLETED"
        )

    # Risks & Change Requests
    Risk.objects.get_or_create(
        project=p1, title="Payment Provider Endpoint Outage",
        defaults={
            "description": "Stripe/PayPal APIs could experience connection time-outs or service degradation.",
            "probability": "MEDIUM", "impact": "HIGH",
            "mitigation": "Configure auto-retry logic with exponential backoff and provide immediate fallback checkout options.",
            "status": "IDENTIFIED"
        }
    )
    Risk.objects.get_or_create(
        project=p1, title="Webhook Signature Spoofing",
        defaults={
            "description": "Malicious requests pretending to be paid notifications targeting webhooks.",
            "probability": "LOW", "impact": "HIGH",
            "mitigation": "Strictly validate signature hashes using provider webhook signature keys.",
            "status": "MITIGATED"
        }
    )

    ChangeRequest.objects.get_or_create(
        project=p1, title="Mobile Apple Pay Option support",
        defaults={
            "description": "Add Apple Pay payment options to the frontend cart workflows.",
            "reason": "Allows quick payments for mobile device checkout users.",
            "impact_analysis": "Adds 2 frontend sprints. Integration with Stripe wallet endpoints required.",
            "status": "REVIEW", "requested_by": analyst_user
        }
    )

    # Activity Logs
    ActivityLog.objects.get_or_create(project=p1, user=users["analyst"], action="created requirement REQ-001")
    ActivityLog.objects.get_or_create(project=p1, user=users["analyst"], action="created user story US-001")
    ActivityLog.objects.get_or_create(project=p1, user=users["developer"], action="updated user story US-001 status to DONE")
    ActivityLog.objects.get_or_create(project=p1, user=users["analyst"], action="created gap analysis Multi-Currency Exchange rates Gap")

    # Generate default Document
    from documents.models import BusinessDocument
    doc_content = (
        "# Business Document: BRD - Payment Integration\n\n"
        "## 1. Document Control & Scope\n"
        "- **Project Scope**: Payment Gateway Integration\n"
        "- **Workspace Organisation**: Apex Business Solutions\n"
        "- **Document Schema Type**: BRD\n"
        "- **Author**: @analyst\n\n"
        "## 2. Key Stakeholder Registry\n"
        "| Name | Title | Department | Power / Interest |\n"
        "| --- | --- | --- | --- |\n"
        "| Mustafa Mukhtar Pinjari | VP of Sales | Sales | HIGH / HIGH |\n"
        "| Alice Smith | Compliance Auditor | Risk & Security | HIGH / MEDIUM |\n\n"
        "## 3. Business & Technical Specifications Catalog\n"
        "| ID | Title | Priority | Type | Status |\n"
        "| --- | --- | --- | --- | --- |\n"
        "| REQ-001 | Multi-Gateway Stripe & PayPal Integration | HIGH | FUNCTIONAL | APPROVED |"
    )
    BusinessDocument.objects.get_or_create(
        project=p1, doc_type="BRD", title="BRD - Payment Integration - Version 1.0",
        defaults={
            "version": "1.0", "status": "REVIEW", "content": doc_content,
            "created_by": analyst_user
        }
    )

    # 7. Populate "Customer Loyalty & Reward System"
    p2 = projects["Customer Loyalty & Reward System"]
    req_p2, _ = Requirement.objects.get_or_create(
        project=p2, title="Points Calculator API Engine",
        defaults={
            "description": "Calculate purchase conversion logic (e.g. 1 reward point per $10 spent). Expose points calculation trigger endpoints on completed orders.",
            "req_type": "FUNCTIONAL", "status": "APPROVED", "priority": "HIGH", "version": "1.0",
            "source_stakeholder": None, "created_by": analyst_user
        }
    )
    UserStory.objects.get_or_create(
        requirement=req_p2, title="Loyalty Points calculations",
        defaults={
            "role": "Loyalty Member",
            "action": "accumulate points automatically on checkout checkout",
            "benefit": "use point balance in subsequent checkouts.",
            "status": "IN_PROGRESS", "points": 5
        }
    )
    SWOTAnalysis.objects.get_or_create(
        project=p2,
        defaults={
            "strengths": "- Direct link with payment gateways.\n- Increases recurring purchases.",
            "weaknesses": "- Real-time processing adds database query overhead.",
            "opportunities": "- Upgrade customer levels (Bronze, Silver, Gold).",
            "threats": "- User exploitation of refund loopholes."
        }
    )

    print("===================================================")
    print("      Rich Demo Data Seeding Completed!            ")
    print("===================================================")

if __name__ == "__main__":
    seed_rich_data()
