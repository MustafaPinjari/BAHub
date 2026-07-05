# BAHub - Phase 9: Testing & Requirement Traceability Matrix (RTM)

This document contains UAT scenarios, positive/negative test cases, and the Requirement Traceability Matrix (RTM) for the **BAHub** workspace application.

---

## 1. User Acceptance Testing (UAT) Scenarios

### UAT Scenario 1: Collaborative Discovery Workshop
* **Goal**: Verify that a BA can map stakeholders, create requirements with sequential IDs, decompose them into user stories, and verify that typing indicators work.
* **Steps**:
  1. The BA registers a new organization and invites two team members.
  2. The BA creates Project Alpha, registers stakeholders, and assigns influence ratings.
  3. The BA and a developer open the Requirements Split Grid. The developer verifies that presence indicators appear for both users.
  4. The BA inputs five requirements and verifies that sequential IDs (`REQ-001` through `REQ-005`) generate correctly.
  5. The BA decomposes `REQ-001` into three User Stories and verifies they appear on the Agile Backlog board.

### UAT Scenario 2: Document Baseline & Sign-off Review
* **Goal**: Verify the compilation of project assets and the Product Owner sign-off flow.
* **Steps**:
  1. The BA opens the Document Generator and compiles a new BRD.
  2. The BA verifies that compiled requirements, stakeholders, and stories format correctly in the Markdown preview pane.
  3. The BA transitions the document status to `REVIEW`.
  4. The PO logs in, reviews the document, and clicks the "Sign Off" button.
  5. The system locks the document, sets the status to `SIGNED_OFF`, and records the signature details.
  6. The BA downloads the signed document as a PDF.

---

## 2. Test Cases (Functional, Positive, & Negative)

### 2.1 Positive Test Cases (Normal Operation)

| Test Case ID | Component | Description | Input Conditions | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-POS-001** | Authentication | User logs in using valid credentials. | Username: `analyst`, Password: `AnalystP@ss123` | JWT access and refresh tokens returned; user redirected to dashboard. | Pass |
| **TC-POS-002** | Requirements | Create requirement. | Title: `Core UI Grid`, Priority: `HIGH`, Project: Project Alpha | Database count increments, and a requirement is saved with ID `REQ-001`. | Pass |
| **TC-POS-003** | Document Compile | Export project document as PDF. | Click "Download PDF" on the BRD Compiler view. | PDF downloads in under 5 seconds with correct formatting. | Pass |
| **TC-POS-004** | Jira Integration | Synchronize backlog stories to Jira. | Valid Jira integration credentials saved; click "Sync Backlog". | Celery task completes. UserStory records updated with `jira_key` and `jira_url`. | Pass |

### 2.2 Negative Test Cases (Robustness & Security)

| Test Case ID | Component | Description | Input Conditions | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-NEG-001** | Multi-Tenancy | Access requirement from another organization via URL. | User logged in to Org X attempts to call GET `/api/v1/requirements/<uuid>` for Org Y. | API returns `404 Not Found` or `403 Forbidden` JSON envelope. | Pass |
| **TC-NEG-002** | Requirements | Attempt to save requirement with missing fields. | Submit requirement form with Title blank. | API returns `400 Bad Request` with field validation errors. | Pass |
| **TC-NEG-003** | Billing | Exceed seats limit on a free plan tier. | Invite a 6th user to an organization on the default free tier. | invitation blocked with an error message: "Seats limit exceeded. Upgrade to Pro." | Pass |
| **TC-NEG-004** | Integrations | Sync backlog with invalid Jira API token. | Set an invalid token in Integrations configuration and run sync. | Sync log status set to `FAILED` with error message in history logs. | Pass |

---

## 3. Requirement Traceability Matrix (RTM)

The matrix below maps Business Requirements down to Functional Requirements, Technical Specifications, and their corresponding validation Test Cases.

| Business Requirement (BR) | Functional Requirement (FR) | Tech Spec (SRS) | Verification Test Cases | Status |
| :--- | :--- | :--- | :--- | :--- |
| **BR-101: Secure Multi-Tenancy** | `FUNC-002: Project Scoping & Member RBAC` | `SRS Section 4.2: Database Isolation` | `TC-NEG-001` (Multi-Tenancy check) | Verified |
| **BR-102: Requirements Editor** | `FUNC-004: Notion Requirements Split Editor` | `SRS Section 2.2: Requirements API` | `TC-POS-002`, `TC-NEG-002` | Verified |
| **BR-103: Stakeholder Registry** | `FUNC-003: Stakeholder Matrix Grid` | `SRS Section 2.2: Stakeholders API` | `TC-POS-002` (Traceability mapping) | Verified |
| **BR-104: Backlog Sync** | `FUNC-005: Agile Backlog Board & User Story` | `SRS Section 2.3: JIRA Sync API` | `TC-POS-004`, `TC-NEG-004` | Verified |
| **BR-105: Document Compiler** | `FUNC-011: Document Publisher & PDF Compiler` | `SRS Section 2.3: Documents API` | `TC-POS-003` | Verified |
