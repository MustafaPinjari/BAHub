# BAHub - Phase 4: Epics, Features, & User Stories

This document outlines the agile requirements backlog for the **BAHub** workspace, structured into Epics and Features. Each User Story is mapped to its parent requirement and includes story point estimations alongside Gherkin acceptance criteria.

---

## Epic 1: Multi-Tenant Workspace Foundation (EP-01)
* **Goal**: Provide isolated collaboration environments for organizations with secure access controls and session tracking.

### Feature 1.1: Organization Onboarding & RBAC
* **User Story (US-001)**: Tenant Registration & Seat Management
  * *Standard Format*:  
    **As a** Tenant Administrator  
    **I want to** register my organization and manage seats limit  
    **So that** my team members can collaborate securely within our subscription boundaries.
  * *Parent Requirement*: `BR-101: Secure Multi-Tenancy`
  * *Story Points*: 8
  * *Acceptance Criteria (Gherkin)*:
    ```gherkin
    Given a new user is on the Tenant Registration screen
    When they enter a unique organization name, email, and billing preferences
    Then the system must create an Organization record, generate a default free TenantSubscription with a 5-seat limit, and authenticate the admin user session.
    ```

* **User Story (US-002)**: Active Session Monitoring & Revocation
  * *Standard Format*:  
    **As a** Workspace Security Officer  
    **I want to** monitor active user sessions and revoke unrecognized tokens  
    **So that** we prevent unauthorized access to project data.
  * *Parent Requirement*: `TR-001: SimpleJWT Authentication Session Management`
  * *Story Points*: 5
  * *Acceptance Criteria (Gherkin)*:
    ```gherkin
    Given an administrator is logged into the Security Dashboard
    When they view the UserSession audit logs list
    Then the system must display the IP address, browser user-agent, device metadata, and active status for all active user tokens.
    When the administrator clicks the "Revoke Session" button
    Then the system must set is_active=False on the UserSession database record and invalidate the associated JWT token.
    ```

---

## Epic 2: Collaborative Requirement Cataloging (EP-02)
* **Goal**: Enable BAs to draft, prioritize, and co-author project requirements in real-time.

### Feature 2.1: Notion-Style Requirements Split Editor
* **User Story (US-003)**: Dual-Pane Requirements split grid
  * *Standard Format*:  
    **As a** Business Analyst  
    **I want to** view a dual-pane requirements list and detail editor  
    **So that** I can browse the requirement catalog and edit properties without page reloads.
  * *Parent Requirement*: `FR-001: Automatic Sequential Requirement ID Generation`
  * *Story Points*: 5
  * *Acceptance Criteria (Gherkin)*:
    ```gherkin
    Given a Business Analyst is on the Requirements split grid workspace
    When they select a requirement row from the left-hand index table
    Then the right-hand form pane must immediately populate with the requirement's details (Title, Type, Status, Priority, Source Stakeholder).
    And the URL route should update to target the active requirement UUID.
    ```

* **User Story (US-004)**: Project-Scoped Sequential ID Generation
  * *Standard Format*:  
    **As a** Lead Business Analyst  
    **I want** requirements to auto-increment sequentially per project  
    **So that** our requirements follow a clean, consistent numbering system across projects.
  * *Parent Requirement*: `FR-001: Automatic Sequential Requirement ID Generation`
  * *Story Points*: 3
  * *Acceptance Criteria (Gherkin)*:
    ```gherkin
    Given a Business Analyst is saving a new requirement in Project Alpha
    When the system persists the requirement in the database
    Then the system must count the existing requirements in Project Alpha
    And auto-generate the req_id prefix in the format REQ-### (e.g. REQ-001).
    ```

### Feature 2.2: Live Presence Collaboration
* **User Story (US-005)**: Active Collaborator Presence & Typing Indicators
  * *Standard Format*:  
    **As a** Business Analyst  
    **I want to** see live presence and typing indicators on the requirements grid  
    **So that** I can avoid overwriting changes when another BA is editing.
  * *Parent Requirement*: `NFR-003: Real-time Presence Indicators`
  * *Story Points*: 8
  * *Acceptance Criteria (Gherkin)*:
    ```gherkin
    Given multiple BAs are connected to the same Project Requirements Page
    When User A clicks on REQ-001 and begins editing the text area
    Then a real-time WebSocket event must broadcast a "typing" state
    And User B's screen must display the message "User A is editing..." alongside a presence indicator dot.
    ```

---

## Epic 3: Document Compilation & Review Workflows (EP-03)
* **Goal**: Package structured requirements data into formal, exportable specifications.

### Feature 3.1: Automated Document Compiler
* **User Story (US-006)**: Word (.docx) & PDF Layout Compilation
  * *Standard Format*:  
    **As a** Product Consultant  
    **I want to** export requirements and user stories to Word and PDF files  
    **So that** I can deliver formal specifications to stakeholders who review offline.
  * *Parent Requirement*: `NFR-002: Low-Latency Document Generation`
  * *Story Points*: 5
  * *Acceptance Criteria (Gherkin)*:
    ```gherkin
    Given a BA is on the BRD/FRD Document Compiler Page
    When they select the output type (PDF or Word) and click the "Compile Document" button
    Then the system must retrieve the project requirements, user stories, and stakeholder registry
    And return a downloadable, correctly styled A4 file (PDF or DOCX) in under 5 seconds.
    ```

* **User Story (US-007)**: Document Review Sign-off Flow
  * *Standard Format*:  
    **As a** Product Owner  
    **I want to** formally approve and sign off on compiled BRD/FRD documents  
    **So that** we establish a baselined version of requirements before development begins.
  * *Parent Requirement*: `FR-005: Document Sign-off Signatory Flow`
  * *Story Points*: 3
  * *Acceptance Criteria (Gherkin)*:
    ```gherkin
    Given a compiled BusinessDocument is in the "REVIEW" status state
    When the assigned Product Owner reviews the content and clicks the "Sign Off" button
    Then the system must record signed_off_by=user_id and signed_off_at=current_time
    And update the document status to "SIGNED_OFF".
    ```

---

## Epic 4: Integrations Sync (EP-04)
* **Goal**: Sync BAHub requirements data with Jira backlogs and Confluence spaces.

### Feature 4.1: Jira & Confluence Sync
* **User Story (US-008)**: Jira User Story Export Sync
  * *Standard Format*:  
    **As a** Business Analyst  
    **I want to** sync my user stories to a target Jira project board  
    **So that** developers can work from the synchronized backlog.
  * *Parent Requirement*: `BR-003: Bidirectional Jira & Confluence Sync`
  * *Story Points*: 8
  * *Acceptance Criteria (Gherkin)*:
    ```gherkin
    Given a BA has configured their Jira credentials in the project Integrations panel
    When they click the "Sync Backlog" action button
    Then the system must verify the connection, map active user stories, and create equivalent issues in the target Jira board
    And store the corresponding jira_key and jira_url values on the UserStory model.
    ```
