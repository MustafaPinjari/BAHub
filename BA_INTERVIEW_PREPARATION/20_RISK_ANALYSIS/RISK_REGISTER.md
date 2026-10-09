# Enterprise Project Risk Register & Mitigation Strategy
## BAHub — Threat Identification, Impact Modeling & Mitigation Controls
**Document Reference:** RSK-REG-BAHUB-2026-V1.0  
**Project:** BAHub (The AI-Powered Business Analyst Workspace)  
**Standard Adhered To:** ISO 31000 Risk Management Standard / BABOK v3 Risk Analysis  
**Author:** Senior Business Analyst / Lead Enterprise Risk Architect  
**Status:** Monitored Register  

---

## 1. Risk Governance & Severity Vector

Project risks are evaluated along a two-dimensional probability-impact matrix matching the database schema in `backend/risks/models.py:Risk`:
*   **Probability:** `HIGH` (Score: 3), `MEDIUM` (Score: 2), `LOW` (Score: 1)
*   **Impact:** `HIGH` (Score: 3), `MEDIUM` (Score: 2), `LOW` (Score: 1)
*   **Severity Rating:** Calculated as $\text{Probability} \times \text{Impact}$
    *   **CRITICAL (Score 8–9):** Requires immediate architectural or business mitigation; potential project blocker.
    *   **HIGH (Score 6):** Major threat to delivery timeline or budget; requires dedicated contingency plan.
    *   **MEDIUM (Score 3–4):** Operational risk managed through standard sprint workflows.
    *   **LOW (Score 1–2):** Minor threat monitored on a periodic review cadence.

---

## 2. Risk Classification Standards

In strict accordance with **Rule #5**, every risk in this register is categorized into one of two verifiable sources:
1.  `[IDENTIFIED FROM PROJECT]`: Direct technical, architectural, or commercial risks evidenced in codebase audits (e.g. `LAUNCH_AUDIT.md`, `settings.py`, `middleware.py`).
2.  `[BA-RECOMMENDED RISK]`: Enterprise risks recommended by a Senior Business Analyst based on industry SaaS delivery patterns.

---

## 3. Comprehensive Risk Register

| Risk ID | Risk Classification | Risk Title & Description | Root Cause | Business & Technical Impact | Probability | Impact | Severity Rating | Preventive & Contingency Mitigation | Risk Owner | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- | :--- |
| **RSK-001** | `[IDENTIFIED FROM PROJECT]` | **Hardcoded Demo User Credentials in Frontend Bundle** | Demo credentials (`analyst / AnalystP@ss123`) were previously embedded in client-side authentication bundles for quick reviewer demonstration (`LAUNCH_AUDIT.md:146`). | Malicious users could extract credentials, abuse the demo tenant, and deplete backend AI credits. | **HIGH** | **HIGH** | **CRITICAL (9)** | Remove hardcoded credentials from production bundle; implement dynamic sandbox tenant provisioning with ephemeral test sessions. | Security Lead | **MITIGATED** |
| **RSK-002** | `[IDENTIFIED FROM PROJECT]` | **Single Point of Failure on SMTP Email for OTP Verification** | New user registration enforces email OTP verification (`backend/users/models.py:EmailOTP`). | If production SMTP gateway (SendGrid/Mailgun) drops connection or encounters spam filtering, new users cannot complete registration, blocking user onboarding. | **HIGH** | **HIGH** | **CRITICAL (9)** | Implement SMS fallback, automated resend throttles, and allow platform superadmins to generate manual bypass tokens during testing. | Lead DevOps | **OPEN** |
| **RSK-003** | `[IDENTIFIED FROM PROJECT]` | **Pessimistic Diagram Locking Deadlocks** | Diagrams acquire exclusive edit locks (`Diagram.is_locked=True`) when an analyst opens the canvas (`backend/diagrams/models.py`). | If an analyst closes their browser tab without explicitly saving or releasing the lock, subsequent collaborators are permanently locked out in read-only mode. | **HIGH** | **MEDIUM** | **HIGH (6)** | Implemented 60-minute automatic lock expiration timeout; added manual "Break Lock" override button for Project Managers and Administrators. | Backend Dev | **MITIGATED** |
| **RSK-004** | `[IDENTIFIED FROM PROJECT]` | **WebSocket Memory Channel Layer Scaling Limits** | Django Channels defaults to `InMemoryChannelLayer` when `REDIS_URL` is absent in environment configuration (`settings.py:214`). | In multi-instance cloud deployments (Render/Kubernetes), real-time collaborator notifications fail to route across separate worker containers. | **HIGH** | **HIGH** | **CRITICAL (9)** | Enforce Redis Channel Layer (`channels_redis`) configuration for all production environments via `validate_environment()` startup check. | Lead Architect | **OPEN** |
| **RSK-005** | `[IDENTIFIED FROM PROJECT]` | **AI Polling Latency and Infinite Polling Loops** | AI generation uses a 2-second client polling loop against `WorkflowExecution` without a hard timeout cap (`LAUNCH_AUDIT.md:127`). | If an external Gemini API call hangs indefinitely, the client browser continues polling every 2 seconds, consuming unnecessary server bandwidth. | **MEDIUM** | **MEDIUM** | **MEDIUM (4)** | Added a client-side polling timeout cap (maximum 30 retries / 60 seconds) with user-facing failure error notification. | Frontend Lead | **MITIGATED** |
| **RSK-006** | `[BA-RECOMMENDED RISK]` | **Third-Party Jira API Token Invalidation** | Enterprise clients revoke or rotate Atlassian API tokens without updating BAHub `IntegrationConfig`. | Automated Jira story synchronization breaks silently; backlog updates fail during live sprint hand-offs. | **MEDIUM** | **HIGH** | **HIGH (6)** | Implement a daily background token health-check ping; display an immediate amber warning badge on `/integrations` if auth fails. | Lead BA | **MONITORED** |
| **RSK-007** | `[BA-RECOMMENDED RISK]` | **Scope Creep via Verbal Client Feedback** | Stakeholders propose requirement modifications during review meetings without submitting formal Change Requests. | Features expand beyond initial budget; developers implement un-estimated features, causing sprint delivery slips. | **HIGH** | **HIGH** | **CRITICAL (9)** | Enforce `BRULE-005`: Locked documents require formal `ChangeRequest` database submission with PO approval before backlog modification. | Product Owner | **MANAGED** |
| **RSK-008** | `[BA-RECOMMENDED RISK]` | **Regulatory Non-Compliance in Healthcare / Financial Pilots** | Storing patient or financial requirements without verified SOC 2 / HIPAA business associate agreements. | Client legal departments block enterprise deployment, causing deal churn. | **MEDIUM** | **HIGH** | **HIGH (6)** | Ensure immutable audit logging (`backend/audit/models.py`), Fernet encrypted credentials, and dedicated single-tenant VPC options. | Legal & Compliance | **MONITORED** |
