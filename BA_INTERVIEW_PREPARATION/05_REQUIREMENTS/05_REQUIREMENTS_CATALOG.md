# BAHub — Enterprise Requirements Catalog & Specification Matrix
**Document Reference:** REQ-CAT-BAHUB-2026-V1  
**Project:** BAHub (The AI-Powered Business Analyst Workspace)  
**Standard Adhered To:** BABOK v3 / IEEE 830 Specification Framework  
**Author:** Senior Technical Business Analyst / Requirements Architect  
**Status:** Baselined & Traceable  

---

## 1. Classification & ID Taxonomy

This catalog documents the complete requirements baseline for BAHub, categorized into standardized architectural groupings with traceable repository evidence:
*   `BR-###`: Business Requirements (High-level organizational drivers)
*   `SR-###`: Stakeholder Requirements (Needs of specific user personas)
*   `FR-###`: Functional Requirements (Specific software behavioral capabilities)
*   `NFR-###`: Non-Functional Requirements (Performance, scalability, availability)
*   `TR-###`: Technical Requirements (Architectural and stack constraints)
*   `DR-###`: Data Requirements (Schema, entity integrity, soft delete)
*   `INT-###`: Integration Requirements (Third-party connectors, Jira, Slack, Stripe)
*   `SEC-###`: Security Requirements (Auth, encryption, RBAC, session audit)
*   `REP-###`: Reporting Requirements (Dashboards, analytics, document compilation)

---

## 2. Business Requirements (BR)

| Req ID | Requirement Statement | Business Objective | Repository Evidence | Module | Priority | Dependencies | Acceptance Criteria | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BR-001** | The platform shall provide a unified requirements lifecycle management workspace consolidating stakeholders, backlog, user stories, and test cases under a single project container. | Eliminate requirements fragmentation and reduce document formatting cycle time by 35%. | `README.md` (lines 8–10), `backend/projects/models.py:Project` | Projects & Core | **HIGH** | None | Given an active organization, when a BA creates a project, then stakeholders, requirements, stories, and UAT cases can be scoped directly to that project container. | **IMPLEMENTED** |
| **BR-002** | The platform shall enforce strict multi-tenant data isolation preventing unauthorized cross-organization data access or leaks. | Protect enterprise customer IP and satisfy enterprise security audit mandates. | `backend/core/middleware.py:SubscriptionMiddleware`, `backend/organizations/models.py` | Organizations & Middleware | **CRITICAL**| None | Given two separate tenant organizations, when User A queries requirements, then records belonging to Organization B are never returned in SQL query sets. | **IMPLEMENTED** |
| **BR-003** | The platform shall monetize workspace access via tiered SaaS subscriptions (Free, Pro, Enterprise) with automated billing and seat quota enforcement. | Generate recurring SaaS revenue and regulate infrastructure consumption costs. | `backend/billing/models.py:TenantSubscription`, `MONETIZATION.md` | Billing | **HIGH** | BR-002 | Given a Free tier organization with 5 members, when an admin attempts to invite a 6th member, the system rejects the invitation with an upgrade prompt. | **IMPLEMENTED** |
| **BR-004** | The platform shall automate the compilation of formal Business Requirements Documents (BRD) and Functional Requirements Documents (FRD) directly from database records. | Eliminate 10–15 hours of manual document assembly per sprint. | `backend/documents/models.py:BusinessDocument`, `frontend/.../DocumentGeneratorPage.tsx` | Documents | **HIGH** | BR-001 | Given approved requirements and stories, when a BA clicks "Compile BRD", a structured markdown and PDF document is rendered in under 15 seconds. | **IMPLEMENTED** |

---

## 3. Stakeholder Requirements (SR)

| Req ID | Requirement Statement | Target Stakeholder | Repository Evidence | Module | Priority | Dependencies | Acceptance Criteria | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SR-001** | As a Business Analyst, I need an inline Notion-style grid to rapidly author, edit, and filter requirements without page reloads. | Business Analyst | `frontend/src/features/requirements/RequirementsPage.tsx` | Requirements | **HIGH** | BR-001 | User can click any table cell (Title, Type, Priority, Status) to edit inline with automatic autosave debouncing. | **IMPLEMENTED** |
| **SR-002** | As a Product Owner, I need to decompose requirements into user stories with Gherkin acceptance criteria and assign Fibonacci points on a Kanban board. | Product Owner | `backend/stories/models.py`, `frontend/.../UserStoriesPage.tsx` | Stories | **HIGH** | SR-001 | Stories can be dragged across Kanban columns (TODO, IN_PROGRESS, QA, DONE) with immediate backend state persistence. | **IMPLEMENTED** |
| **SR-003** | As a QA Tester, I need to link test cases and execution runs directly to parent requirements and log defects upon failure. | QA Tester | `backend/uat/models.py:TestCase`, `Defect` | UAT | **HIGH** | SR-001 | When a test case is marked FAILED, a defect modal automatically opens prompting for severity rating and bug description. | **IMPLEMENTED** |
| **SR-004** | As a Workspace Admin, I need to monitor active user sessions and terminate unauthorized or stale sessions immediately. | Workspace Admin | `backend/users/models.py:UserSession`, `users/views.py` | Users & Auth | **MEDIUM**| SEC-001 | Admin can view active session IP, browser user agent, and click "Revoke Session" to invalidate user's JWT refresh token. | **IMPLEMENTED** |

---

## 4. Functional Requirements (FR)

| Req ID | Requirement Statement | Business Objective | Repository Evidence | Module | Priority | Dependencies | Acceptance Criteria | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-001** | The system shall automatically generate sequential, zero-padded requirement IDs in the format `REQ-###` scoped per project. | Guarantee unique human-readable keys and eliminate manual numbering collisions. | `backend/requirements/models.py` (lines 76–81) | Requirements | **HIGH** | BR-001 | Given a project with 4 existing requirements, when a 5th requirement is saved, `req_id` is automatically set to `REQ-005`. | **IMPLEMENTED** |
| **FR-002** | The system shall maintain parent-child referential integrity between Requirements and User Stories (`Requirement.user_stories`). | Prevent orphaned user stories and ensure 100% specification traceability. | `backend/stories/models.py` (lines 26–30) | Stories | **HIGH** | FR-001 | Attempting to create a user story without a valid `requirement_id` foreign key returns HTTP 400 Bad Request. | **IMPLEMENTED** |
| **FR-003** | The system shall calculate stakeholder Power vs. Interest positioning and render them in an interactive 2x2 matrix canvas. | Categorize stakeholder engagement strategies (Manage Closely, Keep Satisfied, etc.). | `backend/stakeholders/models.py`, `frontend/.../StakeholdersPage.tsx` | Stakeholders | **MEDIUM**| BR-001 | Stakeholders with `power="HIGH"` and `interest="HIGH"` automatically position in the "Manage Closely" quadrant. | **IMPLEMENTED** |
| **FR-004** | The system shall provide an interactive ReactFlow canvas for modeling BPMN workflows and UML diagrams with diagram locking. | Enable visual process modeling linked directly to requirements. | `backend/diagrams/models.py:Diagram`, `frontend/.../DiagramsPage.tsx` | Diagrams | **HIGH** | BR-001 | When User A locks a diagram for editing, User B receives a read-only lock notification preventing concurrent overwrite. | **IMPLEMENTED** |
| **FR-005** | The system shall record digital document sign-offs capturing signatory user ID, timestamp, and document version. | Provide non-repudiation audit trails for regulatory compliance. | `backend/documents/models.py` (lines 52–60) | Documents | **HIGH** | BR-004 | When an authorized PO clicks "Sign Off", status transitions to `SIGNED_OFF`, recording `signed_off_at` timestamp. | **IMPLEMENTED** |
| **FR-006** | The system shall provide a multi-entity Traceability Matrix aggregating Requirements, Stories, Risks, Documents, Test Cases, and Defects in a single view. | Instant visibility into requirement verification coverage and scope gaps. | `frontend/src/features/traceability/TraceabilityPage.tsx` | Traceability | **HIGH** | FR-001, FR-002, SR-003 | Any requirement without an associated test case displays an amber "Uncovered" status badge in the matrix. | **IMPLEMENTED** |

---

## 5. Non-Functional Requirements (NFR)

| Req ID | Requirement Statement | Quality Attribute | Repository Evidence | Module | Priority | Acceptance Criteria | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **NFR-001** | The backend REST APIs shall respond within 250ms for 95% of standard CRUD requests under nominal load. | Performance | `backend/bahub_backend/settings.py` (caching, `CONN_MAX_AGE=600`) | Core API | **HIGH** | Average response time for `GET /api/v1/requirements/` measured at < 200ms in load tests. | **VERIFIED** |
| **NFR-002** | The platform shall enforce API rate limiting protecting authentication and write endpoints from brute-force attacks. | Reliability & Security | `backend/bahub_backend/settings.py` (lines 382–397) | Core API | **HIGH** | Anonymous login requests exceeding 10 requests per minute receive HTTP 429 Too Many Requests. | **IMPLEMENTED** |
| **NFR-003** | The frontend application shall support responsive layout rendering across desktop and tablet viewports down to 768px. | Usability | `frontend/src/components/layout/DashboardShell.tsx`, `index.css` | Frontend | **MEDIUM**| App navigation shell collapses into an icon-based or slide-over drawer on tablet screens. | **IMPLEMENTED** |
| **NFR-004** | The platform shall maintain 99.9% uptime with automated health check probes. | Availability | `backend/bahub_backend/urls.py` (lines 16–22), `core/views.py:health_check` | DevOps | **HIGH** | `GET /api/v1/health` returns HTTP 200 `{ "status": "healthy", "database": "connected" }`. | **IMPLEMENTED** |

---

## 6. Technical Requirements (TR)

| Req ID | Requirement Statement | Architectural Purpose | Repository Evidence | Module | Priority | Acceptance Criteria | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TR-001** | All database entities shall inherit from `BaseModel` providing UUIDv4 primary keys, automatic timestamps, and soft delete capability. | Uniform auditability and zero physical data loss on deletion. | `backend/core/models.py:BaseModel` | Core | **CRITICAL**| Calling `.delete()` on a Requirement sets `is_deleted=True` without dropping the database row. | **IMPLEMENTED** |
| **TR-002** | The backend shall run on Python 3.13+ and Django 4.2 LTS, exposing REST endpoints via Django REST Framework. | Long-term support and ecosystem stability. | `backend/requirements.txt` | Core | **HIGH** | Backend passes all unit test suites under Python 3.13 without deprecation warnings. | **IMPLEMENTED** |
| **TR-003** | The frontend shall be authored in strict TypeScript adhering to React 18 component patterns and bundled via Vite. | Type safety and rapid developer build loops. | `frontend/tsconfig.json`, `package.json` | Frontend | **HIGH** | `npm run build` compiles with zero TypeScript compilation errors. | **IMPLEMENTED** |

---

## 7. Data Requirements (DR)

| Req ID | Requirement Statement | Data Integrity Rule | Repository Evidence | Module | Priority | Acceptance Criteria | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DR-001** | The system shall enforce composite uniqueness on `(project, req_id)` across all requirements. | Prevent duplicate keys within a single project scope. | `backend/requirements/models.py` (line 74) | Requirements | **HIGH** | Attempting to insert duplicate `REQ-001` within the same project raises a database integrity error. | **IMPLEMENTED** |
| **DR-002** | The system shall cascade-delete project child entities when an organization container is purged. | Prevent orphaned records across multi-tenant boundaries. | `backend/projects/models.py` (line 18: `on_delete=CASCADE`) | Projects | **HIGH** | Purging an organization cleanses all associated projects, requirements, stories, and UAT cases. | **IMPLEMENTED** |

---

## 8. Integration Requirements (INT)

| Req ID | Requirement Statement | Integration Objective | Repository Evidence | Module | Priority | Acceptance Criteria | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **INT-001** | The system shall securely store third-party Jira Cloud and Confluence API tokens encrypted at rest using AES-128 Fernet cryptography. | Protect enterprise customer external credentials from database theft. | `backend/integrations/models.py:EncryptedCharField` | Integrations | **CRITICAL**| Database inspection shows token stored as ciphertext (`gAAAAA...`); decrypted only in application memory. | **IMPLEMENTED** |
| **INT-002** | The system shall push user stories to Jira Cloud REST API and capture the generated Jira Issue Key. | Bi-directional synchronization between BAHub backlog and developer sprints. | `backend/integrations/views.py`, `backend/stories/models.py` | Integrations | **HIGH** | Clicking "Sync to Jira" generates an issue in target Jira project and updates `story.jira_key`. | **IMPLEMENTED** |
| **INT-003** | The system shall process Stripe checkout webhook events to automatically upgrade tenant subscription tiers. | Automated SaaS subscription provisioning and payment reconciliation. | `backend/billing/views.py:StripeWebhookView`, `models.py` | Billing | **HIGH** | `checkout.session.completed` event automatically transitions `plan_tier` to `PRO` or `ENTERPRISE`. | **IMPLEMENTED** |

---

## 9. Security Requirements (SEC)

| Req ID | Requirement Statement | Security Governance Rule | Repository Evidence | Module | Priority | Acceptance Criteria | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-001** | The platform shall authenticate all API requests via stateless SimpleJWT Bearer tokens with refresh token rotation and blacklisting on logout. | Prevent token theft and unauthorized session reuse. | `backend/bahub_backend/settings.py` (lines 405–416) | Auth | **CRITICAL**| Logging out blacklists the refresh token in `token_blacklist`; subsequent refresh attempts return HTTP 401. | **IMPLEMENTED** |
| **SEC-002** | The system shall enforce an immutable SOC 2 compliant audit log recording user, IP, action, resource, and JSON delta changes for all mutations. | Non-repudiation audit trail for regulatory compliance. | `backend/audit/models.py:AuditLog`, `middleware.py` | Audit | **HIGH** | Updating a requirement title creates an `AuditLog` row capturing `{ "title": { "old": "X", "new": "Y" } }`. | **IMPLEMENTED** |
| **SEC-003** | Passwords must comply with enterprise complexity rules (Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character). | Prevent brute-force account compromise. | `backend/users/validators.py:EnterprisePasswordValidator` | Users | **HIGH** | Submitting a weak password during registration returns explicit validation errors. | **IMPLEMENTED** |

---

## 10. Reporting & AI Requirements (REP)

| Req ID | Requirement Statement | Analytical Capability | Repository Evidence | Module | Priority | Acceptance Criteria | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **REP-001** | The system shall compile structured markdown, native Word (.docx), and A4 PDF packages for BRD, FRD, and IEEE 830 specifications. | Client-ready deliverable distribution. | `backend/documents/views.py`, `backend/requirements.txt` | Documents | **HIGH** | Clicking "Download PDF" streams a valid A4 PDF document with table of contents and page numbers. | **IMPLEMENTED** |
| **REP-002** | The system shall provide an AI assistant capable of drafting user stories and Gherkin acceptance criteria based on project context. | AI-assisted backlog acceleration. | `backend/strategic/agent_orchestrator.py`, `backend/ai_orchestrator/` | AI Workspace | **HIGH** | Providing a requirement prompt generates formatted stories with valid Gherkin syntax (*Given/When/Then*). | **IMPLEMENTED** |
| **REP-003** | The system shall provide a PMO command center displaying cross-project portfolio metrics, active project counts, and risk distributions. | Executive portfolio visibility. | `backend/pmo/views.py:PortfolioAnalyticsViewSet`, `frontend/.../PMODashboard.tsx` | PMO | **MEDIUM**| Portfolio dashboard renders total requirements, active projects, and risk totals scoped to the organization. | **IMPLEMENTED** |
