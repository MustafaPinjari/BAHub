# Enterprise KPI & Metric Dictionary
## BAHub — Quantitative Definitions, Mathematical Formulations & Measurement Protocols
**Document Reference:** KPI-DICT-BAHUB-2026-V1.0  
**Project:** BAHub (The AI-Powered Business Analyst Workspace)  
**Standard Adhered To:** Quantitative Business Analysis / Enterprise Performance Metrics  
**Author:** Senior Business Analyst / Performance Measurement Specialist  
**Status:** Certified Operational Dictionary  

---

## 1. Executive Summary

This dictionary establishes the exact mathematical formulations, operational definitions, telemetry sources, measurement frequencies, and target benchmarks for all Key Performance Indicators (KPIs) associated with **BAHub**.

In adherence to **Rule #4**, every numerical formula is defined with explicit baseline and post-implementation variables.

---

## 2. Quantitative Metric Formulations

### KPI 1: Specification Document Compilation Time (SDCT)
*   **Operational Definition:** The total elapsed duration in seconds between a user clicking "Compile Document" on the UI and the streaming of the completed Word (.docx) or A4 PDF binary to the browser.
*   **Target Objective:** Reduce manual document assembly time from ~12 hours to under 15 seconds.
*   **Mathematical Formula:**
    $$\text{Time Saved} = T_{\text{baseline}} - T_{\text{compiled}}$$
    $$\text{Efficiency Gain \%} = \left(\frac{T_{\text{baseline}} - T_{\text{compiled}}}{T_{\text{baseline}}}\right) \times 100$$
    *Where:*
    *   $T_{\text{baseline}} = 720\text{ minutes}$ (Historical manual assembly average in Microsoft Word)
    *   $T_{\text{compiled}} = \text{Measured API response time (typically } 0.05 \text{ to } 0.15\text{ minutes)}$
*   **Telemetry Source:** Django application request/response logs (`RichHandler` timing on `POST /api/v1/documents/compile/`).
*   **Target Benchmark:** $T_{\text{compiled}} < 15.0 \text{ seconds}$ ($\mathbf{> 99.9\% \text{ reduction}}$).

---

### KPI 2: Requirements Traceability Coverage Ratio (RTCR)
*   **Operational Definition:** The percentage of active functional requirements in a project that possess at least one associated UAT test case.
*   **Target Objective:** Ensure 100% verification coverage prior to milestone release baselining.
*   **Mathematical Formula:**
    $$\text{RTCR} = \left(\frac{R_{\text{verified}}}{R_{\text{total}}}\right) \times 100$$
    *Where:*
    *   $R_{\text{verified}} = \text{Count of requirements with } \text{Count}(\text{test\_cases}) \ge 1$
    *   $R_{\text{total}} = \text{Total count of non-deleted requirements in the project}$
*   **Telemetry Source:** Traceability Matrix SQL aggregation query (`backend/uat/models.py`).
*   **Target Benchmark:** $\mathbf{100.0\% \text{ Coverage}}$ (Zero unverified requirements in approved baseline).

---

### KPI 3: Discovery-to-Backlog Delivery Lead Time (DLT)
*   **Operational Definition:** The total business days required to move a product feature set from the initial discovery kickoff meeting to an approved, sprint-ready agile user story backlog.
*   **Target Objective:** Compress requirements delivery lead time by 35%.
*   **Mathematical Formula:**
    $$\text{Lead Time Compression \%} = \left(\frac{\text{DLT}_{\text{baseline}} - \text{DLT}_{\text{bahub}}}{\text{DLT}_{\text{baseline}}}\right) \times 100$$
    *Where:*
    *   $\text{DLT}_{\text{baseline}} = 14.0\text{ business days}$ (Historical IT consulting industry benchmark)
    *   $\text{DLT}_{\text{bahub}} = 9.1\text{ business days}$ (Modeled operational target)
*   **Telemetry Source:** Timestamp delta between `Meeting.created_at` (Discovery) and `BusinessDocument.signed_off_at` (Sign-off).
*   **Target Benchmark:** $\mathbf{35.0\% \text{ Lead Time Reduction}}$ (Target: $\le 9.1 \text{ days}$).

---

### KPI 4: Requirement Identifier Collision Rate (RICR)
*   **Operational Definition:** The number of duplicate or colliding requirement keys (e.g. two separate requirements sharing `REQ-004`) generated within a single project scope.
*   **Target Objective:** Achieve zero key collisions.
*   **Mathematical Formula:**
    $$\text{RICR} = \text{Count of duplicate keys in } (project\_id, req\_id)$$
*   **Telemetry Source:** Relational database composite unique constraint violation logs on `requirements` table.
*   **Target Benchmark:** $\mathbf{0 \text{ Collisions}}$ (Architecturally guaranteed via atomic row locks).

---

### KPI 5: Automated Test Harness Pass Rate (ATHPR)
*   **Operational Definition:** The percentage of automated backend unit and integration test methods passing cleanly without errors or failures.
*   **Target Objective:** Maintain 100% pass rate across all builds.
*   **Mathematical Formula:**
    $$\text{ATHPR} = \left(\frac{T_{\text{passed}}}{T_{\text{total}}}\right) \times 100$$
    *Where:*
    *   $T_{\text{passed}} = 179\text{ passed test methods}$
    *   $T_{\text{total}} = 179\text{ total test methods in test harness}$
*   **Telemetry Source:** Django test runner terminal output (`python manage.py test`).
*   **Target Benchmark:** $\mathbf{100.0\% \text{ Pass Rate}}$.
