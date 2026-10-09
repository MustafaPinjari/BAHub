# Functional Requirements Document (FRD)
## BAHub — System Behavioral Specifications & Functional Architecture
**Document Reference:** FRD-BAHUB-2026-V1.0  
**Project ID:** PRJ-BAHUB-CORE  
**Date:** October 2026  
**Document Status:** Baselined / Engineering Approved  
**Author:** Senior Technical Business Analyst / Systems Analyst  

---

## 1. Document Overview & Architectural Context

This Functional Requirements Document (FRD) defines the granular software behaviors, technical workflows, validation logic, boundary conditions, and acceptance criteria for **BAHub**. Grounded in the codebase (`backend/` Django REST Framework services and `frontend/src/` React TypeScript components), this document bridges the high-level business objectives specified in the BRD with the technical implementation executed by engineering.

Every functional specification in this document follows standard engineering format:
*   Preconditions & Triggers
*   Main Success Flow, Alternative Flows, and Exception Handling
*   Input/Output Data Contracts
*   Explicit Business Rules
*   Gherkin Acceptance Criteria (*Given / When / Then*)

---

## 2. Functional Feature Specifications

### Feature FRD-01: Auto-Sequenced Requirements Backlog Management
*   **Requirement ID:** `FR-001`
*   **Module:** Requirements Engineering (`backend/requirements/`)
*   **Feature Name:** Notion-Style Inline Requirements Grid & Auto-ID Sequencing
*   **Description:** Allows Business Analysts to author, view, filter, and inline-edit project requirements with database-level sequential ID generation (`REQ-001`).
*   **Primary Actor:** Business Analyst (`role="BUSINESS_ANALYST"`), Admin, Product Owner.
*   **Preconditions:**
    1.  User is authenticated with a valid SimpleJWT Bearer token.
    2.  User belongs to an Organization with an active subscription.
    3.  A Project has been selected in the active workspace context.
*   **Trigger:** User navigates to `/requirements` and clicks "+ New Requirement" or modifies an inline table cell.
*   **Main Success Flow:**
    1.  User enters Requirement Title, Description, Type (`FUNCTIONAL`, `NON_FUNCTIONAL`, `TECHNICAL`, `UI`), Priority (`HIGH`, `MEDIUM`, `LOW`), and optional Source Stakeholder.
    2.  Frontend dispatches `POST /api/v1/requirements/` with payload.
    3.  Backend `Requirement.save()` method executes within an atomic database transaction.
    4.  Backend queries existing requirements in the project (including soft-deleted records via `all_with_deleted()`) and calculates sequence number `N + 1`.
    5.  Requirement is saved with `req_id=f"REQ-{count+1:03d}"`, `status="DRAFT"`, and `version="1.0"`.
    6.  Audit logger records a `CREATE` event capturing user ID, IP address, and timestamp.
    7.  Backend returns HTTP 201 Created with standardized JSON envelope.
    8.  Frontend updates the Notion-style grid and displays the new row.
*   **Alternative Flow (Inline Cell Modification):**
    1.  User clicks an existing requirement cell (e.g. Priority or Status) in the grid.
    2.  User selects a new value from the dropdown.
    3.  Frontend debounces and dispatches `PATCH /api/v1/requirements/{id}/`.
    4.  Backend validates field choice, updates `updated_at`, logs field changes in `AuditLog.changes`, and returns HTTP 200 OK.
*   **Exception Flows:**
    *   *E1 (Blank Title):* User leaves title empty. Backend returns HTTP 400 Bad Request: `{"errors": {"title": ["This field may not be blank."]}}`.
    *   *E2 (Cross-Tenant Stakeholder Link):* User links a stakeholder belonging to another organization. Backend returns HTTP 400 Bad Request: `{"errors": {"source_stakeholder": ["Stakeholder not found in organization."]}}`.
*   **Inputs:** `project` (UUID), `title` (str, max 255), `description` (str), `req_type` (str), `priority` (str), `source_stakeholder` (UUID, optional).
*   **Outputs:** Created `Requirement` object: `id` (UUID), `req_id` (str), `title`, `status`, `created_at`.
*   **Business Rules:**
    *   `BRULE-REQ-001`: Requirement IDs must follow `REQ-###` zero-padded to 3 digits and must be unique per project.
    *   `BRULE-REQ-002`: Soft-deleted requirements must be factored into ID sequence calculation to prevent key reuse.
*   **Acceptance Criteria:**
    ```gherkin
    Scenario: Successful creation of a sequential requirement
      Given an authenticated Business Analyst working in project "Loyalty Platform"
      And the project currently contains 4 historical requirements
      When the analyst submits a new functional requirement with title "Real-time Point Accrual"
      Then the system assigns the unique ID "REQ-005"
      And the requirement status defaults to "DRAFT"
      And an audit log record is created documenting the creation event.
    ```

---

### Feature FRD-02: Agile User Story Mapping & Jira Board Synchronization
*   **Requirement ID:** `FR-002`, `INT-002`
*   **Module:** Agile Backlog & External Integrations (`backend/stories/`, `backend/integrations/`)
*   **Feature Name:** Story Decomposition with Gherkin AC and Bi-Directional Jira Sync
*   **Description:** Decomposes approved requirements into agile user stories, manages Kanban workflow states, and pushes stories directly to Atlassian Jira Cloud boards.
*   **Primary Actor:** Product Owner (`role="PRODUCT_OWNER"`), Business Analyst.
*   **Preconditions:**
    1.  Parent requirement exists in status `APPROVED` or `REVIEW`.
    2.  For Jira sync: Project must have valid Jira credentials configured in `IntegrationConfig`.
*   **Trigger:** User creates a story on the Kanban board (`/stories`) or triggers "Sync to Jira".
*   **Main Success Flow:**
    1.  User enters Role (*As a...*), Action (*I want to...*), Benefit (*So that...*), Gherkin Acceptance Criteria, and Fibonacci Story Points (1, 2, 3, 5, 8, 13).
    2.  Backend calculates sequential Story ID (`US-###`) scoped to the parent requirement's project.
    3.  Story appears in `TODO` column on Kanban board.
    4.  User clicks "Sync to Jira" on story card.
    5.  Backend loads project `IntegrationConfig`, decrypts `jira_api_token` using AES-128 Fernet, and calls Jira REST API `/rest/api/3/issue`.
    6.  Jira returns created issue key (e.g. `PROJ-142`) and issue URL.
    7.  Backend saves `jira_key` and `jira_url` to the `UserStory` model and returns HTTP 200 OK.
*   **Alternative Flow (Kanban Drag-and-Drop):**
    1.  User drags a story card from `TODO` to `IN_PROGRESS` or `QA`.
    2.  Frontend dispatches `PATCH /api/v1/stories/{id}/` updating `status`.
    3.  Backend updates record and triggers activity log update.
*   **Exception Flows:**
    *   *E1 (Invalid Jira Credentials):* External Jira API returns HTTP 401 Unauthorized. Backend catches exception, logs failure, and returns HTTP 502 Bad Gateway: `{"message": "Failed to authenticate with Jira Cloud API. Please verify stored credentials."}`.
    *   *E2 (Orphan Story Attempt):* User attempts to save story without parent requirement foreign key. Backend rejects with HTTP 400 Bad Request.
*   **Business Rules:**
    *   `BRULE-STRY-001`: User story points must conform strictly to the Fibonacci scale: `[1, 2, 3, 5, 8, 13]`.
    *   `BRULE-STRY-002`: Jira sync is strictly restricted to organizations with an active `ENTERPRISE` subscription tier.
*   **Acceptance Criteria:**
    ```gherkin
    Scenario: Pushing a user story to Atlassian Jira
      Given an Enterprise organization with verified Jira Cloud credentials
      And a user story "US-012" linked to approved requirement "REQ-003"
      When the Product Owner clicks "Sync to Jira"
      Then the backend decrypts the stored Jira API token
      And dispatches a REST POST request to Jira creating issue type "Story"
      And the story record is updated with the returned Jira key "LOYALTY-88"
      And the story card renders a direct link to the Jira ticket.
    ```

---

### Feature FRD-03: Automated Document Compilation & Digital Sign-off
*   **Requirement ID:** `FR-005`, `REP-001`
*   **Module:** Document Compilers & Governance (`backend/documents/`)
*   **Feature Name:** Multi-Entity Specification Compilation & Sign-off Engine
*   **Description:** Aggregates requirements, user stories, stakeholders, risks, and strategic analyses from the database into structured BRD/FRD/IEEE specifications and captures immutable sign-offs.
*   **Primary Actor:** Business Analyst (Compilation/Author), Product Owner (Signatory).
*   **Preconditions:** Project has at least one requirement, stakeholder, and project profile.
*   **Trigger:** User clicks "Compile Document" on `/brd` or `/frd`.
*   **Main Success Flow:**
    1.  User selects document type (`BRD`, `FRD`, `IEEE`), inputs title and target version (`1.0`).
    2.  Backend Compilation Engine initiates optimized SQL query fetching all project entities.
    3.  Backend Markdown Assembler stitches sections: Executive Summary, Stakeholder Matrix, Functional Backlog, User Stories, Risk Register.
    4.  Document record is saved in `BusinessDocument` table with status `DRAFT`.
    5.  BA edits or enriches document content in `RichDocumentEditor.tsx`.
    6.  BA transitions status to `REVIEW`.
    7.  Product Owner reviews completed document and clicks "Authorize & Sign Off".
    8.  System updates `status="SIGNED_OFF"`, records `signed_off_by=user`, and timestamps `signed_off_at=timezone.now()`.
    9.  User clicks "Export A4 PDF"; backend streams formatted PDF binary via `WeasyPrint`.
*   **Exception Flows:**
    *   *E1 (Unauthorized Sign-off):* A user with role `DEVELOPER` or `QA_TESTER` clicks sign-off. Backend rejects with HTTP 403 Forbidden: `{"message": "Only Product Owners or Administrators may execute formal sign-offs."}`.
    *   *E2 (Post-Sign-off Edit Attempt):* User attempts to update text on a `SIGNED_OFF` document. Backend returns HTTP 400 Bad Request: `{"message": "Signed-off documents are immutable. Please create a new version."}`.
*   **Acceptance Criteria:**
    ```gherkin
    Scenario: Formal sign-off on a Business Requirements Document
      Given a Business Analyst has compiled a BRD currently in status "REVIEW"
      When the assigned Product Owner reviews the document and clicks "Authorize & Sign Off"
      Then the document status updates to "SIGNED_OFF"
      And the signatory's user ID and timestamp are permanently recorded
      And the document content is locked from subsequent edits
      And the export options (PDF/Word) become fully enabled.
    ```

---

### Feature FRD-04: End-to-End User Acceptance Testing (UAT) & Defect Lifecycle
*   **Requirement ID:** `SR-003`, `FR-006`
*   **Module:** UAT & Quality Assurance (`backend/uat/`)
*   **Feature Name:** UAT Test Case Authoring, Execution Logging & Defect Tracking
*   **Description:** Manages the verification of business requirements through structured UAT test cases, records pass/fail runs, and binds defects to failing requirements.
*   **Primary Actor:** QA Tester (`role="QA_TESTER"`), Business Stakeholder.
*   **Preconditions:** Requirements exist in the selected project.
*   **Trigger:** User navigates to `/uat` and clicks "+ New Test Case" or logs a test run.
*   **Main Success Flow:**
    1.  QA authors test case specifying Title, Scenario, Acceptance Criteria, and links parent `Requirement`.
    2.  Test Case is created with default status `PENDING`.
    3.  During test execution, user clicks "Mark as Passed" or "Mark as Failed".
    4.  If marked `PASSED`: Status updates to `PASSED`; Traceability Matrix reflects verified status.
    5.  If marked `FAILED`: Status updates to `FAILED`; user clicks "Report Defect".
    6.  Defect modal opens; user inputs Defect Title, Description, and Severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
    7.  Backend saves `Defect` entity with foreign key pointing to `TestCase`.
    8.  Traceability Matrix highlights requirement row with a red defect indicator badge.
*   **Acceptance Criteria:**
    ```gherkin
    Scenario: Logging a critical defect during UAT execution
      Given an active test case "TC-004" linked to requirement "REQ-002"
      When the QA Tester executes the scenario and marks the result as "FAILED"
      And logs a defect with severity "CRITICAL" and summary "Database deadlock on concurrent points checkout"
      Then the test case status is set to "FAILED"
      And the defect record is linked to both the test case and parent requirement
      And the Traceability Matrix flags the requirement with a critical defect badge.
    ```

---

### Feature FRD-05: Multi-Tenant Subscription & Seat Quota Enforcement
*   **Requirement ID:** `BR-002`, `BR-003`
*   **Module:** Billing & Core Middleware (`backend/billing/`, `backend/core/middleware.py`)
*   **Feature Name:** Subscription Verification & Grace Period Middleware
*   **Description:** Global DRF middleware that validates tenant plan tier, active subscription status, and seat limits before allowing access to restricted endpoints.
*   **Primary Actor:** System Middleware (Automated Guard).
*   **Main Success Flow:**
    1.  API request arrives at Django backend with JWT token.
    2.  `SubscriptionMiddleware` resolves user and user's tenant `Organization`.
    3.  Middleware queries `TenantSubscription` for the organization.
    4.  If `plan_tier == "FREE"`: Validates total active members <= 5 seats and daily AI credits <= 30.
    5.  If `plan_tier in ["PRO", "ENTERPRISE"]`: Validates `is_active=True` and `plan_verified=True`.
    6.  If subscription is `past_due`, middleware checks `expires_at`: if within 3-day grace period, request proceeds with warning header; if beyond 3 days, request is blocked with HTTP 402 Payment Required.
*   **Acceptance Criteria:**
    ```gherkin
    Scenario: Blocking an unverified paid tier organization
      Given an organization that selected "PRO" tier
      And the subscription field "plan_verified" is False
      When a user from that organization dispatches an API request to "/api/v1/requirements/"
      Then the SubscriptionMiddleware intercepts the request
      And returns HTTP 402 Payment Required
      And the response body explains that payment verification is pending.
    ```
