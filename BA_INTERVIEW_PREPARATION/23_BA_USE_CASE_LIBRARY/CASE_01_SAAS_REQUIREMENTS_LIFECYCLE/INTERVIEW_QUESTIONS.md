# Targeted Interview Questions & Answers — Case Study 01
## BAHub — Requirements Lifecycle & Enterprise SaaS
**Document Reference:** INT-QUES-CASE01-2026  
**Classification:** `SIMULATED BA CASE STUDY` Interview Training Guide  

---

### Q1: Why did you prioritize automated document compilation over real-time collaborative chat?
*   **Answer:** As a Business Analyst, I analyzed where the team’s biggest bottleneck existed. Teams already have excellent chat tools (Slack, Teams), but analysts were losing 10–15 hours every sprint manually copy-pasting tables into Word to generate BRDs. By automating document compilation, we solved a direct, measurable pain point that delivered immediate ROI.

### Q2: How did you ensure that requirement keys like `REQ-001` never duplicated in high-concurrency environments?
*   **Answer:** I collaborated with the technical architect to enforce database transaction row-locking on the parent project. Instead of computing the ID on the frontend, the backend counts all historical records (including soft-deleted rows) inside the atomic transaction, guaranteeing zero collisions.

### Q3: How did you bridge the gap between business requirements and developer execution in Jira?
*   **Answer:** We enforced a strict parent-child foreign key dependency where no user story can exist without a parent requirement. Furthermore, we integrated a REST connector to Atlassian Jira Cloud that pushes stories with Gherkin acceptance criteria and saves the returned Jira key directly on the story card.

### Q4: How did you handle scope changes after a BRD had already been signed off?
*   **Answer:** Once a document achieves `SIGNED_OFF` status, its text is locked as an immutable baseline. Any subsequent scope adjustments must be submitted as a formal `ChangeRequest` record evaluated by the Change Control Board (CCB), creating a new document version (`1.1`).
