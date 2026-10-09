# Requirements Traceability Matrix (RTM)
## BAHub — End-to-End Bidirectional Traceability Baseline
**Document Reference:** RTM-BAHUB-2026-V1.0  
**Project:** BAHub (The AI-Powered Business Analyst Workspace)  
**Standard Adhered To:** IEEE Standard for Software Requirements Traceability / BABOK v3  
**Author:** Senior Business Analyst / Lead Traceability Architect  
**Status:** Approved & Baselined  

---

## 1. Executive Summary & Traceability Governance

The Requirements Traceability Matrix (RTM) establishes a **bidirectional, auditable thread** connecting high-level Business Objectives down through Functional Requirements, Agile User Stories, Technical Code Components, QA Test Cases, and UAT Sign-off records.

### Traceability Vector:
$$\text{Business Objective} \longleftrightarrow \text{Requirement (BR/FR)} \longleftrightarrow \text{User Story (US)} \longleftrightarrow \text{Code Component} \longleftrightarrow \text{Test Case (TC)} \longleftrightarrow \text{UAT Status}$$

---

## 2. Master Requirements Traceability Matrix

| Req ID | Requirement Summary | Business Objective | System Module | User Story ID | Gherkin Acceptance Criteria | Development Component (Code Evidence) | Test Case ID | UAT Status | Lifecycle Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-001** | Auto-incrementing, project-scoped sequential requirement identifiers (`REQ-###`). | Eliminate numbering collisions and manual re-indexing in spreadsheets. | Requirements Engineering | `US-003` | Given a project with N requirements, when a new requirement is saved, then ID is set to `REQ-(N+1)`. | `backend/requirements/models.py:Requirement.save()` | `TC-001` | **PASSED** | **VERIFIED** |
| **FR-002** | Parent-child agile user story decomposition linked to functional requirements. | Prevent orphaned development tickets; eliminate requirements-to-sprint drift. | Agile Stories | `US-005` | Given an approved requirement, when a story is created, then foreign key is bound and status is `TODO`. | `backend/stories/models.py:UserStory` | `TC-003` | **PASSED** | **VERIFIED** |
| **FR-003** | Interactive 2x2 Stakeholder Power vs. Interest positioning canvas. | Tailor executive communication cadences (Manage Closely, Keep Informed). | Stakeholders | `US-004` | Given a stakeholder with High Power and High Interest, then card renders in Manage Closely quadrant. | `backend/stakeholders/models.py`, `StakeholdersPage.tsx` | `TC-007` | **PASSED** | **VERIFIED** |
| **FR-004** | ReactFlow interactive canvas for BPMN workflows with collaborative locking. | Visual process modeling directly linked to functional requirements. | Diagrams & BPMN | `US-REQ-02` | Given a diagram opened by User A, then an edit lock is acquired preventing concurrent overwrite. | `backend/diagrams/models.py:Diagram` | `TC-004` | **PASSED** | **VERIFIED** |
| **FR-005** | Formal PO/PM digital sign-off engine with immutable signatory audit log. | Provide legal and governance baselining for enterprise releases. | Documents | `US-008` | Given a BRD in status `REVIEW`, when PO clicks sign-off, then status becomes `SIGNED_OFF` and is locked. | `backend/documents/models.py:BusinessDocument` | `TC-006` | **PASSED** | **VERIFIED** |
| **FR-006** | Multi-entity Traceability Matrix visualizer linking specs, stories, risks, and tests. | 100% visibility into verification coverage and untested requirements. | Traceability | `US-010` | Given a requirement without a test case, then an amber "Uncovered" badge is displayed. | `frontend/src/features/traceability/TraceabilityPage.tsx` | `TC-008` | **PASSED** | **VERIFIED** |
| **INT-001** | Cryptographic storage of external Jira/Confluence API tokens using AES-128 Fernet. | Protect third-party customer credentials from database theft. | Integrations | `US-006` | Given a Jira token, when saved, then it is stored as encrypted ciphertext in database rows. | `backend/integrations/models.py:EncryptedCharField` | `TC-004` | **PASSED** | **VERIFIED** |
| **INT-002** | One-click bi-directional synchronization of user stories to Atlassian Jira Cloud. | Eliminate manual re-typing of stories into Jira; link ticket keys. | Integrations | `US-006` | Given an enterprise story, when synced, then Jira issue is created and `jira_key` is populated. | `backend/integrations/views.py`, `backend/stories/models.py` | `TC-004` | **PASSED** | **VERIFIED** |
| **SEC-001** | SimpleJWT session control with remote active session revocation. | Close vulnerabilities caused by compromised devices or stolen tokens. | Users & Security | `US-002` | Given an active session, when revoked, then refresh token is blacklisted and user is logged out. | `backend/users/views.py:UserSessionViewSet`, `settings.py` | `TC-009` | **PASSED** | **VERIFIED** |
| **SEC-002** | Multi-tenant organization scoping and database-level query isolation. | Prevent cross-tenant data leaks and enforce strict privacy compliance. | Organizations | `US-001` | Given User from Tenant A, when querying projects, then zero records from Tenant B are returned. | `backend/core/middleware.py`, `organizations/models.py` | `TC-002` | **PASSED** | **VERIFIED** |
| **REP-001** | Automated BRD/FRD document compilers streaming Word (.docx) and A4 PDF packages. | Eliminate 10–15 hours of manual document formatting overhead per sprint. | Documents | `US-007` | Given approved project entities, when compiled, then print-ready PDF is downloaded in < 15s. | `backend/documents/views.py`, `weasyprint` | `TC-005` | **PASSED** | **VERIFIED** |
| **BR-003** | Tiered subscription quotas enforcing 5 seats on Free Tier and 3-day grace period. | Regulate cloud hosting costs and monetize enterprise workspace tiers. | Billing | `US-ADM-01` | Given a Free tier organization, when 6th user is invited, then submission is rejected with upgrade alert. | `backend/billing/models.py:TenantSubscription` | `TC-010` | **PASSED** | **VERIFIED** |

---

## 3. Forward & Backward Traceability Verification Proof

### 3.1 Forward Traceability Proof (Are all requirements being built and verified?)
*   **Total Requirements Tracked:** 12 Core Requirements
*   **Requirements with User Stories:** 12 / 12 (**100%**)
*   **Requirements with Test Cases:** 12 / 12 (**100%**)
*   **Orphaned Requirements:** 0 (**Zero unverified requirements in baseline**)

### 3.2 Backward Traceability Proof (Does all implemented code have business justification?)
*   **Jira Tickets:** Every issue synced to Jira traces back to a parent `Requirement` and an originating `Business Objective`.
*   **Source Code Models:** All models in `backend/` correspond directly to functional capabilities defined in the BRD and FRD.
*   **Gold-Plating / Scope Creep:** Zero non-functional code detected; all modules solve specific UX and governance problems.
