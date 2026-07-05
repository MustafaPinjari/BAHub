# BAHub - Phase 2: Requirement Gathering & Stakeholder Management

This document details the stakeholder directory, the strategic Power/Interest matrix, the communication plan, and the gathered requirements log for the **BAHub** implementation.

---

## 1. Stakeholder List & Directory

The following stakeholders have been identified as key participants in the lifecycle of the BAHub product workspace. This registry matches the dynamic roles within our multi-tenant SaaS schema.

| Stakeholder Name | Title / Role | Department | Contact Information |
| :--- | :--- | :--- | :--- |
| **Samantha Vance** | Chief Product Officer | Product Management | `samantha.vance@bahub-enterprise.com` |
| **Devon Miller** | Lead Business Analyst | Business Analysis & PMO | `devon.miller@bahub-enterprise.com` |
| **Marcus Vance** | Principal Security Architect | Information Security | `marcus.vance@bahub-enterprise.com` |
| **Elena Rostova** | Director of Client Delivery | Consulting Operations | `elena.rostova@bahub-enterprise.com` |
| **Rajesh Koothrapali** | Lead QA Engineer | Quality Assurance | `rajesh.k@bahub-enterprise.com` |
| **Sarah Jenkins** | Product Owner (Sponsor) | Client Operations | `sarah.jenkins@bahub-enterprise.com` |

---

## 2. Stakeholder Matrix (2x2 Power/Interest)

To manage relationships and expectations effectively, stakeholders are mapped onto a 2x2 grid based on their structural power (influence over project success/funding) and interest (operational impact on daily workflow).

```
          HIGH POWER
     +-----------------------------------+-----------------------------------+
     |                                   |                                   |
     |  KEEP SATISFIED                   |  MANAGE CLOSELY                   |
     |                                   |                                   |
     |  - Sarah Jenkins (Sponsor)        |  - Samantha Vance (CPO)           |
     |                                   |  - Devon Miller (Lead BA)         |
     |                                   |  - Elena Rostova (Delivery Dir)   |
     |                                   |                                   |
     +-----------------------------------+-----------------------------------+
P    |                                   |                                   |
O    |  MONITOR (MINIMAL EFFORT)         |  KEEP INFORMED                    |
W    |                                   |                                   |
E    |  - Marcus Vance (Security Arch)   |  - Rajesh Koothrapali (Lead QA)   |
R    |                                   |                                   |
     |                                   |                                   |
     +-----------------------------------+-----------------------------------+
          LOW POWER                              HIGH INTEREST
                                  INTEREST
```

### Analysis of matrix alignments:
* **Manage Closely (High Power / High Interest)**: Samantha Vance (CPO), Devon Miller (Lead BA), and Elena Rostova (Delivery Dir). These actors drive feature scoping, sign-offs, and product architecture.
* **Keep Satisfied (High Power / Low Interest)**: Sarah Jenkins (Sponsor). Requires bi-weekly high-level status summaries and ROI updates.
* **Keep Informed (Low Power / High Interest)**: Rajesh Koothrapali (Lead QA). Must be kept informed on stories backlog updates and QA test criteria changes to adjust verification scripts.
* **Monitor (Low Power / Low Interest)**: Marcus Vance (Security). Monitored for SOC 2 checklist alignment and security scan requirements.

---

## 3. Stakeholder Communication Plan

| Stakeholder Segment | Communication Channel | Frequency | Objective / Deliverable | Owner |
| :--- | :--- | :--- | :--- | :--- |
| **Manage Closely** | Project Alignment Sync (Live Demo) | Weekly | Sprint review, obstacle mitigation, requirement adjustments. | Lead BA |
| **Keep Satisfied** | Progress Status Report (Dashboard) | Bi-Weekly | High-level status updates, budget reviews, change request logs. | Project Manager |
| **Keep Informed** | Sprint Backlog Grooming | Daily | Daily backlog prioritization, acceptance criteria clarification. | Lead BA / PO |
| **Monitor** | Security Auditing Sync | Quarterly | SOC 2 compliance checklist verification, database scan logs. | Technical Lead |

---

## 4. Gathered Requirements Log

Requirements gathered from stakeholders are divided into core categories. In accordance with BAHub database formatting, requirements are categorized as **Functional**, **Non-Functional**, **Technical**, and **User Interface (UI)**.

### A. Business Requirements (BR)
* **BR-001: Multi-Tenant Workspace Isolation**  
  * *Description*: The platform must segregate all data (requirements, stories, meetings, risks) by organization to ensure client confidentiality.
  * *Source*: Samantha Vance (CPO)
  * *Rationale*: Crucial for hosting enterprise accounts and consulting tenants securely.
* **BR-002: Real-time Requirement Co-Authoring**  
  * *Description*: Enable multiple BAs to collaborate inside the requirements split grid simultaneously without causing overwriting conflicts.
  * *Source*: Devon Miller (Lead BA)
  * *Rationale*: Reduces requirements-gathering iteration duration during live stakeholder workshops.
* **BR-003: Bidirectional Jira & Confluence Sync**  
  * *Description*: Allow BAs to publish user stories to Jira and BRD/FRD documents to Confluence directly from the BAHub interface.
  * *Source*: Elena Rostova (Director of Client Delivery)
  * *Rationale*: Eliminates manual double-entry of issues across tracking tools.

### B. Functional Requirements (FR)
* **FR-001: Automatic Sequential Requirement ID Generation**  
  * *Description*: The system must auto-generate sequential IDs (`REQ-001`, `REQ-002`) scoped per project upon saving new requirements.
  * *Source*: Devon Miller (Lead BA)
  * *Rationale*: Enforces consistent naming conventions across requirements registers.
* **FR-002: Stakeholder Power/Interest Mapping**  
  * *Description*: Provide an interface to register stakeholders with Power and Interest attributes, mapping them automatically to a visual 2x2 matrix.
  * *Source*: Devon Miller (Lead BA)
  * *Rationale*: Automates relationship matrix analysis for BAs.
* **FR-003: SWOT Matrix Quadrant Configurator**  
  * *Description*: Provide a 2x2 visual input grid mapping Strengths, Weaknesses, Opportunities, and Threats scoped to each project workspace.
  * *Source*: Elena Rostova (Director of Client Delivery)
  * *Rationale*: Facilitates strategic discovery workshops within the application.
* **FR-004: Gap Analysis Tracker**  
  * *Description*: Allow creation of gap analysis logs capturing Current State, Future State, Gap Description, and Action Plan, with Status tracking (Identified, In Progress, Resolved).
  * *Source*: Devon Miller (Lead BA)
  * *Rationale*: Structural tracking of process improvement actions.
* **FR-005: Document Sign-off Signatory Flow**  
  * *Description*: Implement a formal review and signature process allowing Project Managers or Admins to sign off on BRD/FRD documents.
  * *Source*: Sarah Jenkins (Sponsor)
  * *Rationale*: Enforces formal baseline audits before engineering kick-off.

### C. Non-Functional Requirements (NFR)
* **NFR-001: Operational Security (Multi-Tenancy)**  
  * *Description*: Strict data access constraints ensuring users can never view, update, or edit resources belonging to another organization.
  * *Source*: Marcus Vance (Security Architect)
  * *Rationale*: Prevents cross-tenant security vulnerabilities.
* **NFR-002: Low-Latency Document Generation**  
  * *Description*: Markdown compilation to Word (.docx) and PDF (A4 format) must execute in under 10 seconds.
  * *Source*: Devon Miller (Lead BA)
  * *Rationale*: Ensures smooth performance during live presentations and downloads.
* **NFR-003: Real-time Presence Indicators**  
  * *Description*: WebSocket connection must broadcast collaborator active status and typing indicators within 500 milliseconds of action.
  * *Source*: Samantha Vance (CPO)
  * *Rationale*: Enhances collaboration feedback loops.

### D. Technical Requirements (TR)
* **TR-001: SimpleJWT Authentication Session Management**  
  * *Description*: Secure token logins with automatic Axios refresh interceptors validating session duration and security.
  * *Source*: Marcus Vance (Security Architect)
  * *Rationale*: Mitigates session-hijacking and API abuse risk.
* **TR-002: Encrypted API Integrations Secrets Vault**  
  * *Description*: Jira and Confluence API tokens must be encrypted before database storage using SHA256-based Fernet symmetric keys.
  * *Source*: Marcus Vance (Security Architect)
  * *Rationale*: Protects third-party integration credentials.
* **TR-003: Daphne ASGI Server Routing**  
  * *Description*: Deploy Daphne as the production application server to support ASGI WebSockets alongside traditional WSGI REST HTTP traffic.
  * *Source*: Tech Lead / DevOps
  * *Rationale*: Enables unified deployment of standard API calls and real-time WebSocket presence.
