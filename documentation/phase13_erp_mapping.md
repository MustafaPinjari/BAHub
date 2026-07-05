# BAHub - Phase 13: ERP Mapping & System Alignment

This document maps the modules of the **BAHub** application to functional components of enterprise Resource Planning (ERP) solutions (such as SAP, Oracle, Zoho ERP, or Salesforce).

---

## 1. Functional ERP Mapping Matrix

BAHub's architecture mirrors the transactional, relational, and administrative structures of enterprise ERP systems.

| BAHub Module | Core ERP Component | Mapping Explanation |
| :--- | :--- | :--- |
| **Organization Tenant Boundary** | Multi-Entity Consolidation | Maps to ERP multi-company setups. Each tenant operates in an isolated environment with separate chart of accounts, users, and resources. |
| **Requirements Split Grid** | Product Catalog & BOM | Maps to the Bill of Materials (BOM) in Manufacturing ERP. Requirements act as the structural specifications required to build a final product. |
| **Stakeholder Register** | CRM & HR Directory | Maps to Customer Relationship Management (CRM) databases and Human Resources (HR) staffing rosters, logging contact info and interest levels. |
| **Document Generator** | Contract & Order Generation | Maps to ERP Order Management or Sales Quote generation. Combines project requirements and data into a document for client sign-off. |
| **Change Request Approvals** | Engineering Change Orders (ECO) | Maps to Change Management workflows in Manufacturing/Logistics ERP, tracking, reviewing, and approving modifications to baselines. |
| **Tenant Subscription & Seats** | License & Asset Management | Maps to Billing, Receivables, and Asset tracking. Checks seat limits against subscription tiers, restricting usage based on payment terms. |

---

## 2. Deep Dive: ERP Module Equivalents

### 2.1 Sales & Customer Relationship Management (CRM)
In an ERP like Salesforce or Zoho CRM, opportunities move through pipeline stages (Discovery, Proposal, Negotiation, Closed/Won). In BAHub:
* **The Opportunity Pipeline** maps to the **Requirements Split Grid**. Requirements transition through statuses (`DRAFT`, `REVIEW`, `APPROVED`) as agreement is reached.
* **Customer Contacts** map to the **Stakeholder Matrix**. Stakeholders are logged with Power/Interest ratings, helping PMs focus alignment efforts on key drivers.

### 2.2 Operations, Workflows, & Approval Engines
Enterprise ERPs use strict workflows and approval logic (such as SAP Workflow or Oracle Approvals Management) to prevent unauthorized transactions. BAHub implements equivalent controls:
* **Change Request Approvals**: When a BA submits a `ChangeRequest`, the ticket is locked in `REVIEW` status until a Product Owner or Admin reviews and approves it.
* **Document Sign-off**: The PO reviews compiled BRDs/FRDs and signs off. This logs signature metadata (`signed_off_by`, `signed_off_at`) and freezes the version, establishing a baseline.

### 2.3 Finance & Subscription Billing
In a financial ledger, transaction balances must balance. In BAHub, subscription states must map directly to tenant usage limits:
* **Billing Tiers**: The `TenantSubscription` model links to the organization context and maps subscription levels (`FREE`, `PRO`, `ENTERPRISE`).
* **Seats Limit Enforcer**: When inviting users, a service counts active user records against the subscription seat limit (e.g. 5 users limit on the `FREE` tier), blocking invitations if the limit is exceeded.

### 2.4 Warehouse & Inventory (Backlog Tracking)
In a logistics ERP, inventory items are tracked in storage lanes and checked for stock shortages. In BAHub:
* **Storage Lanes** map to the **Kanban Agile Backlog**. User story cards represent inventory units moving through status lanes (`TODO`, `IN_PROGRESS`, `QA`, `DONE`).
* **Stock Shortage Checks** map to **Jira Backlog Synchronization**. A celery runner checks if user stories are synced to Jira, updating the database status with Jira issue keys to prevent backlog drift.

---

## 3. Dashboards & Consolidated Analytics Reports

ERP systems use analytical reports to help executives monitor performance and manage operations. BAHub implements equivalent dashboards:

* **Executive Dashboard**: Consolidates active project metrics, requirement distributions, story point completion, and risk levels.
* **Risk Heat Matrix**: Maps risks by probability (High, Medium, Low) and impact (High, Medium, Low) on a visual grid, helping PMs prioritize mitigation tasks.
* **Jira Sync Audit Logs**: The `SyncLog` database table acts as a ledger, logging the status (Success/Failed), timestamp, and trigger details for all integration runs.
