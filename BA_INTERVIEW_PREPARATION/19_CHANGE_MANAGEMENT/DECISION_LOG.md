# Project Decision Log (ADR & Business Decisions)
## BAHub — Architectural Decision Records & Strategic Product Choices
**Document Reference:** DEC-LOG-BAHUB-2026-V1.0  
**Project:** BAHub (The AI-Powered Business Analyst Workspace)  
**Standard Adhered To:** Architecture Decision Records (ADR) / BABOK Decision Modeling  
**Author:** Lead Technical Business Analyst / Enterprise Solutions Architect  
**Status:** Baselined Register  

---

## 1. Executive Summary

This register documents the foundational architectural, product, and technical design decisions made throughout the evolution of **BAHub**. For every critical decision, this record captures:
*   The business problem and context
*   Alternatives evaluated
*   Trade-offs analyzed
*   The final decision and its measurable outcome

---

## 2. Architectural & Business Decision Records

### Decision ADR-001: Sequential ID Generation via Database Row Counting
*   **Context:** Business Analysts require human-readable requirement keys (`REQ-001`) that never collide across concurrent edits.
*   **Alternatives Considered:**
    *   *Alternative A (Client-side UUIDs):* Easy to generate, but produces unreadable keys (e.g. `REQ-3f8a9b2c`) that clients and developers cannot reference in conversation.
    *   *Alternative B (Database Auto-Increment Columns):* Global auto-increment creates keys like `REQ-10923` that do not start from `001` per project.
    *   *Alternative C (Project-Scoped Count including Soft-Deletes):* Selected solution (`backend/requirements/models.py`).
*   **Trade-offs Analyzed:** Counting records introduces a slight database read query overhead during insertions, but guarantees clean, human-friendly sequencing per project container.
*   **Final Decision:** Adopted Alternative C. Implemented in `Requirement.save()` using atomic transaction locks on the parent project row.
*   **Impact:** 100% human-readable keys (`REQ-001` to `REQ-999`) with zero collisions.

---

### Decision ADR-002: Parent-Child Enforcement for User Stories
*   **Context:** In traditional Jira setups, developers frequently create user stories detached from business requirements, causing "Requirements Drift."
*   **Alternatives Considered:**
    *   *Alternative A (Optional Linking):* Allow standalone stories.
    *   *Alternative B (Strict Foreign Key Dependency):* Require every `UserStory` to reference a valid `Requirement` foreign key (`on_delete=CASCADE`).
*   **Trade-offs Analyzed:** Strict enforcement requires BAs to establish requirements before stories can be drafted, slightly restricting ad-hoc task creation, but guarantees 100% specification traceability.
*   **Final Decision:** Adopted Alternative B (`backend/stories/models.py`).
*   **Impact:** Zero orphaned developer tasks; 100% backward traceability to business objectives.

---

### Decision ADR-003: Symmetric Fernet Encryption for External API Tokens
*   **Context:** External Atlassian Jira and Confluence API tokens stored in `IntegrationConfig` must be protected from database dumps or SQL injection leaks.
*   **Alternatives Considered:**
    *   *Alternative A (Plaintext Storage):* Rejected as a critical security vulnerability.
    *   *Alternative B (External Secrets Vault - HashiCorp Vault):* High infrastructure cost and complex configuration for small-to-medium enterprise deployments.
    *   *Alternative C (Django Custom Model Field using Cryptography Fernet):* Selected solution (`backend/integrations/models.py:EncryptedCharField`).
*   **Trade-offs Analyzed:** Deriving a 32-byte key from `SECRET_KEY` via SHA-256 allows seamless database encryption/decryption without external vault dependencies.
*   **Final Decision:** Adopted Alternative C.
*   **Impact:** Sensitive credentials are fully encrypted at rest in the database and only decrypted in memory during active API calls.

---

### Decision ADR-004: Multi-Model AI Orchestrator with Deterministic Offline Fallbacks
*   **Context:** AI user story generation is a marquee feature, but commercial cloud LLM APIs (Gemini/OpenAI) can suffer from rate limits, network outages, or absent API keys.
*   **Alternatives Considered:**
    *   *Alternative A (Single Provider Hardcoding):* Tie platform exclusively to OpenAI. Outages stall the entire application.
    *   *Alternative B (Pluggable Multi-LLM Runner with Offline Mock Domain Fallbacks):* Selected solution (`strategic/agent_orchestrator.py`).
*   **Trade-offs Analyzed:** Requires maintaining a rich local catalog of domain templates (Pet Care, Healthcare, Banking, Logistics), but guarantees that the system never fails or shows empty screens during client demonstrations or offline pilots.
*   **Final Decision:** Adopted Alternative B.
*   **Impact:** 100% demo and test reliability regardless of external cloud API availability.

---

### Decision ADR-005: 3-Day Grace Period for Subscription Middleware
*   **Context:** Enforcing hard cut-offs on subscription expiration creates severe customer friction when credit cards expire or enterprise bank transfers are delayed.
*   **Alternatives Considered:**
    *   *Alternative A (Hard Cut-off):* Block all API calls immediately upon expiration.
    *   *Alternative B (3-Day Soft Grace Window):* Selected solution (`backend/core/middleware.py`).
*   **Trade-offs Analyzed:** Allows temporary unpaid usage for 72 hours, but dramatically reduces enterprise churn caused by inadvertent billing lockouts.
*   **Final Decision:** Adopted Alternative B. Users receive a persistent warning banner while maintaining read/write access for 3 days post-expiration.
*   **Impact:** Preserved analyst productivity and eliminated emergency support escalations.
