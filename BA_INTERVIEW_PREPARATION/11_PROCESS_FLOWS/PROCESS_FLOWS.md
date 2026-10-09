# Enterprise Business Process Flows & Activity Diagrams
## BAHub — Visual Process Architecture & Sequence Engineering
**Document Reference:** PF-SPEC-BAHUB-2026-V1.0  
**Project:** BAHub (The AI-Powered Business Analyst Workspace)  
**Standard Adhered To:** BPMN 2.0 / UML Activity & Sequence Diagrams  
**Author:** Lead Process Architect / Senior Solutions Analyst  
**Status:** Approved Architecture Baseline  

---

## 1. Master Requirements-to-Release Lifecycle (Macro Flow)

The following BPMN-style activity diagram illustrates how a business feature moves through the entire BAHub unified lifecycle from discovery meeting to verified production release:

```mermaid
flowchart TD
    Start([Discovery Meeting / Client Need]) --> M1[1. Schedule Meeting & Log MoM Notes]
    M1 --> M2[2. Elicit Stakeholders & Map 2x2 Matrix]
    M2 --> M3[3. Author Requirements in Notion-Style Grid]
    M3 --> M4{Pass Quality Review?}
    
    M4 -- No --> M3
    M4 -- Yes --> M5[4. Status: APPROVED -> Trigger Auto REQ-###]
    
    M5 --> D1[5. Agile Decomposition: Author User Stories & Gherkin AC]
    M5 --> D2[6. Quality Design: Author UAT Test Cases]
    M5 --> D3[7. Governance: Log Risks & Strategic SWOT/GAP]
    
    D1 & D2 & D3 --> C1[8. One-Click Automated Document Compiler]
    C1 --> C2[9. Render Draft BRD/FRD in Rich Editor]
    C2 --> C3{PO/PM Sign-off?}
    
    C3 -- Rejected / Changes --> C4[Log Formal ChangeRequest CR]
    C4 --> M3
    C3 -- Approved --> C5[10. Status: SIGNED_OFF - Immutable Baseline Lock]
    
    C5 --> J1[11. One-Click REST Sync to Atlassian Jira Cloud]
    J1 --> J2[12. Engineering Sprint Implementation]
    J2 --> U1[13. Execute UAT Test Cases in Staging]
    
    U1 --> U2{Test Passed?}
    U2 -- Fail --> U3[14. Log Defect linked to REQ & TC]
    U3 --> J2
    U2 -- Pass --> End([15. Traceability Complete - Production Release])
```

---

## 2. Granular Process Flows & Sequence Logic

### Workflow PF-01: Auto-Sequenced Requirement Ingestion & Audit Logging

```mermaid
sequenceDiagram
    autonumber
    actor BA as Business Analyst
    participant UI as Requirements Grid (React)
    participant MW as Subscription Middleware
    participant API as Requirement ViewSet (DRF)
    participant DB as SQLite / Postgres DB
    participant AUD as AuditLog Handler

    BA->>UI: Input Title, Type, Priority & Click Save
    UI->>MW: POST /api/v1/requirements/ (Bearer JWT)
    MW->>MW: Verify Tenant Plan is Active & Seats Unlocked
    MW->>API: Route to DRF Serializer
    API->>API: Validate Title non-empty & Project belongs to Org
    API->>DB: BEGIN TRANSACTION (Row Lock on Project)
    API->>DB: SELECT COUNT(*) FROM requirements WHERE project_id = X (inc. deleted)
    DB-->>API: Count = 14
    API->>API: Calculate req_id = "REQ-015"
    API->>DB: INSERT INTO requirements (id, req_id, title, status='DRAFT', ...)
    DB-->>API: Row Created Successfully
    API->>AUD: Capture Mutation (action='CREATE', resource='Requirement', id)
    AUD->>DB: INSERT INTO audit_logs (user, ip, action, changes_json)
    API->>DB: COMMIT TRANSACTION
    API-->>UI: HTTP 201 Created (Envelope: success=true, data=Requirement)
    UI-->>BA: Render new row with REQ-015 and green save badge
```

#### Detailed Process Specifications
*   **Process Name:** Sequential Requirement Creation & Audit Logging
*   **Purpose:** Enforce unique, human-readable requirement keys without numbering collisions during concurrent multi-user editing.
*   **Actors:** Business Analyst, System Middleware, Relational Database.
*   **Trigger:** User adds a requirement via the web interface or API.
*   **Decision Points:**
    *   *Decision 1:* Is the tenant organization's subscription active? If no, block request and return HTTP 402/503.
    *   *Decision 2:* Does the user belong to the organization owning the project? If no, return HTTP 403 Forbidden.
*   **Business Rules:**
    *   `BRULE-REQ-001`: Requirement IDs are permanent and immutable once generated.
    *   `BRULE-REQ-002`: Soft-deleted records are included in the sequence count to prevent collision if restored.

---

### Workflow PF-02: User Story Jira Synchronization with Encrypted Credentials

```mermaid
sequenceDiagram
    autonumber
    actor PO as Product Owner
    participant UI as Stories Kanban Board
    participant API as Integrations ViewSet (DRF)
    participant VAULT as Fernet Cryptography Engine
    participant JIRA as Atlassian Jira Cloud REST API
    participant DB as Database

    PO->>UI: Click "Sync to Jira" on Story Card US-003
    UI->>API: POST /api/v1/integrations/jira/sync-story/ {story_id: UUID}
    API->>DB: SELECT * FROM tenant_subscriptions WHERE org_id = user.org
    DB-->>API: plan_tier = "ENTERPRISE"
    API->>DB: SELECT * FROM integration_configs WHERE project_id = story.project
    DB-->>API: Encrypted Config (jira_url, encrypted_token)
    API->>VAULT: Decrypt token with SECRET_KEY derived Fernet key
    VAULT-->>API: Plaintext Atlassian API Token
    API->>JIRA: HTTPS POST /rest/api/3/issue (Basic Auth + JSON Payload)
    
    alt Jira Successfully Creates Issue
        JIRA-->>API: HTTP 201 Created {"key": "PAY-108", "id": "10045"}
        API->>DB: UPDATE user_stories SET jira_key='PAY-108', jira_url='...'
        DB-->>API: Updated Story
        API-->>UI: HTTP 200 OK {"success": true, "jira_key": "PAY-108"}
        UI-->>PO: Story card updates with active Jira link badge
    else Jira API Error / Invalid Token
        JIRA-->>API: HTTP 401 Unauthorized
        API-->>UI: HTTP 502 Bad Gateway {"message": "Invalid Jira credentials"}
        UI-->>PO: Display red error toast: "Jira authentication failed"
    end
```

#### Detailed Process Specifications
*   **Process Name:** Encrypted Jira Cloud Story Synchronization
*   **Purpose:** Seamlessly transition business specifications into engineering execution boards without exposing plaintext API credentials.
*   **Actors:** Product Owner, Django Backend, Fernet Cryptography Engine, Atlassian Jira Cloud.
*   **Trigger:** PO clicks "Sync to Jira" on a valid user story card.
*   **Exceptions:**
    *   *Tier Ineligible:* Non-Enterprise tenants receive HTTP 403 with upgrade prompt.
    *   *Network Timeout:* If Jira API does not respond within 5000ms, the request times out safely without corrupting local story state.

---

### Workflow PF-03: Multi-Entity Document Compilation & Sign-off

```mermaid
flowchart TD
    A[BA clicks 'Compile BRD' on /brd] --> B[POST /api/v1/documents/compile/]
    B --> C[(Query DB: Requirements, Stories, Stakeholders, Risks)]
    C --> D[Markdown Assembler generates unified document]
    D --> E[Save BusinessDocument with status='DRAFT']
    E --> F[Render in RichDocumentEditor for BA Review]
    
    F --> G{BA marks document status='REVIEW'?}
    G -- Yes --> H[PO receives review notification]
    
    H --> I{PO Reviews Content}
    I -- Reject --> J[PO adds comments, reverts status to 'DRAFT']
    J --> F
    
    I -- Authorize --> K[PO clicks 'Authorize & Sign Off']
    K --> L[Validate request.user is Product Owner or Admin]
    L --> M[UPDATE business_documents SET status='SIGNED_OFF', signed_off_by=user, signed_off_at=NOW]
    M --> N[(INSERT INTO document_approval_history)]
    N --> O[Lock Editor: Content becomes Read-Only]
    O --> P[Stream print-ready Word .docx or A4 PDF via WeasyPrint]
```

#### Detailed Process Specifications
*   **Process Name:** Automated Document Compilation and Digital Sign-off
*   **Purpose:** Eliminate manual document formatting and establish a legally auditable specification baseline.
*   **Actors:** Business Analyst, Product Owner, Markdown Assembler Engine.
*   **Outputs:** Persisted `BusinessDocument` record, approval audit history, downloadable Word (.docx) and A4 PDF packages.
*   **Business Rules:**
    *   `BRULE-DOC-001`: Once set to `SIGNED_OFF`, document content is immutable. Any modifications require creating a new version (`version="2.0"`).

---

### Workflow PF-04: End-to-End UAT Execution & Defect Linkage

```mermaid
flowchart TD
    A[Sprint Engineering Completed] --> B[QA Tester opens /uat]
    B --> C[Select Test Case linked to Requirement REQ-004]
    C --> D[Execute scenario in target Staging environment]
    
    D --> E{Scenario Result?}
    E -- PASS --> F[Mark TestCase status='PASSED']
    F --> G[Traceability Matrix shows REQ-004 Verified]
    
    E -- FAIL --> H[Mark TestCase status='FAILED']
    H --> I[Open Report Defect Modal]
    I --> J[Input Defect Title, Summary & Severity: CRITICAL/HIGH/MED/LOW]
    J --> K[POST /api/v1/uat/defects/ with test_case_id]
    K --> L[(INSERT INTO defects table linked to TestCase)]
    L --> M[Traceability Matrix flags REQ-004 with Defect Badge]
    M --> N[Engineer fixes bug in sprint]
    N --> D
```

#### Detailed Process Specifications
*   **Process Name:** UAT Verification Run & Defect Linkage
*   **Purpose:** Ensure all business requirements are verified by testing before release, and provide immediate defect root-cause visibility.
*   **Actors:** QA Test Analyst, Software Engineer, Traceability Engine.
*   **Outputs:** Updated `TestCase` status, created `Defect` record, real-time update to Traceability Matrix.
