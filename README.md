# BAHub – The AI-Powered Business Analyst Workspace

BAHub is a production-quality, enterprise-grade AI-powered workspace designed for Business Analysts. It streamlines daily BA activities—from requirement gathering, stakeholder mapping, and user story generation to BRD/FRD writing, SWOT analysis, and meeting notes tracking.

The visual style is **handcrafted, minimal, and typography-driven**—inspired by premium tools like Linear, Notion, and Stripe.

---

## 🔒 Recent Upgrades & Enterprise Features

We have recently upgraded the codebase to support robust enterprise SaaS workflows:

### 1. Backend-Enforced Subscription Protection
* **Backend Source of Truth**: All protected API endpoints now validate subscription status on every request. Access is blocked if the organization's subscription is inactive or has not completed verification.
* **SaaS Subscription States**: Integrated full support for Active, Expired, and Unverified statuses. Added a **3-day grace period** for expired subscriptions to notify users before locking out their workspace.
* **Mock Stripe Billing Integration**: Complete simulation of upgrading to PRO/ENTERPRISE tiers. The backend handles secure payments, sends automated HTML receipt emails to customers, and dynamically creates/stores PDF invoices for download.
* **Workspace Seat Limits**: Enforced hard limits on seat size. Organizations on the FREE plan are limited to 3 members, PRO to 15, and ENTERPRISE to unlimited. New registrations and invitations are validated at the database level.

### 2. Unified Database Integrity
* **Deterministic Database Pathing**: Configured Django's settings to parse and lock relative SQLite paths (e.g. `db.sqlite3`) absolute to the `backend/` directory. This resolves any previous issues with duplicate database files being created in the workspace root when running commands from different subdirectories.

### 3. Integrated Django Admin Control Center
* **Complete App Registration**: Registered all core models in the Django admin panel across the `users`, `organizations`, `billing`, `projects`, `requirements`, `risks`, `teams`, `stakeholders`, `stories`, `meetings`, `strategic`, `uat`, and `diagrams` sub-apps.
* **Administrative UX Enhancements**: Enabled customizable filters, robust searches, list displays, and custom layouts in the admin dashboard. Corrected previous OTP code registrations and relational model mappings to prevent administrative crashes.

### 4. Fully Verified Test Suite
* **100% Passing Tests**: Fixed deprecated arguments, mock e-commerce verification pathways, and invoice rendering bugs to achieve a clean **123/123 tests passing** record across the suite.

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
