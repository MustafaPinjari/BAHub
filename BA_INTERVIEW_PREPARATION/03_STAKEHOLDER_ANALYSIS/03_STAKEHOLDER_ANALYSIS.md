# BAHub — Comprehensive Stakeholder Analysis & Governance Matrix
**Document ID:** STK-BAHUB-001  
**Project:** BAHub (The AI-Powered Business Analyst Workspace)  
**Methodology:** Mendelow’s Power-Interest Matrix & RACI Framework  
**Author:** Senior Business Analyst / Lead Solutions Consultant  
**Status:** Approved Baseline  

---

## 1. Executive Overview

Stakeholder management in BAHub operates at two distinct levels:
1.  **Platform Stakeholders:** The organizational actors who interact with, configure, and derive business value from BAHub as an enterprise software product.
2.  **Project Stakeholders (Domain Entity):** The external client stakeholders documented within the workspace using the `Stakeholder` database model (`backend/stakeholders/models.py`), analyzed via the dynamic 2x2 Power/Interest matrix.

This document analyzes both dimensions, detailing operational profiles, communication cadences, system interactions, and RACI accountabilities grounded in repository evidence.

---

## 2. Platform Stakeholder Profiles & Matrix

Based on the Role-Based Access Control (RBAC) model implemented in `backend/users/models.py` (`User.ROLE_CHOICES`), the system recognizes six explicit operational personas:

```
                    ▲ HIGH POWER
                    │
         KEEP       │        MANAGE
       SATISFIED    │        CLOSELY
                    │
  • Enterprise      │  • Lead Business Analyst
    Client Sponsor  │  • Product Owner / PM
  • Platform Admin  │
────────────────────┼────────────────────────► HIGH INTEREST
                    │
       MONITOR      │      KEEP INFORMED
                    │
  • Secondary User  │  • Full-Stack Developer
  • Guest Viewer    │  • QA / UAT Test Analyst
                    │
                    ▼ LOW POWER
```

### 2.1 Lead & Senior Business Analyst (BA)
*   **System Role:** `BUSINESS_ANALYST` (Default primary user)
    *   *Evidence:* `backend/users/models.py` (line 27).
*   **Operational Responsibilities:**
    *   Elicit, capture, and structure functional, non-functional, and technical requirements.
    *   Maintain the Notion-style backlog grid and ensure sequential ID integrity (`REQ-001`).
    *   Map project stakeholders and assess Power vs. Interest coordinates.
    *   Draft strategic SWOT quadrants and current-to-future state Gap Analyses.
    *   Trigger automated BRD/FRD/IEEE 830 document compilers and manage reviewer feedback.
*   **Primary Goals:** Eradicate manual document formatting overhead; guarantee bidirectional requirement traceability; accelerate sprint-ready backlog creation.
*   **Key Pain Points in As-Is:** Re-keying requirements across multiple spreadsheets and Jira; manual ID collisions; tracking scope changes via scattered email threads.
*   **System Interaction Points:** Requirements Grid (`/requirements`), Traceability Matrix (`/traceability`), Stakeholders (`/stakeholders`), Strategic (`/swot`, `/gap`), Document Compilers (`/brd`, `/frd`).
*   **Influence / Interest:** High Power / High Interest (Primary Driver).

### 2.2 Product Owner / Product Manager (PO/PM)
*   **System Role:** `PRODUCT_OWNER`
    *   *Evidence:* `backend/users/models.py` (line 20).
*   **Operational Responsibilities:**
    *   Decompose requirements into sprint-ready Agile User Stories (`backend/stories/models.py`).
    *   Assign Fibonacci story points (1, 2, 3, 5, 8, 13) and prioritize Kanban workflow lanes.
    *   Review and formally sign off on compiled specifications (`BusinessDocument.signed_off_by`).
    *   Evaluate Scope Change Requests (CRs) against project budget and schedule constraints.
*   **Primary Goals:** Maximize team velocity; ensure strict alignment between business requirements and developer backlog; maintain an uncompromised audit trail for regulatory compliance.
*   **Key Pain Points in As-Is:** Requirements drift between Word documents and Jira boards; unapproved scope creep; lack of clear signatory audit logs.
*   **System Interaction Points:** User Stories Kanban (`/stories`), Document Sign-off (`/brd`, `/frd`), Change Requests (`/changes`), PMO Command Center (`/pmo`).
*   **Influence / Interest:** High Power / High Interest (Key Decision Maker).

### 2.3 Software Developer / Tech Lead (Dev)
*   **System Role:** `DEVELOPER`
    *   *Evidence:* `backend/users/models.py` (line 21).
*   **Operational Responsibilities:**
    *   Review technical requirements and architectural constraints (`req_type="TECHNICAL"`).
    *   Implement user stories based on explicit Gherkin Acceptance Criteria (*Given/When/Then*).
    *   Track issue keys via bi-directional Jira synchronization (`jira_key`, `jira_url`).
*   **Primary Goals:** Unambiguous technical specifications; clear acceptance criteria; zero last-minute architectural surprises.
*   **Key Pain Points in As-Is:** Vague user stories lacking boundary conditions; building features from outdated specification drafts.
*   **System Interaction Points:** User Stories Read View (`/stories`), Diagrams Canvas (`/diagrams`), Jira Board Integration (`/integrations`).
*   **Influence / Interest:** Low Power / High Interest (Execution Stakeholder).

### 2.4 QA / UAT Test Analyst (QA)
*   **System Role:** `QA_TESTER`
    *   *Evidence:* `backend/users/models.py` (line 22), `backend/uat/models.py`.
*   **Operational Responsibilities:**
    *   Author test cases directly linked to functional requirements (`TestCase.requirement`).
    *   Execute test runs and record statuses (`PENDING`, `PASSED`, `FAILED`).
    *   Log defects categorized by severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) linked to test runs.
*   **Primary Goals:** Complete test coverage; zero orphaned test cases; rapid defect-to-requirement root-cause analysis.
*   **Key Pain Points in As-Is:** Writing test scripts in disconnected Excel files; unable to prove which requirements have been verified prior to release.
*   **System Interaction Points:** UAT Management Portal (`/uat`), Traceability Matrix (`/traceability`).
*   **Influence / Interest:** Low Power / High Interest (Quality Gatekeeper).

### 2.5 Executive Sponsor / Business Client
*   **System Role:** `STAKEHOLDER`
    *   *Evidence:* `backend/users/models.py` (line 23), `backend/stakeholders/models.py`.
*   **Operational Responsibilities:**
    *   Participate in requirement discovery and validation meetings.
    *   Review high-level executive summaries in compiled BRDs.
    *   Authorize major change requests affecting schedule or budget.
*   **Primary Goals:** Predictable delivery timelines; verifiable ROI; total transparency into project scope and delivery risks.
*   **Key Pain Points in As-Is:** Receiving 100-page dense Word documents requiring manual review; blind spots regarding project risks and blockers.
*   **System Interaction Points:** Executive Meeting Reviews (`/meetings`), Read-Only Traceability View (`/traceability`), Document Approval.
*   **Influence / Interest:** High Power / Low to Medium Interest (Sponsor / Governor).

### 2.6 Tenant Workspace Administrator (Admin)
*   **System Role:** `ADMIN`
    *   *Evidence:* `backend/users/models.py` (line 18).
*   **Operational Responsibilities:**
    *   Manage tenant organization configurations and team seat allocations.
    *   Audit active user sessions (`backend/users/models.py:UserSession`) and revoke compromised tokens.
    *   Oversee subscription plan limits (Free: 5 seats / Pro: 20 seats / Enterprise: Unlimited) and billing invoices.
    *   Configure Jira/Confluence encrypted credentials.
*   **Primary Goals:** Data security; strict tenant isolation; predictable cloud infrastructure costs.
*   **Key Pain Points in As-Is:** Lack of visibility into user access; unauthorized API key exposure; complex billing administration.
*   **System Interaction Points:** Organization Settings (`/settings`), Billing & Invoices (`/billing`), Audit Logs (`/audit`), Teams (`/teams`).
*   **Influence / Interest:** High Power / Medium Interest (Security & Operational Owner).

---

## 3. RACI Accountability Matrix Across Core Modules

The RACI matrix below defines the governance responsibilities across BAHub’s primary operational workflows:

*   **R**esponsible: The role that conducts the actual task.
*   **A**ccountable: The role with ultimate decision and sign-off authority (Only 1 per row).
*   **C**onsulted: The role providing expert input and validation.
*   **I**nformed: The role kept updated on progress and results.

| Project Lifecycle Workflow | Business Analyst | Product Owner | Developer | QA Tester | Client Sponsor | Workspace Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Requirements Elicitation & Backlog Entry** | **R** | **A** | **C** | **C** | **C** | **I** |
| **User Story Decomposition & Story Pointing** | **C** | **A** | **R** | **C** | **I** | **I** |
| **BRD / FRD Document Compilation** | **R** | **A** | **I** | **I** | **C** | **I** |
| **Formal Document Sign-off & Baselining** | **C** | **A** | **I** | **I** | **C** | **I** |
| **BPMN / ERD Process Modeling** | **R** | **A** | **C** | **I** | **I** | **I** |
| **Jira / Confluence External Sync** | **R** | **A** | **I** | **I** | **I** | **C** |
| **UAT Test Authoring & Execution** | **C** | **A** | **I** | **R** | **C** | **I** |
| **Defect Triage & Root Cause Analysis** | **C** | **A** | **R** | **R** | **I** | **I** |
| **Scope Change Request (CR) Evaluation** | **R** | **A** | **C** | **I** | **C** | **I** |
| **Risk Register & Mitigation Maintenance** | **R** | **A** | **C** | **C** | **I** | **I** |
| **Tenant User Session & Billing Management** | **I** | **I** | **I** | **I** | **I** | **R / A** |

---

## 4. Stakeholder Communication & Engagement Plan

| Stakeholder Group | Engagement Objective | Communication Channel | Frequency | Artifact / Output |
| :--- | :--- | :--- | :--- | :--- |
| **Manage Closely** *(Lead BA, PO/PM)* | Daily backlog refinement, sprint alignment, and story acceptance. | In-app Kanban, daily standups, instant notifications. | Daily | Prioritized Backlog, Sprint Burndown, User Stories. |
| **Keep Satisfied** *(Client Sponsor, Execs)* | Milestone tracking, budget governance, and high-level risk review. | Formal compiled BRD PDF, executive dashboard. | Bi-weekly / Milestone | Compiled BRD, Risk Matrix, Signed Approval Logs. |
| **Keep Informed** *(Developers, QA Analysts)* | Sprint readiness, acceptance criteria clarification, test verification. | Jira sync, UAT defect boards, Slack integration. | Continuous | Gherkin ACs, Test Execution Logs, Defect Tickets. |
| **Monitor** *(External Auditors, Workspace Admin)* | Compliance verification, session tracking, SOC 2 event inspection. | Audit log exports, automated monthly billing receipts. | Monthly / On-Demand | Audit Trail CSV, Stripe Invoices, SOC 2 Reports. |
