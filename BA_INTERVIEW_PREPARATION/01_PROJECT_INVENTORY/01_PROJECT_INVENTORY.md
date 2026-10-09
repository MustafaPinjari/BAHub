# BAHub — Comprehensive Project Inventory & Architectural Audit
**Document ID:** INV-BAHUB-001  
**Classification:** Internal Technical Business Analysis Audit  
**Date of Audit:** October 2026  
**Auditor / Lead Technical BA:** Senior Solutions & Business Analyst (15+ Yrs Experience Standard)  
**System Evaluated:** BAHub (The AI-Powered Business Analyst Workspace)

---

## 1. Executive Summary & Identity

*   **Project Name:** BAHub (The AI-Powered Business Analyst Workspace)
    *   *Evidence:* `README.md` (lines 4–9), `package.json` (`"name": "bahub-frontend"`), `backend/bahub_backend/settings.py` (lines 208, 222).
*   **Project Type:** Multi-Tenant Enterprise B2B SaaS Collaboration & Requirements Lifecycle Management Platform.
    *   *Evidence:* `backend/organizations/models.py` (`Organization` container), `backend/core/middleware.py` (`SubscriptionMiddleware`), `frontend/src/App.tsx`.
*   **Business Domain:** Enterprise Agile Lifecycle Management (ALM), Requirements Engineering, Product Management Tooling, Business Architecture, and Governance/Compliance (SOC 2 / ISO audit trails).
    *   *Evidence:* `documentation/phase1_business_understanding.md` (lines 1–22), `README.md` (lines 53–78).
*   **Business Purpose:** Eliminates acute fragmentation in the business analysis function by unifying stakeholder management, requirements gathering, user stories, strategic SWOT/GAP modeling, BPMN/ERD process diagrams, UAT test execution, risk management, and formal BRD/FRD/IEEE 830 document compilation with Jira and Confluence bidirectional synchronization.
    *   *Evidence:* `README.md` (lines 23–35), `backend/requirements/models.py`, `backend/stories/models.py`, `backend/documents/models.py`, `backend/integrations/models.py`.

---

## 2. Target Users & Stakeholders

### Target Primary End Users
1.  **Lead & Senior Business Analysts (BAs):** Author requirements, maintain Notion-style backlog grids, model As-Is/To-Be workflows, and compile BRDs/FRDs.
    *   *Evidence:* `backend/users/models.py` (role `BUSINESS_ANALYST`), `frontend/src/features/requirements/RequirementsPage.tsx`.
2.  **Product Owners / Product Managers (POs/PMs):** Decompose specifications into Fibonacci-estimated user stories, prioritize Kanban boards, track sprint velocity, and formally sign off on BRDs/FRDs.
    *   *Evidence:* `backend/users/models.py` (role `PRODUCT_OWNER`), `backend/stories/models.py`, `backend/documents/models.py` (`signed_off_by`, `signed_off_at`).
3.  **Software Engineers / Tech Leads (Devs):** Consume developer-ready user stories with Gherkin acceptance criteria, review technical constraints, and synchronize tickets via Jira.
    *   *Evidence:* `backend/users/models.py` (role `DEVELOPER`), `backend/stories/models.py` (`jira_key`, `jira_url`).
4.  **QA / UAT Test Engineers:** Author test cases mapped to requirements, execute test scenarios (Passed/Failed/Pending), and log defects with severity ratings.
    *   *Evidence:* `backend/users/models.py` (role `QA_TESTER`), `backend/uat/models.py` (`TestCase`, `Defect`).
5.  **Executive Business Stakeholders & Clients:** Participate in discovery meetings, review power/interest positioning, track change requests, and provide digital sign-off.
    *   *Evidence:* `backend/users/models.py` (role `STAKEHOLDER`), `backend/stakeholders/models.py`, `backend/risks/models.py` (`ChangeRequest`).
6.  **Tenant Workspace Administrators:** Configure organization settings, manage team seats, monitor active sessions, and oversee billing/subscription limits.
    *   *Evidence:* `backend/users/models.py` (role `ADMIN`), `backend/billing/models.py`, `backend/users/models.py` (`UserSession`).

---

## 3. Technology Stack & Component Inventory

### 3.1 Frontend Architecture
*   **Core Framework:** React 18.2 with Vite (Strict TypeScript `tsconfig.json`).
    *   *Evidence:* `frontend/package.json` (`"react": "^18.2.0"`, `"vite": "^5.0.0"`).
*   **Routing & Layout:** React Router DOM v6 with declarative nested routing, code-splitting via `React.lazy()` and `Suspense`, wrapped in an enterprise `ErrorBoundary`.
    *   *Evidence:* `frontend/src/App.tsx` (lines 16–42, 91–140).
*   **State Management & Data Fetching:** TanStack React Query v4 + Axios with custom request/response interceptors for JWT automatic token refresh.
    *   *Evidence:* `frontend/src/services/api.ts` (lines 1–85), `frontend/package.json`.
*   **UI Components & Styling:** Tailwind CSS v3 with dynamic color tokens, Clsx, Lucide React icons, and Framer Motion micro-interactions.
    *   *Evidence:* `frontend/src/index.css`, `frontend/tailwind.config.js`, `frontend/package.json`.
*   **Diagramming & Visual Modeling Canvas:** ReactFlow (@xyflow/react) for interactive node-edge workflow canvases, ERDs, and knowledge graphs; Mermaid.js integration for code-to-diagram rendering.
    *   *Evidence:* `frontend/src/features/diagrams/DiagramsPage.tsx`, `backend/diagrams/models.py` (`canvas_json`, `source_code`).
*   **Rich Text Document Editing:** Rich Markdown and structured document editor for live BRD/FRD/IEEE document composition.
    *   *Evidence:* `frontend/src/components/common/RichDocumentEditor.tsx`.

### 3.2 Backend Architecture
*   **Core Framework:** Django 4.2+ running on Python 3.13+ with Django REST Framework (DRF).
    *   *Evidence:* `backend/requirements.txt` (`Django>=4.2,<5.0`, `djangorestframework>=3.14.0`), `backend/bahub_backend/settings.py`.
*   **API Response Protocol:** Standardized JSON Envelope Wrapping (`core.responses.api_success` and `core.exceptions.custom_exception_handler`) returning `{ "success": boolean, "data": ..., "message": ..., "errors": ... }`.
    *   *Evidence:* `backend/core/responses.py`, `backend/core/exceptions.py`.
*   **Base Model Architecture:** `core.models.BaseModel` supplying UUIDv4 primary keys, automatic `created_at`/`updated_at` audit timestamps, and soft-delete capabilities (`is_deleted=True`) with custom managers (`all_with_deleted()`).
    *   *Evidence:* `backend/core/models.py` (lines 1–48).
*   **Relational Database:** SQLite 3 for local development; PostgreSQL via `dj_database_url` for production cloud deployments with connection pooling (`CONN_MAX_AGE=600`).
    *   *Evidence:* `backend/bahub_backend/settings.py` (lines 234–277).
*   **Asynchronous & WebSockets Layer:** ASGI support via Daphne and Django Channels (`CHANNEL_LAYERS` configured with `InMemoryChannelLayer` for local dev and Redis for production).
    *   *Evidence:* `backend/bahub_backend/settings.py` (lines 95, 187–225), `backend/bahub_backend/asgi.py`.
*   **Authentication & Session Management:** SimpleJWT with token blacklisting, refresh token rotation, custom `EnterprisePasswordValidator`, and active session logging tracking IP address, User-Agent, and device metadata.
    *   *Evidence:* `backend/bahub_backend/settings.py` (lines 401–416), `backend/users/models.py` (`UserSession`, `EmailOTP`).
*   **Enterprise SSO:** SAML 2.0 Integration via `django_saml2_auth` mounted at `/saml2_auth/`.
    *   *Evidence:* `backend/bahub_backend/urls.py` (line 102), `backend/bahub_backend/settings.py` (line 126).
*   **Document Generation Engines:** `python-docx` for native Word (.docx) generation and `WeasyPrint` / HTML-to-PDF rendering engines for client-ready A4 documentation.
    *   *Evidence:* `backend/requirements.txt` (`python-docx`, `weasyprint`), `backend/documents/views.py`.
*   **Security & Encryption:** Cryptography Fernet symmetric encryption (`EncryptedCharField`) for third-party Jira/Confluence API tokens at rest; OWASP security headers middleware (CSP, X-Frame-Options, HSTS).
    *   *Evidence:* `backend/integrations/models.py` (lines 9–50), `backend/security_headers.py`.

---

## 4. Subsystems & Functional Modules

| Module / App | Path | Primary Responsibilities | Data Entities |
| :--- | :--- | :--- | :--- |
| **Organizations** | `backend/organizations/` | Multi-tenant scoping container, tenant isolation, workspace invitation workflows. | `Organization`, `OrganizationInvitation` |
| **Users & Auth** | `backend/users/` | RBAC role enforcement, SimpleJWT tokens, OTP email verification, session audit logs, waitlist registration, user UI preferences. | `User`, `UserPreference`, `UserSession`, `EmailOTP`, `WaitlistSignup` |
| **Projects** | `backend/projects/` | Workspace project containers, user membership mapping, attachments, and chronological activity feeds. | `Project`, `ProjectMember`, `ProjectAttachment`, `ActivityLog` |
| **Stakeholders** | `backend/stakeholders/` | Stakeholder registry, contact directory, 2x2 Power/Interest matrix coordinates, influence/impact ratings. | `Stakeholder` |
| **Requirements** | `backend/requirements/` | Notion-style backlog grid, auto-incrementing project-scoped IDs (`REQ-001`), categorization (Functional, Non-Functional, Technical, UI), priority, and status lifecycle. | `Requirement` |
| **Stories & Agile** | `backend/stories/` | User story mapping linked to parent requirements, auto-IDs (`US-001`), Gherkin acceptance criteria, Fibonacci story points (1, 2, 3, 5, 8, 13), Kanban board lanes. | `UserStory` |
| **Documents (BRD/FRD)**| `backend/documents/` | Automated document compiler assembling requirements, stories, and stakeholders into structured BRD/FRD/IEEE 830 specs; formal sign-off signatory audit trail. | `BusinessDocument`, `DocumentApprovalHistory`, `DocumentVersion` |
| **IEEE SRS** | `backend/srs/` | IEEE 830 compliant software requirements specification generator, structured sections, versioning, in-line review comments, and sign-offs. | `SRSDocument`, `SRSSection`, `SRSVersion`, `SRSComment`, `SRSApproval`, `SRSExport` |
| **Meetings & MoM** | `backend/meetings/` | Discovery meeting scheduler, Minutes of Meeting (MoM) logs, linked attendees, and trackable action items. | `Meeting`, `ActionItem` |
| **Risks & Changes** | `backend/risks/` | Probability-Impact risk registry (High/Medium/Low), mitigation planning, and formal Scope Change Request (CR) governance. | `Risk`, `ChangeRequest` |
| **Strategic Planning** | `backend/strategic/` | SWOT analysis 4-quadrant charter and Gap Analysis tracking (Current State, Future State, Gap Description, Action Plan). | `SWOTAnalysis`, `GapAnalysis` |
| **Diagrams & BPMN** | `backend/diagrams/` | Interactive ReactFlow canvas and Mermaid/PlantUML code-to-diagram generators; pessimistic diagram locking for team collaboration. | `Diagram`, `DiagramNode`, `DiagramComment`, `DiagramExport` |
| **UAT & Quality** | `backend/uat/` | End-to-end User Acceptance Testing test cases mapped to requirements, execution runs (Pending/Passed/Failed), and defect tracking. | `TestCase`, `Defect` |
| **Traceability Matrix**| `frontend/.../traceability/`| Complete bidirectional traceability matrix linking Requirements -> Stories -> Risks -> BRDs -> Test Cases -> Defects. | Virtual Aggregation Query (`select_related`) |
| **AI Orchestrator** | `backend/ai_orchestrator/` & `strategic/` | Multi-LLM runner (Google Gemini API & OpenAI API) with domain-aware offline mock fallback for drafting stories, test cases, and auditing gaps. | `AIJob`, `WorkflowExecution`, `KnowledgeNode`, `KnowledgeEdge` |
| **Integrations** | `backend/integrations/` | Encrypted credential vault for Jira, Confluence, and Slack; bidirectional ticket pushing and documentation syncing. | `IntegrationConfig` |
| **Billing & Quotas** | `backend/billing/` | Stripe checkout session integration, webhook handling, mock billing fallback, tier enforcement (Free: 5 seats / Pro: 20 seats / Enterprise: Unlimited), 3-day grace period. | `TenantSubscription`, `Payment`, `ProcessedWebhookEvent`, `PaymentAuditLog` |
| **Audit & Governance** | `backend/audit/` | SOC 2 compliant immutable audit trail logging user, IP, action, resource, and JSON delta changes. | `AuditLog` |
| **PMO Command Center** | `backend/pmo/` | Portfolio-level visibility, cross-project risk monitoring, and integration health metrics. | `PortfolioAnalyticsViewSet` |

---

## 5. Deployment, DevOps & Infrastructure

*   **Production Deployment Targets:**
    *   Backend: Render (`render.yaml`) or Docker container running Daphne ASGI server behind Gunicorn/Nginx.
        *   *Evidence:* `DEPLOY.md`, `render.yaml` (if present), `backend/bahub_backend/settings.py` (Render host detection).
    *   Frontend: Netlify (`netlify.toml`) deploying pre-compiled Vite static bundle.
        *   *Evidence:* `netlify.toml` in project root.
*   **Database:** PostgreSQL (production via Neon/Supabase/Render Postgres) or local SQLite (`backend/db.sqlite3`).
*   **Local Developer Automation:**
    *   `run_all.bat` / `run_all.sh`: Dual-process launcher for concurrent frontend and backend development.
    *   `seed_data.bat` / `backend/seed_rich_demo_data.py`: Deterministic database seeder populating 10 enterprise projects, 35+ users, requirements, stories, risks, and UAT test cases.

---

## 6. Testing Inventory & Verification Proof

*   **Backend Test Suites:** 179+ automated unit and integration tests across all Django apps verifying multi-tenant isolation, JWT sessions, password policies, auto-ID triggers, billing middleware, and UAT defect linking.
    *   *Evidence:* `backend/*/tests.py` (specifically `users/tests.py`, `uat/tests.py`, `stories/tests.py`, `teams/tests.py`, `srs/tests.py`, `strategic/tests.py`).
*   **Test Command:** `python manage.py test` (Pass rate: 100% verified across clean memory database test runners).

---

## 7. Known Architectural Limitations & Risks

1.  **AI Workspace Polling vs. Streaming:** AI workflows use a polling loop (`WorkflowExecution` status check every 2 seconds) rather than SSE or WebSocket streaming.
    *   *Evidence:* `LAUNCH_AUDIT.md` (lines 127–128), `strategic/agent_orchestrator.py`.
2.  **WebSocket Channel Layer in Development:** Django Channels defaults to `InMemoryChannelLayer` when `REDIS_URL` is empty, which does not scale across multi-instance clusters without Redis.
    *   *Evidence:* `backend/bahub_backend/settings.py` (lines 190–225).
3.  **Client-Side Hardcoded Demo Credentials:** Demo credentials (`analyst / AnalystP@ss123`) were previously embedded in client-side authentication bundles for quick reviewer demonstration.
    *   *Evidence:* `LAUNCH_AUDIT.md` (lines 49, 146).
4.  **Portfolio Analytics Hardcoded Metrics:** Certain PMO overview metrics (e.g. `average_risk_score: 4.5`, `integration_coverage_percent: 68`) are currently mocked in `backend/pmo/views.py`.
    *   *Evidence:* `backend/pmo/views.py` (lines 37–38).
