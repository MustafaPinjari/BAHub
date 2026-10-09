# Business Analysis of System APIs & REST Architecture
## BAHub — Enterprise Interface Contracts & Business Functional Analysis
**Document Reference:** API-BA-BAHUB-2026-V1.0  
**Project:** BAHub (The AI-Powered Business Analyst Workspace)  
**Standard Adhered To:** OpenAPI 3.0 / RESTful Architecture / Business Analyst API Guide  
**Author:** Lead Technical Business Analyst / API Product Specialist  
**Status:** Baselined & Verified  

---

## 1. Executive Summary & Architectural Overview

The BAHub platform is built on a decoupled, client-server REST architecture. The backend (Django REST Framework) exposes stateless endpoints consumed by the React TypeScript frontend and external third-party webhooks.

### 1.1 Standard JSON Envelope Format
To ensure consistency across client integrations, every API endpoint wraps responses in a standardized enterprise JSON envelope (`core.responses.api_success` and `core.exceptions.custom_exception_handler`):
```json
{
  "success": true,
  "message": "Resource retrieved successfully.",
  "data": { ... },
  "errors": null
}
```

### 1.2 Authentication Protocol
All non-public endpoints require stateless SimpleJWT Bearer token authentication passed in the HTTP Authorization header: `Authorization: Bearer <access_token>`. Access tokens have a 60-minute default lifetime; refresh tokens have a 7-day lifetime with rotation on every refresh call.

---

## 2. Core Business API Catalog

### API 1: Requirements Management — Create & Auto-Sequence Requirement
*   **Endpoint:** `/api/v1/requirements/`
*   **HTTP Method:** `POST`
*   **Business Meaning (Why it matters to the business):**  
    Allows a Business Analyst to officially catalog a new business or technical specification under an active project. The system guarantees that every requirement is assigned an immutable, human-readable identifier (`REQ-001`) that can be cited in contracts, sprint backlogs, and UAT test scripts.
*   **Technical Implementation:**  
    Invokes `requirements.views.RequirementViewSet.create()`. Performs an atomic database transaction that locks project rows, calculates the next sequence key, and sets default status `DRAFT`.
*   **Primary Actor:** Business Analyst (`role="BUSINESS_ANALYST"`), Admin.
*   **Authentication & Permissions:** `IsAuthenticated`, Organization Member.
*   **Request Payload (Inputs):**
    ```json
    {
      "project": "a6ed0b03-120a-4559-9172-147284cefc85",
      "title": "PCI-DSS Compliant Payment Gateway Tokenization",
      "description": "All customer credit card numbers must be tokenized via Razorpay prior to storage.",
      "req_type": "NON_FUNCTIONAL",
      "priority": "HIGH",
      "source_stakeholder": "b8f10b03-220a-4559-9172-147284cefc99"
    }
    ```
*   **Response Payload (Outputs):** HTTP 201 Created
    ```json
    {
      "success": true,
      "message": "Requirement created successfully.",
      "data": {
        "id": "e4f80c12-330b-4660-8182-258395deea11",
        "req_id": "REQ-012",
        "title": "PCI-DSS Compliant Payment Gateway Tokenization",
        "req_type": "NON_FUNCTIONAL",
        "priority": "HIGH",
        "status": "DRAFT",
        "version": "1.0",
        "created_at": "2026-10-01T10:15:30Z"
      },
      "errors": null
    }
    ```
*   **Business Rules & Validations:**
    *   `title` cannot be empty (max 255 characters).
    *   `source_stakeholder` must belong to the user's organization.
    *   Sequence ID format strictly enforced as `REQ-###`.
*   **Error Cases:**
    *   `400 Bad Request`: Missing required fields or invalid choice enum.
    *   `402 Payment Required`: Tenant organization subscription is expired or unverified.
*   **Stakeholder Impact:** Eliminates spreadsheet numbering conflicts; ensures 100% auditability for compliance officers.

---

### API 2: Agile Story Decomposition — Create Child User Story
*   **Endpoint:** `/api/v1/stories/`
*   **HTTP Method:** `POST`
*   **Business Meaning:**  
    Translates an approved functional requirement into a sprint-ready agile user story formatted with Gherkin acceptance criteria (*Given/When/Then*) and Fibonacci story points for developer execution.
*   **Technical Implementation:**  
    Invokes `stories.views.UserStoryViewSet.create()`. Validates that the referenced parent `requirement_id` exists within the project, calculates the project-scoped story key (`US-###`), and sets default Kanban status `TODO`.
*   **Primary Actor:** Product Owner (`role="PRODUCT_OWNER"`), Business Analyst.
*   **Request Payload (Inputs):**
    ```json
    {
      "requirement": "e4f80c12-330b-4660-8182-258395deea11",
      "title": "Tokenize Card on Checkout",
      "role": "Checkout Customer",
      "action": "submit credit card details securely",
      "benefit": "my sensitive financial data is never exposed to intermediate servers",
      "acceptance_criteria": "Given a valid credit card, When the user clicks Pay, Then a token is returned.",
      "points": 5
    }
    ```
*   **Response Payload (Outputs):** HTTP 201 Created
    ```json
    {
      "success": true,
      "message": "User story created successfully.",
      "data": {
        "id": "c7a10d23-441c-4771-9293-369406effb22",
        "story_id": "US-008",
        "requirement": "e4f80c12-330b-4660-8182-258395deea11",
        "title": "Tokenize Card on Checkout",
        "status": "TODO",
        "points": 5,
        "jira_key": null
      }
    }
    ```
*   **Business Rules:**
    *   `points` must be one of `[1, 2, 3, 5, 8, 13]`.
    *   Every user story must possess a valid parent requirement; orphaned stories are rejected.

---

### API 3: External Integrations — Push Story to Atlassian Jira Cloud
*   **Endpoint:** `/api/v1/integrations/jira/sync-story/`
*   **HTTP Method:** `POST`
*   **Business Meaning:**  
    Bridges the gap between business analysis and engineering execution. Synchronizes a user story directly to the engineering team's Atlassian Jira board, returning the Jira issue key (e.g. `PAY-108`) for live cross-referencing.
*   **Technical Implementation:**  
    Invokes `integrations.views.JiraIntegrationViewSet.sync_story()`. Retrieves encrypted Jira credentials from `IntegrationConfig`, decrypts token using AES-128 Fernet, dispatches HTTPS REST call to Jira Cloud API v3, and stores returned `jira_key` and `jira_url` on `UserStory`.
*   **Primary Actor:** Product Owner, Lead Business Analyst.
*   **Authentication & Permissions:** `IsAuthenticated`, `IsEnterprise` (Restricted to Enterprise tier).
*   **Request Payload (Inputs):**
    ```json
    {
      "story_id": "c7a10d23-441c-4771-9293-369406effb22"
    }
    ```
*   **Response Payload (Outputs):** HTTP 200 OK
    ```json
    {
      "success": true,
      "message": "Story synchronized with Jira Cloud successfully.",
      "data": {
        "story_id": "US-008",
        "jira_key": "PAY-108",
        "jira_url": "https://apex-enterprise.atlassian.net/browse/PAY-108"
      }
    }
    ```
*   **Error Cases:**
    *   `403 Forbidden`: Organization subscription tier is Free or Pro (Upgrade prompt triggered).
    *   `502 Bad Gateway`: Jira Cloud API returned 401 Unauthorized or 404 Project Not Found.
*   **Stakeholder Impact:** Eliminates 15 minutes of manual re-typing per story; ensures developers build against exact acceptance criteria.

---

### API 4: Specification Compilers — Generate BRD/FRD Document
*   **Endpoint:** `/api/v1/documents/compile/`
*   **HTTP Method:** `POST`
*   **Business Meaning:**  
    Solves the largest administrative bottleneck in business analysis. Compiles an entire, professional Business Requirements Document (BRD) or Functional Requirements Document (FRD) directly from live database records in seconds.
*   **Technical Implementation:**  
    Invokes `documents.views.BusinessDocumentViewSet.compile()`. Executes an optimized SQL query utilizing `select_related` across projects, stakeholders, requirements, stories, and risks; generates structured markdown; and saves a new `BusinessDocument` record in status `DRAFT`.
*   **Primary Actor:** Business Analyst.
*   **Request Payload (Inputs):**
    ```json
    {
      "project": "a6ed0b03-120a-4559-9172-147284cefc85",
      "doc_type": "BRD",
      "title": "Customer Loyalty & Rewards System - Official BRD",
      "version": "1.0"
    }
    ```
*   **Response Payload (Outputs):** HTTP 201 Created
    ```json
    {
      "success": true,
      "message": "BRD compiled successfully.",
      "data": {
        "id": "f5e90a34-552d-4882-a3a4-470517faac33",
        "doc_type": "BRD",
        "title": "Customer Loyalty & Rewards System - Official BRD",
        "version": "1.0",
        "status": "DRAFT",
        "created_by": "David Miller",
        "content_length_chars": 18450
      }
    }
    ```
*   **Stakeholder Impact:** Saves 10–15 hours of manual assembly per sprint; guarantees zero mismatch between database and formal specification.

---

### API 5: Document Governance — Digital Sign-off Authorization
*   **Endpoint:** `/api/v1/documents/{id}/sign-off/`
*   **HTTP Method:** `POST`
*   **Business Meaning:**  
    Provides executive governance and legal baselining. Formally locks a specification document, certifying that product management and business sponsors have reviewed and approved the requirements for development.
*   **Technical Implementation:**  
    Validates user role is `PRODUCT_OWNER` or `ADMIN`. Updates `BusinessDocument.status="SIGNED_OFF"`, records `signed_off_by=request.user`, `signed_off_at=timezone.now()`, and locks content from subsequent edits.
*   **Primary Actor:** Product Owner, Administrator.
*   **Response Payload (Outputs):** HTTP 200 OK
    ```json
    {
      "success": true,
      "message": "Document successfully authorized and signed off.",
      "data": {
        "id": "f5e90a34-552d-4882-a3a4-470517faac33",
        "status": "SIGNED_OFF",
        "signed_off_by": "Sarah Jenkins",
        "signed_off_at": "2026-10-01T14:22:10Z",
        "is_immutable": true
      }
    }
    ```
*   **Business Rules:**
    *   `BRULE-DOC-001`: Once signed off, the document content is permanently read-only; subsequent changes require version branching.

---

### API 6: Quality Assurance — Log UAT Defect
*   **Endpoint:** `/api/v1/uat/defects/`
*   **HTTP Method:** `POST`
*   **Business Meaning:**  
    Captures defects discovered during User Acceptance Testing and binds them directly to the failing test case and parent business requirement for root-cause visibility.
*   **Technical Implementation:**  
    Invokes `uat.views.DefectViewSet.create()`. Inserts record into `defects` table with foreign key pointing to `TestCase` and automatically updates requirement verification state.
*   **Primary Actor:** QA Tester (`role="QA_TESTER"`).
*   **Request Payload (Inputs):**
    ```json
    {
      "test_case": "d8b21e45-663e-4993-b4b5-5816280bbd44",
      "title": "Payment gateway timeout on 3D Secure verification",
      "description": "When an OTP takes > 30 seconds to arrive, the checkout session drops connection rather than waiting.",
      "severity": "CRITICAL"
    }
    ```
*   **Response Payload (Outputs):** HTTP 201 Created
    ```json
    {
      "success": true,
      "message": "UAT defect logged successfully.",
      "data": {
        "id": "b9c32f56-774f-4aa4-c5c6-6927391cce55",
        "title": "Payment gateway timeout on 3D Secure verification",
        "severity": "CRITICAL",
        "status": "OPEN",
        "test_case_id": "d8b21e45-663e-4993-b4b5-5816280bbd44"
      }
    }
    ```
*   **Stakeholder Impact:** Highlights broken requirements immediately in the Traceability Matrix; prevents shipping critical bugs to end users.
