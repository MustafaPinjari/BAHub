# Project Assumption Log
## BAHub — Business, Technical & Operational Assumptions Register
**Document Reference:** ASM-LOG-BAHUB-2026-V1.0  
**Project:** BAHub (The AI-Powered Business Analyst Workspace)  
**Standard Adhered To:** BABOK v3 Assumption Identification & Risk Validation  
**Author:** Lead Business Analyst / Risk Architect  
**Status:** Monitored Baseline  

---

## 1. Executive Summary

An assumption is any factor considered to be true, real, or certain without empirical proof. Unvalidated assumptions represent potential delivery risks. This register catalogues all fundamental assumptions made during the discovery, architecture, and engineering of **BAHub**, along with their validation methods and contingency plans.

---

## 2. Assumptions Register

| Assumption ID | Category | Assumption Statement | Business / Technical Rationale | Validation Method | Risk if Invalid | Contingency Plan | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ASM-001** | Technical | Enterprise client organizations allow cloud-based Jira REST API v3 outbound connections. | Jira synchronization relies on direct HTTPS REST API communication to `https://{domain}.atlassian.net`. | Verified with customer network security teams; tested in sandbox. | Customers with strict air-gapped on-premise Jira cannot use live sync. | Provide manual export of Jira-compatible CSV backlog files. | **VALIDATED** |
| **ASM-002** | User UX | Business Analysts prefer an inline Notion-style spreadsheet grid over traditional modal-heavy forms. | High data-entry speed and multi-row scanning are essential for analysts managing 100+ requirements. | User feedback during design framing and prototype testing. | Users find inline edits confusing or prone to accidental edits. | Added explicit undo controls and cell focus indicators. | **VALIDATED** |
| **ASM-003** | Architecture | A 60-minute JWT access token lifetime paired with a 7-day refresh token rotation balances security and UX. | Reduces authentication database queries while limiting token theft exposure windows. | Security audit review adhering to OWASP API Security Top 10. | Users complain about repeated logouts if refresh fails silently. | Implemented Axios automatic refresh token interceptors. | **VALIDATED** |
| **ASM-004** | Operational | Organizations will maintain at least one dedicated Product Owner or Lead BA with authority to execute sign-offs. | Digital sign-off workflow requires explicit role permissions (`PRODUCT_OWNER` or `ADMIN`). | Stakeholder governance alignment in client contracts. | Documents remain stuck in `REVIEW` status without authorized signatories. | Allowed Tenant Administrators to delegate temporary sign-off authority. | **VALIDATED** |
| **ASM-005** | Technical | External AI APIs (Google Gemini / OpenAI) may experience occasional rate limits or outages. | Cloud LLM services operate under variable latency and strict token rate quotas. | Integrated deterministic domain-aware offline mock fallbacks in `agent_orchestrator.py`. | User story generation fails during client demonstrations. | System automatically fails over to offline templates when LLM returns error. | **VALIDATED** |
| **ASM-006** | Commercial | B2B consulting firms will convert from Free to Pro tier when projects exceed 5 team members. | Standard agile scrum teams typically operate with 6–9 members, necessitating an upgrade. | Monitored SaaS conversion funnel benchmarks in `MONETIZATION.md`. | Teams create separate free organizations to avoid paying. | Enforced corporate domain matching rules for organization invites. | **OPEN** |
