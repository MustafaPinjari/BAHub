import os
import django
import datetime
import random
import uuid

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "bahub_backend.settings")
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import connection
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
from documents.models import BusinessDocument

User = get_user_model()

def clean_existing_data():
    print("Clearing existing workspace records to prevent duplicate pollution...")
    # Disable SQLite foreign key checks temporarily during hard deletes
    with connection.cursor() as cursor:
        cursor.execute("PRAGMA foreign_keys = OFF;")
        
    # Physically delete all objects across all tables
    TenantSubscription.objects.all_with_deleted().all().hard_delete()
    Project.objects.all_with_deleted().all().hard_delete()
    Stakeholder.objects.all_with_deleted().all().hard_delete()
    Requirement.objects.all_with_deleted().all().hard_delete()
    UserStory.objects.all_with_deleted().all().hard_delete()
    Meeting.objects.all_with_deleted().all().hard_delete()
    ActionItem.objects.all_with_deleted().all().hard_delete()
    Risk.objects.all_with_deleted().all().hard_delete()
    ChangeRequest.objects.all_with_deleted().all().hard_delete()
    SWOTAnalysis.objects.all().delete()
    GapAnalysis.objects.all_with_deleted().all().hard_delete()
    BusinessDocument.objects.all_with_deleted().all().hard_delete()
    ActivityLog.objects.all_with_deleted().all().hard_delete()
    Organization.objects.all_with_deleted().all().hard_delete()
    
    # Delete related users
    User.objects.filter(email__endswith="@bahub.local").delete()
    User.objects.filter(email__endswith="@apex.local").delete()
    User.objects.filter(email__endswith="@external.local").delete()
    
    # Re-enable SQLite foreign key checks
    with connection.cursor() as cursor:
        cursor.execute("PRAGMA foreign_keys = ON;")

def create_organization():
    org = Organization.objects.create(
        id=uuid.uuid4(),
        name="Apex Business Solutions",
        description="Enterprise workspace for business analytics and project design.",
        timezone="UTC",
        email="apex-workspace@bahub.local",
        phone="+1 800 555 0199",
        website="https://apex-analytics.local",
        address="100 Innovation Way, Suite 400, Tech City",
    )
    print(f"Created Organization: {org.name}")

    # Fetch subscription auto-created by billing receiver signal and update to Enterprise Plan
    sub = TenantSubscription.objects.get(organization=org)
    sub.plan_tier = "ENTERPRISE"
    sub.seats_limit = 1000
    sub.is_active = True
    sub.ai_credits_used = 180
    sub.ai_credits_limit = 10000
    sub.save()
    print("Configured Enterprise Subscription.")
    
    # Seed Permissions Registry
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
    return org

def create_users(org, fake):
    # Core users definition
    core_users_data = [
        {
            "username": "admin",
            "email": "admin@bahub.local",
            "password": "AdminP@ss123",
            "first_name": "Sarah",
            "last_name": "Jenkins",
            "role": User.ADMIN,
            "is_staff": True,
            "is_superuser": True
        },
        {
            "username": "analyst",
            "email": "analyst@bahub.local",
            "password": "AnalystP@ss123",
            "first_name": "David",
            "last_name": "Miller",
            "role": User.BUSINESS_ANALYST,
            "is_staff": False,
            "is_superuser": False
        },
        {
            "username": "developer",
            "email": "dev@bahub.local",
            "password": "DeveloperP@ss123",
            "first_name": "Alex",
            "last_name": "Mercer",
            "role": User.DEVELOPER,
            "is_staff": False,
            "is_superuser": False
        },
        {
            "username": "qa",
            "email": "qa@bahub.local",
            "password": "QATesterP@ss123",
            "first_name": "Emma",
            "last_name": "Watson",
            "role": User.QA_TESTER,
            "is_staff": False,
            "is_superuser": False
        }
    ]
    
    users = []
    for ud in core_users_data:
        u = User(
            id=uuid.uuid4(),
            username=ud["username"],
            email=ud["email"],
            first_name=ud["first_name"],
            last_name=ud["last_name"],
            role=ud["role"],
            organization=org,
            is_staff=ud["is_staff"],
            is_superuser=ud["is_superuser"]
        )
        u.set_password(ud["password"])
        users.append(u)
    
    # 35 additional users
    roles_pool = [
        (User.BUSINESS_ANALYST, "ba"),
        (User.PRODUCT_OWNER, "po"),
        (User.DEVELOPER, "dev"),
        (User.QA_TESTER, "qa"),
        (User.STAKEHOLDER, "sh"),
        (User.ADMIN, "adm")
    ]
    
    for i in range(1, 36):
        role, prefix = random.choices(
            roles_pool,
            weights=[35, 20, 30, 10, 3, 2],
            k=1
        )[0]
        
        first_name = fake.first_name()
        last_name = fake.last_name()
        username = f"{prefix}_{first_name.lower()}_{i}"
        email = f"{username}@apex.local"
        
        u = User(
            id=uuid.uuid4(),
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=role,
            organization=org,
            is_staff=(role == User.ADMIN),
            is_superuser=False
        )
        u.set_password("ApexSecure123!")
        users.append(u)
    
    User.objects.bulk_create(users)
    
    # Fetch from DB and create preferences
    all_users = list(User.objects.filter(organization=org))
    preferences = []
    for u in all_users:
        theme = "dark" if u.username == "analyst" else random.choice(["dark", "light", "system"])
        preferences.append(UserPreference(user=u, theme=theme))
    UserPreference.objects.bulk_create(preferences)
    
    print(f"Generated {len(all_users)} workspace users.")
    return all_users

def create_projects(org, all_users, fake):
    projects_data = [
        ("Customer Loyalty & Reward System", "Building a real-time points accumulation and tier-rewards engine linked directly with transaction checkout APIs.", "ACTIVE"),
        ("Payment Gateway Integration", "Integration of third-party gateways (Stripe, PayPal) to support multi-currency checkouts, chargeback audits, and compliance regulations.", "ACTIVE"),
        ("HR Management Platform", "Modernize the employee onboarding, timesheet logging, payroll management, and benefits enrollment portals.", "ACTIVE"),
        ("Inventory Management System", "Automated stock tracking, reorder point alerts, warehouse allocation optimizer, and supplier supply chain logistics integrations.", "ACTIVE"),
        ("CRM Modernization Hub", "Consolidate sales pipeline, lead scoring systems, client interactions, and auto-generated marketing email schedules.", "ACTIVE"),
        ("Healthcare Appointment System", "Online patient triage scheduling, doctor calendar synchronization, medical record access vault, and e-prescriptions dispatch.", "ACTIVE"),
        ("Banking Mobile App", "Secure online money transfers, biometric authentication, digital statements generator, and loan application processing engine.", "ACTIVE"),
        ("Supply Chain Analytics Dashboard", "Real-time tracking of global shipments, vendor scorecards, transit delay probability modeling, and tariff impacts calculator.", "COMPLETED"),
        ("Insurance Claim Portal", "Self-service claim filing, optical character recognition (OCR) of medical bills, auto-adjudication engine, and payout processor.", "ACTIVE"),
        ("Smart Warehouse IoT Control", "Drone inventory scans, conveyor speed monitoring, automated package labeling, and energy efficiency analytics.", "ARCHIVED"),
    ]
    
    projects = []
    for name, desc, status in projects_data:
        start_date = datetime.date.today() - datetime.timedelta(days=random.randint(60, 240))
        end_date = start_date + datetime.timedelta(days=random.randint(120, 365))
        
        p = Project(
            id=uuid.uuid4(),
            organization=org,
            name=name,
            description=desc,
            status=status,
            start_date=start_date,
            end_date=end_date
        )
        projects.append(p)
        
    Project.objects.bulk_create(projects)
    created_projects = list(Project.objects.filter(organization=org))
    
    project_members = []
    for p in created_projects:
        # Add core users
        core_usernames = ["admin", "analyst", "developer", "qa"]
        for username in core_usernames:
            u = next((usr for usr in all_users if usr.username == username), None)
            if u:
                role = "PROJECT_MANAGER" if u.role in [User.ADMIN, User.BUSINESS_ANALYST] else "CONTRIBUTOR"
                project_members.append(ProjectMember(id=uuid.uuid4(), project=p, user=u, role=role))
        
        # Add 8-12 other random users
        non_core = [usr for usr in all_users if usr.username not in core_usernames]
        selected = random.sample(non_core, random.randint(8, 12))
        for u in selected:
            if u.role == User.STAKEHOLDER:
                role = "VIEWER"
            elif u.role in [User.ADMIN, User.PRODUCT_OWNER]:
                role = "PROJECT_MANAGER"
            else:
                role = "CONTRIBUTOR"
            project_members.append(ProjectMember(id=uuid.uuid4(), project=p, user=u, role=role))
            
    ProjectMember.objects.bulk_create(project_members)
    print(f"Generated {len(created_projects)} projects with member allocations.")
    return created_projects

def create_stakeholders(org, created_projects, fake):
    departments = ["Finance", "Marketing", "Sales", "Operations", "Security", "Compliance", "Legal", "Customer Support", "Executive Board"]
    titles = ["VP of Operations", "Chief Legal Counsel", "Head of Compliance", "Sales Director", "Marketing Manager", "Executive Sponsor", "Customer Service Lead", "Security Consultant"]
    
    stakeholders = []
    for p in created_projects:
        # Generate 9 stakeholders per project -> 90 total (exceeds 80 requirement)
        for _ in range(9):
            name = fake.name()
            email = f"{name.replace(' ', '.').lower()}@external.local"
            
            sh = Stakeholder(
                id=uuid.uuid4(),
                organization=org,
                project=p,
                name=name,
                title=random.choice(titles),
                department=random.choice(departments),
                email=email,
                phone=fake.phone_number(),
                power=random.choice(["HIGH", "LOW"]),
                interest=random.choice(["HIGH", "LOW"]),
                influence=random.randint(1, 5),
                impact=random.randint(1, 5),
                notes=f"Key department representative. Must align during major sprint reviews."
            )
            stakeholders.append(sh)
            
    Stakeholder.objects.bulk_create(stakeholders)
    created_stakeholders = list(Stakeholder.objects.filter(organization=org))
    print(f"Generated {len(created_stakeholders)} stakeholders.")
    return created_stakeholders

def create_requirements(created_projects, created_stakeholders, all_users, fake):
    requirements = []
    requirement_counter = {}
    
    req_templates = {
        "Customer Loyalty & Reward System": [
            ("Loyalty Member Points Accrual Logic", "Engine to calculate purchase multiplier points (1 loyalty point per $1 base transaction)."),
            ("Status Level Tier Transitions", "Calculate tier progression (Bronze, Silver, Gold) based on 12-month rolling spend metrics."),
            ("Cart Points Redemption Engine", "Enable clients to apply point balances directly at cart checkout as partial discounts."),
            ("Threshold Auto-Discount Coupons", "Service to generate and email discount codes when loyalty status changes."),
            ("Admin Loyalty Adjustment console", "Internal manager console enabling direct manual loyalty adjustments."),
            ("Anti-Exploit Points Check", "Audit checker flag tracking sudden point variations to identify fraud attempts."),
        ],
        "Payment Gateway Integration": [
            ("Stripe checkout API links", "Integrate cart checkout flow to Stripe secure credit card gateways."),
            ("PayPal Redirection Handler", "Build redirection interfaces to PayPal endpoints to process orders."),
            ("PCI-DSS Secure log scrubbing filters", "Regex scrubbing service scanning log outputs to strip card details."),
            ("Multi-Currency exchange conversion lookup", "Support checkouts in USD, EUR, GBP, AUD with dynamic rates sync."),
            ("Partial Refunds Backend endpoint", "Provide refund endpoints conveying refund commands asynchronously to Stripe."),
            ("Webhook Signature verification", "Ensure webhook alerts contain authorized headers before completing sales."),
        ],
        "HR Management Platform": [
            ("Employee Onboarding Scheduler", "Automate new hire setup dispatching payroll forms and calendars."),
            ("Biometric Timesheet log sync", "Integrate timesheet uploads from scanner telemetry directly into logs."),
            ("Net Payout tax compiler", "Calculate employee payouts deducting localized taxes and benefits."),
            ("Wizard Benefits Enrollment", "Self-service wizard allowing option selection for health insurance plans."),
            ("Manager Leave approval panel", "Approval dashboard where managers approve vacation and expense sheets."),
            ("HR Audit Trail auditor", "Log profile adjustments to comply with employment regulation records."),
        ],
        "Inventory Management System": [
            ("Stock low reorder notifications", "Dispatch notifications automatically when items fall below custom minimums."),
            ("Warehouse package IoT link", "Capture package label scanner codes to adjust warehouse counts."),
            ("Optimal bin allocation optimizer", "Routing algorithm assigning bins dynamically on package check-in."),
            ("PDF Purchase Order auto-dispatcher", "Generate and email formal order drafts to vendors automatically."),
            ("Barcode validation endpoints", "Mobile scan handler verifying database inventory entries."),
            ("Supplier pricing catalog directory", "Consolidate supplier profiles and dynamic delivery catalogs."),
        ],
        "CRM Modernization Hub": [
            ("Deals Kanban workspace", "Visual drag-and-drop workflow tracking lead stages (Prospect, Proposal, Won)."),
            ("Lead prioritization score", "Algorithm rating pipeline leads based on corporate size and touch points."),
            ("Auto-Campaign email compiler", "Email builder scheduling bulk campaign alerts with analytics CTR logs."),
            ("Client interaction diary sync", "Chronological diary documenting customer logs, emails, and meetings."),
            ("Client Bulk csv importer", "CSV parser validating data fields for bulk database contact additions."),
            ("Agent Quotas reports generator", "Provide metrics tracking closed deals, quotas, and agent sales scores."),
        ],
        "Healthcare Appointment System": [
            ("Online Booking Patient Wizard", "Triage questionnaire leading patients to choose suitable practitioners."),
            ("Doctor scheduling calendar synchronization", "Live calendar dashboard managing doctor slots and consultations."),
            ("Encrypted Patient record vault", "Encrypted record storage containing lab reports and clinical histories."),
            ("E-Prescriptions secure mailer", "Secure certified mailer forwarding digital prescriptions to partners."),
            ("Patient notification SMS alerts", "Auto-SMS notification reminding customers of schedules 24h prior."),
            ("Telehealth video session room", "WebRTC secure consultation portal for virtual consultations."),
        ],
        "Banking Mobile App": [
            ("Biometric entrance log validation", "Integrate facial/fingerprint verification checks on app boot."),
            ("Direct ACH money transfers", "Process domestic wire transfers with balance checking verifications."),
            ("Dynamical pdf transaction summary compiler", "Allow clients to compile certified transaction statements."),
            ("Applicant credit score lookup scheduler", "Automated check query validating customer credit before loans."),
            ("Branch GPS tracker map", "Retrieve geographic location coordinate pins of branch offices."),
            ("Savings Goal vault dashboard", "Enable setting targets and processing automated savings deposits."),
        ],
        "Supply Chain Analytics Dashboard": [
            ("Shipment Telemetry live pins", "Telemetry map tracking global cargo containers via GPS feeds."),
            ("Customs delays probability predictor", "Algorithm forecasting clearance logs by checking port traffic."),
            ("Vendor scorecards criteria", "Consolidate damage ratios, delivery latencies, and vendor metrics."),
            ("Logistics fuel consumption tracker", "Track emissions outputs per shipment route for sustainability."),
            ("Estimated duties tax calculator", "Calculator projecting duty fees on global cargo imports."),
            ("Customs clearance audit tracker", "Verify entry logs, customs files, and declaration compliance codes."),
        ],
        "Insurance Claim Portal": [
            ("Claim File Wizard", "User form prompting image and document uploads during claim submissions."),
            ("OCR receipt text parser", "OCR extraction fetching provider fees and service item specifics."),
            ("Claim Adjudication criteria logic", "Pre-verify baseline policy coverage clauses to auto-approve claims."),
            ("Direct ACH reimbursement wire", "Disburse approved claim funds directly to client accounts."),
            ("Auditor adjustment console", "Manual inspection queue containing flagged, high-severity claims."),
            ("Policy limit verification checker", "Verify policy statuses and constraints against claim demands."),
        ],
        "Smart Warehouse IoT Control": [
            ("IoT Device Telemetry log receiver", "High-frequency listener registering conveyor speed telemetry alerts."),
            ("Drone Shelf scan telemetry sync", "Interface drone scan arrays to dynamically align warehouse stock counts."),
            ("Conveyor emergency shutdown alerts", "Halting trigger system immediately notifying supervisors of failures."),
            ("Automated sticker tag printer interface", "Sticker print signals when packages arrive at exit scanner belts."),
            ("Forklift routing optimization", "Optimized routing map guiding drivers to target storage lanes."),
            ("Warehouse heating scheduler optimizer", "Optimize HVAC cycles according to storage temperature limits."),
        ],
    }
    
    ba_users = [u for u in all_users if u.role == User.BUSINESS_ANALYST]
    
    for p in created_projects:
        requirement_counter[p.id] = 0
        p_sh = [sh for sh in created_stakeholders if sh.project_id == p.id]
        
        templates = req_templates.get(p.name, [])
        
        # Generate exactly 22 requirements per project -> 220 requirements (exceeds 200 requirement)
        for idx in range(22):
            if idx < len(templates):
                title, desc = templates[idx]
            else:
                title = f"System Module {fake.word().capitalize()} Integration"
                desc = f"Ensure security and compliance integrations are built. This system requirement defines validation, UI mappings, and functional tests."
                
            req_type = random.choice(["FUNCTIONAL", "NON_FUNCTIONAL", "TECHNICAL", "UI"])
            status = random.choice(["DRAFT", "REVIEW", "APPROVED", "REJECTED"])
            priority = random.choice(["HIGH", "MEDIUM", "LOW"])
            
            requirement_counter[p.id] += 1
            req_id = f"REQ-{requirement_counter[p.id]:03d}"
            
            req = Requirement(
                id=uuid.uuid4(),
                project=p,
                req_id=req_id,
                title=title,
                description=desc,
                req_type=req_type,
                status=status,
                priority=priority,
                version=random.choice(["1.0", "1.1", "2.0"]),
                source_stakeholder=random.choice(p_sh),
                created_by=random.choice(ba_users)
            )
            requirements.append(req)
            
    Requirement.objects.bulk_create(requirements)
    created_requirements = list(Requirement.objects.filter(project__organization=created_projects[0].organization))
    print(f"Generated {len(created_requirements)} requirements.")
    return created_requirements

def create_user_stories(created_requirements, fake):
    user_stories = []
    story_counter = {}
    
    story_templates = [
        ("Login authentication flow", "End User", "enter my credentials", "access my personal workspace securely"),
        ("Asynchronous Excel output", "Business Analyst", "export files to excel format", "review the items offline"),
        ("Live background auto-sync", "Workspace Collaborator", "auto-save changes in the background", "never lose draft data"),
        ("Log redaction filters", "Security Auditor", "redact raw payload values", "remain compliant with PCI security checks"),
        ("Quick search autocomplete", "Product Owner", "type tags to filter files", "identify spec duplicates instantly"),
        ("Mobile layout adaptability", "Mobile Client", "render lists cleanly on small screens", "verify tasks on the move"),
        ("Pop-up milestone notification", "Scrum Master", "receive popup status alerts", "keep track of sprint completions"),
        ("Clean attachment purging", "Database Administrator", "purge reference files physically", "preserve storage limits")
    ]
    
    for req in created_requirements:
        p_id = req.project_id
        if p_id not in story_counter:
            story_counter[p_id] = 0
            
        # Guarantee stories count is ~390 (exceeds 300 requirement)
        num_stories = random.choices([1, 2], weights=[20, 80], k=1)[0]
        for idx in range(num_stories):
            if idx == 0 and random.random() > 0.3:
                role, action, benefit = random.choice(story_templates)[1:]
                title = f"{req.title} user interface action"
            else:
                role = random.choice(["Client Customer", "Manager", "QA Specialist", "Frontend Developer", "API Engineer"])
                action = f"verify execution logs on {req.title.lower()}"
                benefit = f"ensure complete data alignment and validation success"
                title = f"Configure {req.title} sub-features"
                
            story_counter[p_id] += 1
            story_id = f"US-{story_counter[p_id]:03d}"
            
            ac = (
                f"- **GIVEN** authorized user role '{role}' is authenticated\n"
                f"- **WHEN** user requests: {action}\n"
                f"- **THEN** verify system responds and updates database logs so they can: {benefit}."
            )
            
            us = UserStory(
                id=uuid.uuid4(),
                requirement=req,
                story_id=story_id,
                title=title,
                role=role,
                action=action,
                benefit=benefit,
                acceptance_criteria=ac,
                status=random.choice(["TODO", "IN_PROGRESS", "QA", "DONE"]),
                points=random.choice([1, 2, 3, 5, 8, 13])
            )
            user_stories.append(us)
            
    UserStory.objects.bulk_create(user_stories)
    created_stories = list(UserStory.objects.filter(requirement__project__organization=created_requirements[0].project.organization))
    print(f"Generated {len(created_stories)} user stories.")
    return created_stories

def create_meetings(created_projects, all_users, fake):
    meeting_types = [
        ("Kickoff Sync", "Establish scope, define targets, and align on timeline dates."),
        ("Sprint Planning Session", "Prioritize stories, review velocity charts, and estimate workload tasks."),
        ("Sprint Retrospective Review", "Analyze completed deliverables and configure workflow improvements."),
        ("Client Demo and Acceptance Sync", "Present requirements prototype and obtain sign-off permissions."),
        ("Security Risk Audit", "Assess TLS configurations and credit card scrub logic requirements."),
        ("Database Architecture Sync", "Discuss SQL migration scripts and target PostgreSQL specs."),
        ("Requirement gathering workshop", "Consult stakeholders to map operational specifications and scopes.")
    ]
    
    meetings = []
    for p in created_projects:
        # 7 meetings per project -> 70 meetings total (exceeds 60 requirement)
        for idx in range(7):
            m_type, objective = random.choice(meeting_types)
            title = f"{p.name} - {m_type} #{idx + 1}"
            
            date = datetime.date.today() - datetime.timedelta(days=random.randint(-15, 60))
            time = datetime.time(random.randint(9, 16), random.choice([0, 30]), 0)
            
            notes = (
                f"### Minutes of Meeting (MoM)\n\n"
                f"**Meeting Objective**: {objective}\n\n"
                f"- Reviewed current sprint velocity charts.\n"
                f"- Stakeholders confirmed integration milestones.\n"
                f"- Identified minor configurations backlog blockages."
            )
            
            m = Meeting(
                id=uuid.uuid4(),
                project=p,
                title=title,
                date=date,
                time=time,
                objective=objective,
                notes=notes
            )
            meetings.append(m)
            
    Meeting.objects.bulk_create(meetings)
    created_meetings = list(Meeting.objects.filter(project__organization=created_projects[0].organization))
    
    # Bulk create intermediate attendee relations
    MeetingAttendeeThrough = Meeting.attendees.through
    relations = []
    
    # Action items list
    action_items = []
    
    for m in created_meetings:
        selected_users = random.sample(all_users, random.randint(4, 7))
        for u in selected_users:
            relations.append(MeetingAttendeeThrough(id=None, meeting_id=m.id, user_id=u.id))
            
        # 1-2 action items per meeting -> ~100 action items total
        for ai_idx in range(random.randint(1, 2)):
            desc = f"Action Item #{ai_idx + 1}: Finalize unit checks and complete logs configuration for {m.title}."
            due = m.date + datetime.timedelta(days=random.randint(3, 7))
            
            ai = ActionItem(
                id=uuid.uuid4(),
                meeting=m,
                description=desc,
                assignee=random.choice(selected_users),
                due_date=due,
                status=random.choice(["OPEN", "IN_PROGRESS", "COMPLETED"])
            )
            action_items.append(ai)
            
    # filter duplicates
    unique_rels = []
    seen = set()
    for rel in relations:
        key = (rel.meeting_id, rel.user_id)
        if key not in seen:
            seen.add(key)
            unique_rels.append(rel)
            
    MeetingAttendeeThrough.objects.bulk_create(unique_rels)
    ActionItem.objects.bulk_create(action_items)
    
    print(f"Generated {len(created_meetings)} meetings with {len(action_items)} action items.")
    return created_meetings

def create_risks(created_projects, fake):
    risks = []
    risk_templates = [
        ("API gateway connection time-out", "External service gateway could experience connection degradation.", "MEDIUM", "HIGH", "Establish connection retries and dynamic fallbacks."),
        ("Compliance scanning latency delay", "Delays in auditing might postpone sandbox compliance cert approval.", "LOW", "HIGH", "Automate compliance runs on weekly schedules."),
        ("Historical DB field corruption", "Data conversion could introduce invalid formats during migration.", "MEDIUM", "HIGH", "Perform dry-run schema conversions first."),
        ("Edge telemetry transmission lag", "Lag in conveyor sensors delays warehouse inventory charts update.", "HIGH", "MEDIUM", "Deploy edge caching nodes to run operations offline."),
        ("Resource allocation turnover", "Turnover of crucial analysts might delay milestone dates.", "MEDIUM", "MEDIUM", "Build clear spec documents and cross-training sessions.")
    ]
    
    for p in created_projects:
        # Generate exactly 5 risks per project -> 50 risks (exceeds 40 requirement)
        for idx in range(5):
            if idx < len(risk_templates):
                title, desc, prob, imp, mit = risk_templates[idx]
            else:
                title = f"Unexpected pipeline {fake.word()} issue"
                desc = "Potential build delays caused by environment configuration overrides."
                prob = random.choice(["HIGH", "MEDIUM", "LOW"])
                imp = random.choice(["HIGH", "MEDIUM", "LOW"])
                mit = "Audit pipeline settings and verify nightly staging logs."
                
            r = Risk(
                id=uuid.uuid4(),
                project=p,
                title=title,
                description=desc,
                probability=prob,
                impact=imp,
                mitigation=mit,
                status=random.choice(["IDENTIFIED", "MITIGATED", "OCCURRED", "CLOSED"])
            )
            risks.append(r)
            
    Risk.objects.bulk_create(risks)
    print(f"Generated {len(risks)} project risks.")
    return risks

def create_change_requests(created_projects, all_users, fake):
    change_requests = []
    reasons = [
        "Clients requested immediate support for contactless digital checkout.",
        "Security audit demands real-time logging redact filters to pass PCI guidelines.",
        "Marketing requests feedback rating prompts inside post-checkout cart views.",
        "Operation dashboard needs multi-currency charts support for executive compliance reviews.",
        "Database provider is deprecating legacy ports next month."
    ]
    
    for p in created_projects:
        # Exactly 3 change requests per project -> 30 CRs (exceeds 25 requirement)
        for idx in range(3):
            cost = random.randint(10, 60) * 1000
            timeline = f"+{random.randint(1, 3)} Sprints"
            priority = random.choice(["Critical", "High", "Medium", "Low"])
            
            desc = (
                f"Add integrations matching core scope requirements.\n\n"
                f"- **Financial Cost**: ${cost:,}\n"
                f"- **Timeline Impact**: {timeline}\n"
                f"- **Priority Level**: {priority}"
            )
            
            cr = ChangeRequest(
                id=uuid.uuid4(),
                project=p,
                title=f"Add {fake.word().capitalize()} endpoint handler",
                description=desc,
                reason=random.choice(reasons),
                impact_analysis="Modifies checkout views and local caching schemas. Minor sandbox downtime risk.",
                status=random.choice(["DRAFT", "REVIEW", "APPROVED", "REJECTED"]),
                requested_by=random.choice(all_users)
            )
            change_requests.append(cr)
            
    ChangeRequest.objects.bulk_create(change_requests)
    print(f"Generated {len(change_requests)} Change Requests.")
    return change_requests

def create_strategic_data(created_projects, fake):
    swots = []
    gaps = []
    
    for p in created_projects:
        sw = SWOTAnalysis(
            project=p,
            strengths=f"- Competent development squad.\n- Robust system design blueprints.\n- Clear requirement outlines.",
            weaknesses=f"- High dependency on provider uptime.\n- Developer staging clusters lack performance checks.",
            opportunities=f"- Incorporate other localized checkout options.\n- Integrate auto-generated alerts.",
            threats=f"- Changing security compliance laws.\n- General API outages."
        )
        swots.append(sw)
        
        # 2 gap analysis records per project -> 20 gap records
        for i in range(1, 3):
            g = GapAnalysis(
                id=uuid.uuid4(),
                project=p,
                title=f"Compliance check gap #{i}",
                current_state="System runs legacy transaction validation policies.",
                future_state="All checkouts execute multi-currency conversions with logging filters.",
                gap_description="Logs capture user details without verification scrubbing procedures.",
                action_plan="Deploy automated log scrubbing pipeline and refresh gateway encryption settings.",
                status=random.choice(["IDENTIFIED", "IN_PROGRESS", "RESOLVED"])
            )
            gaps.append(g)
            
    SWOTAnalysis.objects.bulk_create(swots)
    GapAnalysis.objects.bulk_create(gaps)
    print(f"Generated SWOT and Gap Analyses.")

def create_documents(created_projects, all_users, fake):
    from documents.models import BusinessDocument
    
    doc_templates = [
        ("Business Requirements Document (BRD) - Main Core", "BRD"),
        ("Functional Specifications Document (FRD) - Sub-Integrations", "FRD"),
        ("System Reference Specs Document (SRS)", "BRD"),
        ("Meetings Minutes MoM and Action matrix", "FRD"),
        ("Business Case & Revenue Forecast Model", "BRD"),
        ("Vision and Scope Boundaries Outline", "BRD"),
        ("Security Protocols and Architecture blueprint", "FRD"),
        ("Requirements Traceability Matrix spreadsheet", "BRD"),
        ("handover manual and compliance checklist", "FRD")
    ]
    
    documents = []
    for p in created_projects:
        # Exactly 9 documents per project -> 90 documents (exceeds 80 requirement)
        for idx in range(9):
            title_tpl, default_type = doc_templates[idx]
            title = f"{title_tpl} v{idx + 1}.0"
            
            content = (
                f"# Business Specification Document: {title}\n\n"
                f"## 1. Project Context & Objectives\n"
                f"This document details requirements for **{p.name}**.\n"
                f"It acts as the primary layout guide for system developers.\n\n"
                f"## 2. Technical Scope & Architecture\n"
                f"- Database backend: Postgres cluster\n"
                f"- Authentication: Multi-factor token checks\n"
                f"- Infrastructure: AWS cloud hosting\n\n"
                f"## 3. Boundaries and Verification\n"
                f"Excludes secondary payment processors and deprecated legacy telemetry imports."
            )
            
            status = random.choice(["DRAFT", "REVIEW", "APPROVED", "SIGNED_OFF"])
            creator = random.choice(all_users)
            
            signed_by = None
            signed_at = None
            if status == "SIGNED_OFF":
                po_users = [usr for usr in all_users if usr.role in [User.ADMIN, User.PRODUCT_OWNER]]
                signed_by = random.choice(po_users) if po_users else creator
                signed_at = timezone.now()
                
            doc = BusinessDocument(
                id=uuid.uuid4(),
                project=p,
                doc_type=default_type,
                title=title,
                version=f"1.{idx}",
                status=status,
                content=content,
                created_by=creator,
                signed_off_by=signed_by,
                signed_off_at=signed_at
            )
            documents.append(doc)
            
    BusinessDocument.objects.bulk_create(documents)
    print(f"Generated {len(documents)} business documents.")
    return documents

def create_activity_logs(created_projects, all_users, fake):
    actions = [
        "created requirement",
        "approved requirement",
        "submitted requirement for review",
        "updated user story status to DONE",
        "updated user story status to IN_PROGRESS",
        "created user story",
        "scheduled integration sync meeting",
        "identified new project risk",
        "mitigated security risk",
        "generated Business Requirements Document (BRD)",
        "exported Functional Requirements Document (FRD) to PDF",
        "created SWOT analysis draft",
        "created gap analysis for checkout flow",
        "added external stakeholder to registry",
        "uploaded project reference file",
        "signed off on business document"
    ]
    
    logs = []
    # Exactly 550 activity logs -> (exceeds 500 requirement)
    for _ in range(550):
        p = random.choice(created_projects)
        u = random.choice(all_users)
        action = f"{random.choice(actions)}: {fake.word().capitalize()} sub-module"
        
        log = ActivityLog(
            id=uuid.uuid4(),
            project=p,
            user=u,
            action=action
        )
        logs.append(log)
        
    ActivityLog.objects.bulk_create(logs)
    print(f"Generated {len(logs)} activity audit logs.")

def seed_rich_data():
    start_time = timezone.now()
    print("===================================================")
    print("        Starting Rich Demo Data Seeding            ")
    print("===================================================")

    from faker import Faker
    fake = Faker()
    Faker.seed(42)
    random.seed(42)

    # Idempotence: Clean up existing data first
    clean_existing_data()

    # Seeding stages
    org = create_organization()
    all_users = create_users(org, fake)
    created_projects = create_projects(org, all_users, fake)
    created_stakeholders = create_stakeholders(org, created_projects, fake)
    created_requirements = create_requirements(created_projects, created_stakeholders, all_users, fake)
    create_user_stories(created_requirements, fake)
    create_meetings(created_projects, all_users, fake)
    create_risks(created_projects, fake)
    create_change_requests(created_projects, all_users, fake)
    create_strategic_data(created_projects, fake)
    create_documents(created_projects, all_users, fake)
    create_activity_logs(created_projects, all_users, fake)

    end_time = timezone.now()
    duration = (end_time - start_time).total_seconds()
    print("===================================================")
    print(f"      Rich Demo Data Seeding Completed!            ")
    print(f"      Total Seeding Time: {duration:.2f} seconds    ")
    print("===================================================")

if __name__ == "__main__":
    seed_rich_data()
