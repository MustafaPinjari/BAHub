# User Acceptance Testing (UAT) Test Cases Catalog
## BAHub — Business Acceptance Scenarios & Verification Execution Scripts
**Document Reference:** UAT-TC-BAHUB-2026-V1.0  
**Project:** BAHub (The AI-Powered Business Analyst Workspace)  
**Standard Adhered To:** IEEE 829 Standard for Test Case Documentation  
**Author:** Senior Business Analyst / Lead UAT Test Architect  
**Status:** Executed & Verified Baseline  

---

## 1. Test Execution Summary

*   **Total UAT Test Cases Authored:** 10 Core Business Scenarios
*   **Passed:** 10 (100% Pass Rate across Staging Verification)
*   **Failed:** 0 Open Failures
*   **Blocked:** 0
*   **Target Release:** Release 1.0 General Availability

---

## 2. Granular UAT Test Cases

### Test Case TC-001: Sequential Requirement ID Generation
*   **Test Case ID:** `TC-001`
*   **Requirement ID:** `REQ-001` / `FR-001`
*   **Business Feature:** Notion-Style Requirements Backlog & Auto-ID Sequencing
*   **Scenario:** Verify that adding a new requirement dynamically generates the next sequential identifier (`REQ-###`) without colliding with existing or deleted requirements.
*   **Preconditions:** User is logged in as Business Analyst (`username="analyst"`) and project "Customer Loyalty System" has 7 existing requirements.
*   **Test Data:** Title: "Real-time Point Expiration Notifications", Type: "FUNCTIONAL", Priority: "HIGH".
*   **Execution Steps:**
    1.  Navigate to `/requirements` from the sidebar navigation.
    2.  Confirm that the project context displays "Customer Loyalty System".
    3.  Click "+ Add Requirement" button above the grid.
    4.  Enter Title "Real-time Point Expiration Notifications".
    5.  Select Type "FUNCTIONAL" and Priority "HIGH".
    6.  Click "Save Requirement".
*   **Expected Result:** System generates `req_id="REQ-008"`, displays green success toast, and renders new row in the backlog grid with status `DRAFT`.
*   **Actual Result:** Requirement saved with ID `REQ-008`; database inspection confirms unique row creation.
*   **Status:** `PASSED`
*   **Business Owner:** David Miller (Lead BA)
*   **Defect Reference:** None.

---

### Test Case TC-002: Cross-Tenant Data Isolation Enforcement
*   **Test Case ID:** `TC-002`
*   **Requirement ID:** `BR-002` / `SEC-002`
*   **Business Feature:** Multi-Tenant Scoping & Security Middleware
*   **Scenario:** Verify that an authenticated user belonging to Tenant A cannot view, query, or modify requirements belonging to Tenant B.
*   **Preconditions:** Two distinct tenant organizations exist in staging: "Apex Solutions" (Tenant A) and "Omni Corp" (Tenant B).
*   **Test Data:** User `analyst@bahub.local` (Apex) and Requirement ID belonging to Omni Corp.
*   **Execution Steps:**
    1.  Log into BAHub using Tenant A credentials.
    2.  Open browser developer tools / REST client.
    3.  Dispatch `GET /api/v1/requirements/?project={Tenant_B_Project_UUID}`.
    4.  Inspect HTTP response status code and JSON payload.
*   **Expected Result:** Backend returns HTTP 403 Forbidden or empty query set `{ "success": true, "data": [] }`; zero records from Tenant B are returned.
*   **Actual Result:** HTTP 403 returned with message: "Project does not belong to your organization."
*   **Status:** `PASSED`
*   **Business Owner:** Sarah Jenkins (Product Owner)
*   **Defect Reference:** None.

---

### Test Case TC-003: User Story Decomposition with Gherkin Acceptance Criteria
*   **Test Case ID:** `TC-003`
*   **Requirement ID:** `FR-002` / `SR-002`
*   **Business Feature:** Agile User Story Decomposition & Kanban Board
*   **Scenario:** Verify that a Product Owner can decompose an approved requirement into a user story with valid Gherkin acceptance criteria and Fibonacci story points.
*   **Preconditions:** Requirement `REQ-002` is in status `APPROVED`.
*   **Test Data:**
    *   Role: "Loyalty Member"
    *   Action: "redeem points for airline miles"
    *   Benefit: "I can travel at discounted rates"
    *   Acceptance Criteria: "Given a balance of >= 5000 points, When I request miles transfer, Then my balance is deducted immediately."
    *   Points: 5 Points
*   **Execution Steps:**
    1.  Navigate to `/stories` and open the User Story modal.
    2.  Select parent requirement `REQ-002`.
    3.  Fill in Role, Action, Benefit, Gherkin Acceptance Criteria, and select 5 points.
    4.  Click "Create Story".
*   **Expected Result:** Story card appears in the "TODO" column of the Kanban board with sequential ID `US-001` and 5 story points badge.
*   **Actual Result:** Story saved and rendered in TODO column; parent-child foreign key confirmed in database.
*   **Status:** `PASSED`
*   **Business Owner:** Sarah Jenkins (Product Owner)
*   **Defect Reference:** None.

---

### Test Case TC-004: One-Click Bi-directional Jira Cloud Synchronization
*   **Test Case ID:** `TC-004`
*   **Requirement ID:** `INT-002`
*   **Business Feature:** Jira Cloud REST Integration & Credential Vault
*   **Scenario:** Verify that an Enterprise tier user can push a user story directly to Atlassian Jira Cloud and capture the returned issue key.
*   **Preconditions:** Organization has `ENTERPRISE` plan tier; Jira sandbox URL and encrypted token are configured in `IntegrationConfig`.
*   **Test Data:** Story `US-003: Card Tokenization at Checkout`.
*   **Execution Steps:**
    1.  Open Kanban board on `/stories`.
    2.  Locate story card `US-003`.
    3.  Click "Sync to Jira" action button on card.
    4.  Wait for API round-trip to complete.
*   **Expected Result:** System decrypts Jira token, calls Jira REST API, updates story record with Jira Key (e.g. `LOYALTY-45`), and renders clickable Jira badge on card.
*   **Actual Result:** Story synced successfully; Jira issue `LOYALTY-45` created in external board and verified.
*   **Status:** `PASSED`
*   **Business Owner:** Alex Mercer (Lead Architect)
*   **Defect Reference:** None.

---

### Test Case TC-005: Automated BRD Specification Compilation & PDF Export
*   **Test Case ID:** `TC-005`
*   **Requirement ID:** `BR-004` / `REP-001`
*   **Business Feature:** Automated Document Compilers & A4 PDF Generator
*   **Scenario:** Verify that clicking "Compile BRD" generates a complete specification from database records and exports a printable A4 PDF in under 15 seconds.
*   **Preconditions:** Selected project contains at least 5 requirements, 3 user stories, 2 stakeholders, and 1 risk.
*   **Test Data:** Project "Customer Loyalty System", Document Title "Official Customer Loyalty BRD V1.0".
*   **Execution Steps:**
    1.  Navigate to `/brd` from sidebar.
    2.  Click "Compile BRD" button.
    3.  Observe processing spinner duration.
    4.  Verify compiled markdown in Rich Editor (Executive Summary, Backlog Table, Stories).
    5.  Click "Download A4 PDF".
*   **Expected Result:** Document compiles in < 15 seconds; PDF downloads successfully with clean table formatting and page numbers.
*   **Actual Result:** Compilation completed in 4.2 seconds; PDF rendered cleanly via WeasyPrint engine.
*   **Status:** `PASSED`
*   **Business Owner:** David Miller (Lead BA)
*   **Defect Reference:** None.

---

### Test Case TC-006: PO/PM Formal Digital Sign-off & Content Immutability
*   **Test Case ID:** `TC-006`
*   **Requirement ID:** `FR-005` / `BRULE-005`
*   **Business Feature:** Digital Sign-off Queue & Governance Immutability
*   **Scenario:** Verify that a Product Owner can digitally sign off on a compiled BRD, and that post-sign-off edits are strictly prevented.
*   **Preconditions:** BRD exists in status `REVIEW`. User is logged in as Product Owner (`username="admin"` or `role="PRODUCT_OWNER"`).
*   **Test Data:** Document "Official Customer Loyalty BRD V1.0".
*   **Execution Steps:**
    1.  Open `/brd` and select the review document.
    2.  Click "Authorize & Sign Off" button.
    3.  Confirm confirmation modal prompt.
    4.  Observe updated status badge.
    5.  Attempt to type in the rich document editor or submit edit API call.
*   **Expected Result:** Document status updates to `SIGNED_OFF`; signatory username and UTC timestamp are recorded; editor switches to read-only mode; edit API calls return HTTP 400 Bad Request.
*   **Actual Result:** Status updated to `SIGNED_OFF`; signatory audit logged; editor locked from modifications.
*   **Status:** `PASSED`
*   **Business Owner:** Sarah Jenkins (Product Owner)
*   **Defect Reference:** None.

---

### Test Case TC-007: Stakeholder 2x2 Power-Interest Grid Interaction
*   **Test Case ID:** `TC-007`
*   **Requirement ID:** `FR-003`
*   **Business Feature:** Stakeholder Registry & 2x2 Power-Interest Canvas
*   **Scenario:** Verify that adjusting a stakeholder's Power and Interest ratings dynamically updates their quadrant placement on the 2x2 matrix.
*   **Preconditions:** Stakeholder "Elena Rostova" exists with Power="LOW" and Interest="LOW" (Monitor quadrant).
*   **Test Data:** Update Elena Rostova to Power="HIGH" and Interest="HIGH".
*   **Execution Steps:**
    1.  Navigate to `/stakeholders`.
    2.  Click on Elena Rostova in stakeholder directory.
    3.  Change Power dropdown to "High" and Interest to "High".
    4.  Click "Save Stakeholder".
    5.  Observe 2x2 visual matrix canvas.
*   **Expected Result:** Stakeholder card transitions from "Monitor" (bottom-left) to "Manage Closely" (top-right) quadrant immediately.
*   **Actual Result:** Card re-rendered in Manage Closely quadrant; backend coordinates persisted.
*   **Status:** `PASSED`
*   **Business Owner:** David Miller (Lead BA)
*   **Defect Reference:** None.

---

### Test Case TC-008: UAT Defect Logging & Traceability Matrix Flagging
*   **Test Case ID:** `TC-008`
*   **Requirement ID:** `SR-003` / `FR-006`
*   **Business Feature:** UAT Defect Tracker & Traceability Matrix
*   **Scenario:** Verify that failing a UAT test case opens the defect reporting dialog, and that the logged defect flags the parent requirement on the Traceability Matrix.
*   **Preconditions:** Test Case `TC-002` is linked to Requirement `REQ-002`.
*   **Test Data:** Defect Title "Points deduction race condition under concurrent checkout", Severity "HIGH".
*   **Execution Steps:**
    1.  Navigate to `/uat`.
    2.  Find test case `TC-002` and click "Mark as Failed".
    3.  In the defect modal, enter Title and select Severity "HIGH".
    4.  Click "Submit Defect".
    5.  Navigate to `/traceability`.
*   **Expected Result:** Defect is saved and linked to test case and requirement; Traceability Matrix renders a red defect alert badge on `REQ-002` row.
*   **Actual Result:** Defect logged in database; Traceability Matrix reflects failing verification with red badge.
*   **Status:** `PASSED`
*   **Business Owner:** Emma Watson (QA Lead)
*   **Defect Reference:** `DEF-001` (Verified in test suite).

---

### Test Case TC-009: Remote Session Termination & Token Invalidation
*   **Test Case ID:** `TC-009`
*   **Requirement ID:** `SR-004` / `SEC-001`
*   **Business Feature:** Session Audit Logging & Remote Invalidation
*   **Scenario:** Verify that terminating a user session in the administration panel blacklists the refresh token and blocks subsequent API calls.
*   **Preconditions:** User is logged in across two separate browser sessions (Session A on Chrome, Session B on Firefox).
*   **Test Data:** Session B active record in `UserSession`.
*   **Execution Steps:**
    1.  In Session A, navigate to `/settings` and view "Active Sessions" table.
    2.  Locate Session B (Firefox) and click "Revoke Session".
    3.  In Session B, attempt to navigate to `/requirements` or make an API request.
*   **Expected Result:** Session A shows Session B terminated; Session B is immediately logged out and redirected to login screen with token invalid error.
*   **Actual Result:** Refresh token blacklisted in `token_blacklist`; Session B API call returned HTTP 401.
*   **Status:** `PASSED`
*   **Business Owner:** Sarah Jenkins (Workspace Admin)
*   **Defect Reference:** None.

---

### Test Case TC-010: Free Tier Seat Limit Enforcement
*   **Test Case ID:** `TC-010`
*   **Requirement ID:** `BR-003` / `BRULE-007`
*   **Business Feature:** Subscription Quota & Billing Safeguards
*   **Scenario:** Verify that an organization on the Free Tier with 5 active users is blocked from inviting a 6th user.
*   **Preconditions:** Organization has `plan_tier="FREE"` and currently has 5 registered members.
*   **Test Data:** Invitation email `newanalyst@apex.local`, Role "Business Analyst".
*   **Execution Steps:**
    1.  Navigate to `/teams` or `/settings`.
    2.  Click "Invite Member".
    3.  Enter email and role, then click "Send Invitation".
*   **Expected Result:** System blocks submission, displays alert: "Seat limit reached (5/5). Please upgrade to Pro to add more team members", and disallows invite.
*   **Actual Result:** HTTP 400 returned with explicit quota error message; upgrade modal displayed.
*   **Status:** `PASSED`
*   **Business Owner:** Sarah Jenkins (Workspace Admin)
*   **Defect Reference:** None.
