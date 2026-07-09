# BAHub – The AI-Powered Business Analyst Workspace

BAHub is a production-quality, enterprise-grade AI-powered workspace designed for Business Analysts. It streamlines daily BA activities—from requirement gathering, stakeholder mapping, and user story generation to BRD/FRD writing, SWOT analysis, and meeting notes tracking.

The visual style is **handcrafted, minimal, and typography-driven**—inspired by premium tools like Linear, Notion, and Stripe.

---

## 🗺️ Project Development Journey: Phase 0 to Present

BAHub has evolved through a structured, phase-based development lifecycle, transforming from a conceptual boilerplate into an enterprise-ready SaaS application:

### 🏁 Phase 0: Conceptualization & Architecture Definition
* **Vision & Layout**: Designed a high-fidelity, minimal, typography-driven visual interface inspired by Linear, Notion, and Stripe.
* **Palette Mapping**: Defined a nature-inspired executive color system (`Primary Green`, `Soft Cream Yellow`, `Amber Warning`, `Deep Dark Forest base`).

### 📦 Phase 1: Project Setup, Boilerplate, and Authentication
* **Backend Boilerplate**: Assembled the Django framework, PostgreSQL/SQLite database configurations, and standard API JSON envelope structures.
* **JWT Auth Implementation**: Configured SimpleJWT authentication, token validation, refresh interceptors, and a custom `UserSession` logger tracking active browser agents and login locations.

### 🏢 Phase 2: Multi-Tenancy & Project Scoping (Phase 1.5 & 2)
* **Tenant Isolation**: Introduced the `Organization` model to act as tenant container scopes. Enforced strict database-level cascaded deletes and multi-tenant security filters.
* **Project Membership Scoping**: Structured `Project` and `ProjectMember` models. Standard users are strictly isolated to projects where they hold membership, while administrators have high-level visibility.

### 👥 Phase 3: Stakeholder Register & Power/Interest Matrix
* **Stakeholder Profiling**: Built directories mapping title, department, email, and notes.
* **Interactive 2x2 Grid**: Programmed an interactive **Power/Interest grid matrix** that maps stakeholders into four quadrants (Manage Closely, Keep Satisfied, Keep Informed, Monitor) with drag/toggle updates.

### 📝 Phase 4: Structured Requirements Backlog
* **Auto-Incrementing Codes**: Developed custom SQL transaction triggers auto-assigning sequential codes (e.g. `REQ-001`) scoped to each project to ensure strict uniqueness.
* **Notion-Style Requirements Editor**: Developed a split-grid interactive spreadsheet editor supporting direct inline field edits, priority tags, and filter states.

### 🏃 Phase 5: Agile User Stories & Kanban Board
* **User Story Mapper**: Linked user stories directly to parent functional/non-functional requirements, supporting structured formats (*As a... I want to... So that...*) and story points.
* **Kanban Backlog**: Programmed an interactive drag-and-drop Kanban board mapping stories into status lanes (*To Do*, *In Progress*, *Ready for QA*, *Done*).

### 📄 Phase 6: BRD/FRD Document Compiler
* **Compilation Engine**: Created dynamic markdown assemblers aggregating stakeholder matrices, requirements tables, and user story backlogs.
* **Review & Sign-Off Workflows**: Implemented formal PO/PM review signatory queues to track approval audits.

### 📅 Phase 7: Meeting & Action Item Management
* **Minutes of Meeting (MoM) Tracker**: Created meeting loggers containing agendas, attendee lists, meeting notes, and linked requirement updates.
* **Checklist Mappers**: Tied checklist action-items directly to users, rendering stateful checkboxes that update completion status live.

### ⚠️ Phase 8: Risks Register & Scope Change Controls
* **Risk Quadrants**: Created project risk logs checking probability and impact levels to map risk vectors.
* **Change Request (CR) Control**: Integrated a formal ticket submission pipeline for scope adjustments with PO review actions.

### 📊 Phase 9: Strategic Workspaces (SWOT & Gap Analysis)
* **SWOT Matrices**: Built 2x2 colored quadrant grids tracking Strengths, Weaknesses, Opportunities, and Threats per project.
* **Gap Analysis Spreadsheets**: Built data planners charting Current State vs. Future State and mapping the exact transition actions needed to bridge the gap.

### 📈 Phase 10: Central Reports & Workspace Metrics
* **Metrics Compiler**: Aggregated requirement completion rates, story point totals, risk indices, and open change requests into unified API views.
* **Visual Dashboards**: Programmed responsive dashboard metrics featuring styled progress bars.

### 🤖 Phase 11: AI Assistant Playground
* **Contextual Chatbot**: Tied a conversational playground into active project contexts. Business Analysts can chat with the assistant to auto-generate requirements, audit compliance, or write test scenarios.

### 🔌 Phase 12: Jira & Confluence Sync Integrations
* **Jira Connection Board**: Configured external API connections supporting sync logs and direct sync actions to publish user stories and requirement catalogs to Jira.

### ⚡ Phase 13: Live Collaboration (WebSockets)
* **Real-time Synchronization**: Configured Daphne ASGI servers and WebSockets. Integrated live collaborator presence indicators, active typing bubbles, and background database syncs.

### 🖨️ Phase 14: Direct PDF & Word Exports
* **Document Engines**: Built backend conversion tasks utilizing `python-docx` and styled A4 layout engines (`WeasyPrint`) to download formatted Word files and PDF packages directly from the browser.

### 🤖 Phase 15: Context-Aware Multi-Vendor LLM Orchestrator
* **Multi-LLM Integration**: Integrated active context wrappers forwarding metrics directly to OpenAI and Gemini REST APIs, with offline fallback mock configurations.

### 🎨 Phase 16: Modern UI/UX Redesign
* **Aesthetic Polish**: Swapped generic styling for custom Plus Jakarta Sans typography, sleek card hovers, customized slim scrollbars, and premium dark/light mode interfaces.

### 🔒 Phase 17 (Present): Enterprise Billing, Traceability Matrix, UAT & Admin Upgrades
* **Traceability Matrix**: Created end-to-end trace mapping connecting Requirements backwards to stakeholders/meetings, and forwards to user stories, risks, and UAT cases.
* **User Acceptance Testing (UAT)**: Programmed validation suites mapping test scenarios, logging test execution results, and collecting formal client sign-offs.
* **Backend-Enforced Billing & Grace Periods**:
  - Every API endpoint validates subscription statuses (`subscription.is_active` and `plan_verified`) at the backend level.
  - Implemented a **3-day grace period** for expired plans with user warning overlays.
  - Full mock billing integration with automated HTML receipt emails and dynamic PDF invoice generators.
  - Plan-specific workspace member seat limits (Free: 3, Pro: 15, Enterprise: Unlimited).
* **Database Resolution Lock**: Modified settings.py to bind SQLite databases to `backend/db.sqlite3` preventing dual database creation.
* **Django Admin App Registration**: Registered all 12 modules in Django Admin with custom lists, filters, and searches.
* **Test Suite Verification**: Restored 100% success on the test suite (123 tests passing).

---

## 🎨 Workspace Color System

BAHub uses a custom nature-inspired executive SaaS palette:
* 🟢 **Primary Accent**: `#467235` (Medium Forest Green) — Used for primary actions, active highlights, and buttons.
* 🟡 **Highlight Accent**: `#FFF78D` (Soft Cream Yellow) — Used for light background selection states, focus highlights, and active alerts.
* 🟨 **Warning State**: `#FFBF00` (Amber Yellow-Orange) — Used for alerts, warnings, and pending approval notifications.
* 🌲 **Dark Base**: `#283F24` (Deep Dark Forest Green) — Used as the base background, sidebar fills, and panels in Dark Mode.

---

## 🛠️ Technology Stack

### Backend
* **Django** (Python 3.13+)
* **Django REST Framework** (DRF)
* **JWT Authentication** (SimpleJWT)
* **SQLite** (Development database)
* **Centralized Logging** & custom exception envelope handlers
* **Pillow** & **python-docx** & **WeasyPrint** (Document engines)

### Frontend
* **React** + **Vite** (TypeScript strict mode)
* **Tailwind CSS** & **clsx** / **tailwind-merge**
* **React Router v6**
* **TanStack Query** (React Query)
* **React Hook Form** + **Zod**
* **Axios** (with automatic token-refresh interceptors)
* **Lucide React Icons**

---

## 📂 Project Structure

```text
BAHub/
│
├── backend/            # Django REST Framework backend
│   ├── core/           # BaseModel (UUIDs, Soft Delete, Pagination, Envelopes)
│   ├── users/          # Custom User, Session Logger, Preferences, Auth
│   ├── organizations/  # Multi-tenant Organization container
│   ├── manage.py       # Django CLI utility
│   ├── db.sqlite3      # SQLite database
│   └── requirements.txt
│
├── frontend/           # React + Vite + TS frontend
│   ├── src/
│   │   ├── app/        # State & contexts
│   │   ├── components/ # Reusable UI kit & Stripe-inspired DataTable
│   │   ├── features/   # Feature-based pages (Dashboard, Profile, Auth)
│   │   ├── services/   # Axios API client
│   │   ├── types/      # TypeScript declarations
│   │   └── index.css   # Main stylesheet (color tokens, scrollbars)
│   └── package.json
│
├── run_all.bat         # Single-click run script for Windows
├── README.md           # This file
└── LICENSE             # MIT License
```

---

## 🚀 Getting Started

> [!NOTE]
> **Database Location**: The SQLite database is permanently configured to resolve to [backend/db.sqlite3](file:///c:/Users/pinja/OneDrive/Desktop/BAHub/backend/db.sqlite3). Path resolutions in `settings.py` are locked to avoid creating duplicate database files in the project root. You can safely delete any duplicate `db.sqlite3` file in the root folder.

### Windows One-Click Execution
Double-click `run_all.bat` in the workspace root, or run it via PowerShell:
```powershell
.\run_all.bat
```
*Press `Ctrl+C` in that console window to stop both servers.*

### Seeding / Resetting Demo Data
To reset your local SQLite database and seed it with a rich dataset of sample projects, stakeholders, requirements, and user stories, run:
```powershell
.\seed_data.bat
```

### Manual Deployment

#### 1. Setup Backend
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Activate the virtual environment:
   ```powershell
   .\venv\Scripts\activate
   ```
3. Run migrations and start server:
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```
   *Runs on `http://127.0.0.1:8000/`*

#### 2. Setup Frontend
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Start the Vite server:
   ```bash
   npm run dev
   ```
   *Runs on `http://localhost:5173/`*

---

## 🔑 Demo Access Profiles

Pre-populated workspace demo credentials:
* **Business Analyst Account**:
  * **Username**: `analyst`
  * **Password**: `AnalystP@ss123`
* **Administrator Account**:
  * **Username**: `admin`
  * **Password**: `AdminP@ss123`
* **Django Admin Superuser**:
  * **Access Route**: `/admin` (navigating to `http://127.0.0.1:5173/admin` redirects to Django administration panel)
  * **Username**: `mustafa`
  * **Password**: `Mustafa@123`

---

## 🧪 Verification Commands

### Run Backend Tests
Tests verify the core base model, custom password validator constraints, registration, JWT logins, and session tracking:
```bash
cd backend
.\venv\Scripts\python manage.py test
```

### Run Frontend Build
Compiles all modules, style rules, and types into a production build:
```bash
cd frontend
npm run build
```
