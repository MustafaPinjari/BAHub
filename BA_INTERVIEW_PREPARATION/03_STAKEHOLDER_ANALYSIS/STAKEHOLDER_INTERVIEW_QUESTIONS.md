# BAHub — Stakeholder Interview Elicitation Guides
**Document ID:** STK-QUES-BAHUB-001  
**Project:** BAHub (The AI-Powered Business Analyst Workspace)  
**Author:** Senior Business Analyst / Requirements Elicitation Lead  
**Purpose:** Structured requirements elicitation questions categorized by stakeholder persona to guide discovery workshops and requirements engineering.

---

## 1. Executive Business Sponsor & Client Leadership
*Persona Focus: Business value, ROI, regulatory compliance, delivery timelines, risk exposure.*

1.  **Strategic Alignment:** "What are the primary business objectives driving the need for a unified business analysis platform, and what does success look like at the end of Year 1?"
2.  **Current Cost of Inefficiency:** "How much delivery delay or budget overrun in past projects has been directly attributed to requirements misalignment, scope creep, or defective specifications?"
3.  **Governance & Compliance:** "What specific regulatory or enterprise audit frameworks (e.g., SOC 2, ISO 27001, HIPAA, GDPR) must our requirements, documentation, and user session logs adhere to?"
4.  **Sign-off Authority:** "What is the formal authorization chain required to baseline a Business Requirements Document (BRD) or approve a major Scope Change Request?"
5.  **Budget & Licensing:** "What are the enterprise constraints regarding cloud hosting vs. on-premises deployment, and what tier of seat licenses (Free, Pro, Enterprise) aligns with your organizational structure?"

---

## 2. Product Owner / Product Management (PO/PM)
*Persona Focus: Backlog grooming, prioritization, sprint velocity, Jira integration, change control.*

1.  **Backlog Management:** "How do you currently decompose high-level business specifications into developer-ready user stories, and where does information breakdown typically occur?"
2.  **Agile Estimation Standards:** "What estimation methodology does the team enforce (e.g., Fibonacci points 1, 2, 3, 5, 8, 13), and what criteria determine if a story is too large for a single sprint?"
3.  **Jira Synchronization:** "What fields from the BA workspace must synchronize bi-directionally with Jira (e.g., Summary, Acceptance Criteria, Story Points, Issue Key, Status)?"
4.  **Acceptance Criteria Formats:** "Do engineering teams mandate Gherkin syntax (*Given/When/Then*) for acceptance criteria, or is a checklist format preferred?"
5.  **Change Management:** "How do you handle scope change requests submitted mid-sprint, and what impact assessment data is needed before accepting or rejecting a change?"

---

## 3. Lead & Senior Business Analysts (BAs)
*Persona Focus: Requirements structuring, Notion-style grid UX, document compilation, traceability.*

1.  **Requirements Elicitation Bottlenecks:** "Which stage of your current discovery workflow consumes the most non-value-added time: drafting requirements, formatting documents, or mapping traceability?"
2.  **Categorization & Metadata:** "Beyond Functional and Non-Functional, what attributes (e.g., Technical, UI, Priority, Source Stakeholder, Version) are essential for your daily requirements grid?"
3.  **Document Assembly Needs:** "When generating a BRD or FRD, what standard sections must be automatically populated from the database (e.g., Executive Summary, Stakeholder Matrix, Backlog Tables, Risk Logs)?"
4.  **Traceability Verification:** "How do you currently verify that every functional requirement has an originating business driver, a corresponding user story, and an associated UAT test case?"
5.  **Collaboration & Locking:** "How should the platform handle concurrent editing when two analysts are updating requirements or process diagrams simultaneously?"

---

## 4. Software Engineers & Tech Leads (Dev)
*Persona Focus: Technical feasibility, architecture, API specifications, database design, clear constraints.*

1.  **Technical Requirement Clarity:** "What technical details must be captured in requirements to allow engineering to design robust APIs and database schemas without repeated back-and-forth?"
2.  **API & Data Constraints:** "How should non-functional requirements (e.g., API response times < 200ms, JWT session timeouts, data encryption at rest) be structured for automated verification?"
3.  **Jira Workflow Hand-off:** "What information do you expect to see on an imported Jira issue card created from a BAHub user story?"
4.  **Diagram Preferences:** "When modeling complex workflows, do you prefer standardized BPMN 2.0 notation, UML sequence diagrams, or interactive ReactFlow node-edge graphs?"
5.  **Error Handling & Edge Cases:** "How should exception flows and boundary validation rules be documented within functional specifications?"

---

## 5. QA & UAT Test Analysts
*Persona Focus: Test coverage, defect linking, scenario authoring, sign-off evidence.*

1.  **Test Case Mapping:** "What is your current process for mapping test cases back to functional requirements, and how do you identify untested requirements before a release?"
2.  **Execution Logging:** "What details are essential when recording a test execution run (e.g., Status, Tester ID, Timestamp, Execution Notes, Screen Attachments)?"
3.  **Defect Triage Workflow:** "When a test scenario fails, how should the logged defect link back to the originating requirement and user story?"
4.  **UAT Sign-off Protocol:** "What evidence do business clients require before providing formal UAT sign-off (e.g., test pass percentage, defect severity thresholds, signatory timestamps)?"
5.  **Regression Impact Analysis:** "When a requirement is modified via a Change Request, how do you quickly isolate the subset of test cases that require re-testing?"

---

## 6. IT Workspace Administrators & Security Officers
*Persona Focus: Multi-tenant isolation, RBAC, session audits, SSO, data encryption.*

1.  **Authentication & SSO:** "What Identity Provider (IdP) systems (e.g., Okta, Azure AD, Google Workspace) do you utilize for SAML 2.0 Single Sign-On?"
2.  **Session Security:** "What are your corporate standards for JWT token expiration, refresh rotation, and concurrent active session revocation?"
3.  **Data Isolation:** "What level of data separation is required between different client workspaces (e.g., logical database separation with tenant foreign keys vs. dedicated database instances)?"
4.  **Third-Party Credentials:** "What encryption standards (e.g., AES-128/256 Fernet encryption at rest) must be enforced for storing external Jira/Slack API keys?"
5.  **Audit Trail Retention:** "What events must be permanently logged in the audit trail (e.g., logins, deletions, permission changes, role elevation), and for how long must logs be retained?"
