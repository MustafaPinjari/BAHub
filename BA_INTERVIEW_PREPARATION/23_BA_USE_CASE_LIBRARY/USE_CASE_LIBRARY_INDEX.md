# Universal Business Analyst Domain Case Study Library
**Document Reference:** UCS-LIB-BAHUB-2026-V1.0  
**Project:** BAHub (The AI-Powered Business Analyst Workspace)  
**Standard Adhered To:** BABOK v3 Practice Guide / Senior BA Interview Simulation Framework  
**Author:** Senior Business Analyst / Interview Practice Architect  
**Status:** Certified Training Library  

---

## 1. Domain Determination & Library Purpose

Based on the empirical evidence of this repository, the primary business domain of BAHub is **Enterprise B2B SaaS / Requirements Engineering & Agile Lifecycle Management**, complemented by the 10 real enterprise domain pilots seeded in `backend/seed_rich_demo_data.py`.

This library contains interview-training case studies derived directly from these domains. Each case study serves as a complete, self-contained demonstration of how a Senior Business Analyst elicits requirements, authors specifications, models workflows, assesses risks, and conducts UAT.

---

## 2. Master Case Study Catalog

```
23_BA_USE_CASE_LIBRARY/
├── USE_CASE_LIBRARY_INDEX.md
│
├── CASE_01_SAAS_REQUIREMENTS_LIFECYCLE/
│   ├── CASE_STUDY.md             --> End-to-end BA delivery case study
│   ├── BRD.md                    --> Business Requirements Document
│   ├── FRD.md                    --> Functional Requirements Document
│   ├── PRD.md                    --> Product Requirements Document
│   ├── USER_STORIES.md           --> User stories with Gherkin AC
│   ├── USE_CASES.md              --> Granular use case models
│   ├── PROCESS_FLOW.md           --> Visual BPMN & sequence flows
│   ├── AS_IS_TO_BE.md            --> As-Is vs To-Be state transformation
│   ├── GAP_ANALYSIS.md           --> Gap analysis & action plan
│   ├── UAT_PLAN.md               --> UAT test scenarios & verification
│   ├── RTM.md                    --> Requirements Traceability Matrix
│   ├── KPI_DEFINITION.md         --> Measurable metrics & formulas
│   ├── STAKEHOLDER_ANALYSIS.md   --> 2x2 Power-Interest matrix
│   └── INTERVIEW_QUESTIONS.md    --> 20 targeted interview questions
│
├── CASE_02_CUSTOMER_LOYALTY_SYSTEM/
│   └── COMPLETE_BA_PACKAGE.md    --> Full BA specification package for Loyalty Points Engine
│
└── CASE_03_PAYMENT_GATEWAY_INTEGRATION/
    └── COMPLETE_BA_PACKAGE.md    --> Full BA specification package for PCI-DSS Multi-Currency Gateway
```

---

## 3. Case Study Overviews

### Case Study 01: Core SaaS Agile Requirements & Document Compilation Lifecycle
*   **Domain:** Enterprise Agile Tooling / Requirements Engineering / Multi-Tenancy.
*   **Classification:** `ACTUAL IMPLEMENTED PROCESS` & `SIMULATED BA CASE STUDY` for interview training.
*   **Focus:** How a Senior BA replaces manual Word/Excel copy-pasting with an automated requirements workspace, enforcing sequential IDs (`REQ-001`), parent-child stories (`US-001`), WeasyPrint A4 PDF compilers, and digital PO sign-offs.

### Case Study 02: Customer Loyalty & Rewards Points Engine
*   **Domain:** Retail E-Commerce / Transactional Loyalty & Points Accrual.
*   **Classification:** `SIMULATED BA CASE STUDY` derived from seeded project `backend/seed_rich_demo_data.py:219`.
*   **Focus:** Real-time points accumulation, tier upgrades (Silver/Gold/Platinum), checkout redemption rules, race-condition mitigation under concurrent transactions, and external POS checkout API integrations.

### Case Study 03: Multi-Currency Payment Gateway Integration
*   **Domain:** FinTech / Global Payment Processing & PCI-DSS Tokenization.
*   **Classification:** `SIMULATED BA CASE STUDY` derived from seeded project `backend/seed_rich_demo_data.py:220`.
*   **Focus:** Multi-currency payment authorization, 3D Secure 2.0 authentication, automated chargeback logging, webhook event reconciliation, and AES-128 cryptographic token storage at rest.
