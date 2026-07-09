# BAHub – The AI-Powered Business Analyst Workspace

BAHub is a production-quality, enterprise-grade AI-powered workspace designed for Business Analysts. It streamlines daily BA activities—from requirement gathering, stakeholder mapping, and user story generation to BRD/FRD writing, SWOT analysis, and meeting notes tracking.

The visual style is **handcrafted, minimal, and typography-driven**—inspired by premium tools like Linear, Notion, and Stripe.

---

## ✨ Comprehensive Features List

BAHub delivers a fully featured workspace for business analysts and product teams, covering all administrative, planning, collaborative, and security requirements:

### 1. Multi-Tenant SaaS Scoping & Security
* **Tenant Scopes**: Organizations act as isolated tenant containers. Standard workspace members can only view projects they are assigned to, while BAs, POs, and Admins can view all projects inside the organization.
* **Cascade Safeguards**: Enforces strict database-level cascaded deletes. If an organization or project is deleted, all related requirements, user stories, risks, and documents are securely deleted.
* **Granular Role Controls**: Integrates six pre-configured roles: `Admin`, `Business Analyst`, `Product Owner`, `Developer`, `QA Tester`, and `Stakeholder` to determine page layouts, write permissions, and document review queues.

### 2. User Profiles, Sessions & Preferences
* **Profile Management**: Customize profiles with username, email, phone number, bio, and profile picture uploads.
* **User Preferences**: Stateful layout settings including Light/Dark/System theme options, color themes (e.g. Indigo, Green), custom date/time formats, and sidebar layout settings.
* **Active Session Logging**: Tracks user authentication with device types, browser agents, IP addresses, and allows revoking active sessions.
* **OTP Sign-up Validation**: Custom registration workflow sending verification codes to validate user email addresses before activating their account.

### 3. Team Management
* **Workspace Teams**: Organize members into distinct teams.
* **Membership Actions**: Invite organization members, assign roles, and map teams directly to active project boards.

### 4. Project Directory
* **Project Dashboard**: Tracks description, project status, targeted completion dates, and team assignments.
* **Project Metrics Summary**: Dynamic computation of active requirements, sprint completion, and pending tasks.

### 5. Stakeholder Mapping & 2x2 Matrix
* **Stakeholder Directory**: Map titles, email, telephone, department, and notes.
* **2x2 Matrix Canvas**: Color-coded drag-and-drop grid sorting stakeholders by Power and Interest into quadrants (*Manage Closely*, *Keep Satisfied*, *Keep Informed*, *Monitor*) for communication planning.

### 6. Requirements Specification Grid
* **Notion-Style Grid**: An interactive spreadsheet style grid for inline editing, category tagging (Functional, Non-Functional, Technical, Business, etc.), and status controls (Draft, Review, Approved, Implemented).
* **Sequential Auto-IDs**: Custom database transaction blocks auto-assigning unique codes (e.g., `REQ-001`) per project to guarantee clean documentation.
* **Stakeholder Trace**: Assigns requirements directly to their source stakeholder to map business value.

### 7. Agile User Stories & Sprint Boards
* **Story Mappings**: Map user stories directly to parent functional requirements.
* **Formulation Templates**: Build user stories with standard templates (*As a... I want to... So that...*) and acceptance criteria lists.
* **Kanban Boards**: Drag-and-drop sprint boards tracking development progress across lanes (*To Do*, *In Progress*, *Ready for QA*, *Done*) featuring Fibonacci story point estimations.

### 8. Document Generation (BRD & FRD Compilers)
* **Document Builder**: Generates formal Business Requirements Documents (BRD) and Functional Requirements Documents (FRD) by pulling active stakeholders, requirements, and user stories.
* **Review Sign-Off Queues**: Assign reviewers to sign off on generated specs with automated PO/PM signature logging.
* **Binary File Exports**: Exports formatted documents as Microsoft Word (`.docx`) files or print-styled A4 PDF packages directly from the UI.

### 9. Meeting Briefings & Interactive MoM
* **Meeting Logs**: Track titles, agendas, dates, attendees, and detailed Minutes of Meetings.
* **Checklist Action Items**: Assign task checkboxes to attendees, which update completion status live.

### 10. Governance (Risks & Change Requests)
* **Risk Registers**: Profile threats based on probability and impact options.
* **Change Request (CR) Control**: Submit scope changes, review analysis, track code impacts, and submit tickets to POs for review and sign-off.

### 11. Strategic Canvases (SWOT & Gap Analysis)
* **SWOT Quadrants**: 2x2 matrix dashboard to edit and organize project Strengths, Weaknesses, Opportunities, and Threats.
* **Gap Analysis Planners**: Strategic spreadsheets mapping Current State vs. Target Future State alongside transition actions.

### 12. Traceability Matrix
* **End-to-End Trace Mapping**: A dedicated view showing trace relationships mapping Requirements backwards to stakeholders and meetings, and forwards to user stories, risks, and UAT cases.

### 13. User Acceptance Testing (UAT)
* **UAT Suites**: Manage test scenarios, write step-by-step acceptance steps, and log execution runs (*Pass*, *Fail*, *Blocked*).
* **Sign-off Evidence**: Collect formal business approval evidence for final release.

### 14. Real-time Collaboration (WebSockets)
* **WebSockets Channels**: ASGI WebSockets syncing catalogs, broadcasting live collaborator online badges, active typing indicator bubbles, and syncing backlog updates.

### 15. Context-Aware AI Playground
* **Contextual Chatbot**: Prompt assistant with project statistics to automatically write user stories, audit compliance, or write test scripts.

### 16. Audit Logging & SOC 2 Compliance
* **Immutable Logs**: Capture user actions, logins, database updates, deletions, and config changes for compliance audits.

### 17. Jira & Confluence Integrations
* **Jira Sync Connector**: Save credentials, test API connections, and sync backlogs directly with Jira.

### 18. Subscription Plans & Billing Protection
* **Backend Authorization**: Restricts API calls to active subscription accounts verifying `subscription.is_active` and `plan_verified`.
* **Grace Periods**: 3-day grace period for expiring plans with UI warning banners.
* **Checkout & Invoices**: Stripe simulation portal generating PDF invoices, transaction history, and automated HTML email receipts.
* **Seat Restrictions**: Limit member seats based on plan tiers (Free: 3, Pro: 15, Enterprise: Unlimited) with database-level checks.

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
