# Enterprise Data Dictionary
## BAHub — Database Schema & Field Level Specifications
**Document Reference:** DD-BAHUB-2026-V1.0  
**Project:** BAHub (The AI-Powered Business Analyst Workspace)  
**Standard Adhered To:** IEEE Standard for Data Dictionaries / SQL DDL Standards  
**Author:** Technical Data Analyst / Database Architect  
**Status:** Approved Schema Baseline  

---

## 1. Table: `organizations`
*Target Model:* `backend/organizations/models.py:Organization`  
*Purpose:* Represents the root tenant container for multi-tenant data scoping.

| Column Name | Data Type | Constraints | Nullable | Default | Description / Business Meaning |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | No | `gen_random_uuid()` | Unique immutable identifier for the tenant organization. |
| `created_at` | TIMESTAMP | Not Null | No | `CURRENT_TIMESTAMP`| UTC creation timestamp for audit tracking. |
| `updated_at` | TIMESTAMP | Not Null | No | `CURRENT_TIMESTAMP`| UTC last modification timestamp. |
| `is_deleted` | BOOLEAN | Indexed | No | `FALSE` | Soft delete flag; records are marked true rather than physically dropped. |
| `name` | VARCHAR(255) | Unique | No | None | Legal or commercial name of the enterprise organization. |
| `description` | TEXT | None | Yes | `""` | Detailed description of the organization and industry domain. |
| `timezone` | VARCHAR(50) | None | No | `"UTC"` | Preferred operational timezone for timestamp formatting. |
| `email` | VARCHAR(254) | Email format | Yes | None | Primary billing and contact email address. |
| `phone` | VARCHAR(50) | None | Yes | None | Official contact telephone number. |
| `website` | VARCHAR(200) | URL format | Yes | None | Corporate website URL. |

---

## 2. Table: `users`
*Target Model:* `backend/users/models.py:User` (Extends `AbstractUser`)  
*Purpose:* User identity, authentication, role assignment, and organization membership.

| Column Name | Data Type | Constraints | Nullable | Default | Description / Business Meaning |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | No | `gen_random_uuid()` | Unique user UUID. |
| `username` | VARCHAR(150) | Unique | No | None | Unique login handle. |
| `email` | VARCHAR(254) | Unique | No | None | Corporate email address used for login and notifications. |
| `password` | VARCHAR(128) | Argon2 / PBKDF2| No | None | Encrypted password hash complying with enterprise validators. |
| `role` | VARCHAR(50) | Enum Choices | No | `"BUSINESS_ANALYST"`| Role-based access control tier: `ADMIN`, `BUSINESS_ANALYST`, `PRODUCT_OWNER`, `DEVELOPER`, `QA_TESTER`, `STAKEHOLDER`. |
| `organization_id`| UUID | FK -> organizations| Yes | None | Tenant container. If null, user is platform superuser. |
| `phone` | VARCHAR(30) | None | Yes | None | User telephone number. |
| `is_active` | BOOLEAN | None | No | `TRUE` | Whether user account is active or suspended. |
| `is_staff` | BOOLEAN | None | No | `FALSE` | Allows access to Django administration panel. |
| `is_superuser` | BOOLEAN | None | No | `FALSE` | Grants all system permissions without explicit assignment. |

---

## 3. Table: `projects`
*Target Model:* `backend/projects/models.py:Project`  
*Purpose:* Collaboration workspace container scoping requirements, backlogs, and tests.

| Column Name | Data Type | Constraints | Nullable | Default | Description / Business Meaning |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | No | `gen_random_uuid()` | Unique project UUID. |
| `organization_id`| UUID | FK -> organizations| No | None | Owning tenant organization (`on_delete=CASCADE`). |
| `name` | VARCHAR(255) | Composite Unique| No | None | Project title (Unique per organization). |
| `description` | TEXT | None | Yes | `""` | High-level project background and scope overview. |
| `status` | VARCHAR(50) | Enum Choices | No | `"ACTIVE"` | Operational state: `ACTIVE`, `COMPLETED`, `ARCHIVED`. |
| `start_date` | DATE | None | Yes | None | Scheduled project kickoff date. |
| `end_date` | DATE | None | Yes | None | Targeted project completion date. |
| `is_deleted` | BOOLEAN | Indexed | No | `FALSE` | Soft delete flag. |

---

## 4. Table: `requirements`
*Target Model:* `backend/requirements/models.py:Requirement`  
*Purpose:* Functional and non-functional specifications with auto-sequenced keys.

| Column Name | Data Type | Constraints | Nullable | Default | Description / Business Meaning |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | No | `gen_random_uuid()` | Unique requirement UUID. |
| `project_id` | UUID | FK -> projects | No | None | Owning project container (`on_delete=CASCADE`). |
| `req_id` | VARCHAR(50) | Composite Unique| No | `""` | Sequential human-readable key (e.g. `REQ-001`), unique per project. |
| `title` | VARCHAR(255) | Not Null | No | None | Concise requirement name. |
| `description` | TEXT | Not Null | No | None | Detailed functional specification text. |
| `req_type` | VARCHAR(50) | Enum Choices | No | `"FUNCTIONAL"` | Requirement category: `FUNCTIONAL`, `NON_FUNCTIONAL`, `TECHNICAL`, `UI`. |
| `status` | VARCHAR(50) | Enum Choices | No | `"DRAFT"` | Lifecycle state: `DRAFT`, `REVIEW`, `APPROVED`, `REJECTED`. |
| `priority` | VARCHAR(50) | Enum Choices | No | `"MEDIUM"` | Business importance: `HIGH`, `MEDIUM`, `LOW`. |
| `version` | VARCHAR(20) | None | No | `"1.0"` | Requirement version identifier. |
| `source_stakeholder_id`| UUID | FK -> stakeholders | Yes | None | The stakeholder who requested or originated this requirement. |
| `created_by_id`| UUID | FK -> users | Yes | None | The Business Analyst who authored the record. |
| `is_deleted` | BOOLEAN | Indexed | No | `FALSE` | Soft delete flag (included in sequence counter). |

---

## 5. Table: `user_stories`
*Target Model:* `backend/stories/models.py:UserStory`  
*Purpose:* Agile backlog cards decomposing requirements into developer increments.

| Column Name | Data Type | Constraints | Nullable | Default | Description / Business Meaning |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | No | `gen_random_uuid()` | Unique user story UUID. |
| `requirement_id`| UUID | FK -> requirements| No | None | Parent functional requirement (`on_delete=CASCADE`). |
| `story_id` | VARCHAR(50) | Composite Unique| No | `""` | Sequential story key (e.g. `US-001`), unique per project. |
| `title` | VARCHAR(255) | Not Null | No | None | Short user story summary. |
| `role` | VARCHAR(255) | Not Null | No | None | User persona (*As a...*). |
| `action` | TEXT | Not Null | No | None | Desired capability (*I want to...*). |
| `benefit` | TEXT | Not Null | No | None | Measurable business value (*So that...*). |
| `acceptance_criteria`| TEXT | None | Yes | `""` | Executable Gherkin syntax (*Given/When/Then*). |
| `points` | INT | Enum Choices | No | `3` | Fibonacci story points: `1, 2, 3, 5, 8, 13`. |
| `status` | VARCHAR(50) | Enum Choices | No | `"TODO"` | Kanban workflow column: `TODO`, `IN_PROGRESS`, `QA`, `DONE`. |
| `jira_key` | VARCHAR(100)| None | Yes | None | External Atlassian Jira issue key (e.g. `PAY-104`). |
| `jira_url` | VARCHAR(512)| URL format | Yes | None | Direct hyperlink to external Jira Cloud ticket. |

---

## 6. Table: `business_documents`
*Target Model:* `backend/documents/models.py:BusinessDocument`  
*Purpose:* Compiled BRD/FRD/IEEE specifications and digital approval history.

| Column Name | Data Type | Constraints | Nullable | Default | Description / Business Meaning |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | No | `gen_random_uuid()` | Unique document UUID. |
| `project_id` | UUID | FK -> projects | No | None | Scoping project container. |
| `doc_type` | VARCHAR(20) | Enum Choices | No | `"BRD"` | Specification format: `BRD`, `FRD`, `SWOT`, `GAP`, `IEEE`. |
| `title` | VARCHAR(255) | Not Null | No | None | Formal document title. |
| `version` | VARCHAR(20) | None | No | `"1.0"` | Document version number. |
| `status` | VARCHAR(50) | Enum Choices | No | `"DRAFT"` | Approval state: `DRAFT`, `REVIEW`, `APPROVED`, `SIGNED_OFF`. |
| `content` | TEXT | Markdown | No | None | Complete compiled specification text in Markdown format. |
| `signed_off_by_id`| UUID | FK -> users | Yes | None | Product Owner or Admin who digitally signed the document. |
| `signed_off_at`| TIMESTAMP | None | Yes | None | UTC timestamp when digital sign-off occurred. |

---

## 7. Table: `uat_test_cases` & `uat_defects`
*Target Models:* `backend/uat/models.py:TestCase`, `Defect`  
*Purpose:* User acceptance testing verification and defect tracking.

| Table | Column Name | Data Type | Constraints | Nullable | Description / Business Meaning |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `uat_test_cases` | `id` | UUID | Primary Key | No | Unique test case UUID. |
| `uat_test_cases` | `requirement_id`| UUID | FK -> requirements| Yes | Parent requirement verified by this test scenario. |
| `uat_test_cases` | `title` | VARCHAR(255) | Not Null | No | Test case summary name. |
| `uat_test_cases` | `scenario` | TEXT | None | Yes | Step-by-step test execution procedure. |
| `uat_test_cases` | `status` | VARCHAR(50) | Enum | No | Execution state: `PENDING`, `PASSED`, `FAILED`. |
| `uat_defects` | `id` | UUID | Primary Key | No | Unique defect UUID. |
| `uat_defects` | `test_case_id` | UUID | FK -> test_cases | No | Failing test scenario that surfaced this defect. |
| `uat_defects` | `severity` | VARCHAR(50) | Enum | No | Bug severity: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`. |
| `uat_defects` | `status` | VARCHAR(50) | Enum | No | Triage state: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`. |

---

## 8. Table: `integration_configs`
*Target Model:* `backend/integrations/models.py:IntegrationConfig`  
*Purpose:* Encrypted credential storage for Jira, Confluence, and Slack.

| Column Name | Data Type | Constraints | Nullable | Default | Description / Business Meaning |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | No | `gen_random_uuid()` | Unique config UUID. |
| `project_id` | UUID | One-to-One FK | No | None | Unique project binding (`on_delete=CASCADE`). |
| `jira_url` | VARCHAR(255) | URL format | Yes | None | Base domain URL for Atlassian Jira Cloud instance. |
| `jira_email` | VARCHAR(255) | Email format | Yes | None | Atlassian service account email. |
| `jira_api_token`| VARCHAR(512)| AES-128 Fernet | Yes | None | Encrypted Atlassian API token; stored as ciphertext at rest. |
| `confluence_url`| VARCHAR(255) | URL format | Yes | None | Confluence workspace base URL. |
| `slack_webhook_url`| VARCHAR(512)| URL format | Yes | None | Incoming Slack webhook endpoint for sprint notifications. |
