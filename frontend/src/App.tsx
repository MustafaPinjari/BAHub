import React, { useState, Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./features/auth/AuthContext";
import { ProjectProvider } from "./features/projects/ProjectContext";
import { LoginForm } from "./features/auth/components/LoginForm";
import { RegisterForm } from "./features/auth/components/RegisterForm";
import { DashboardShell } from "./components/layout/DashboardShell";
import banner from "./assets/banner.png";
import { LandingPage } from "./features/landing/LandingPage.tsx";
import { LaunchLockedScreen } from "./features/auth/components/LaunchLockedScreen";
import { usePublicSettings } from "./features/landing/usePublicSettings";
import { api } from "./services/api";
import { logger } from "./utils/logger";

// Lazy-loaded page components for code-splitting
const DashboardOverview = lazy(() => import("./features/dashboard/DashboardOverview").then(m => ({ default: m.DashboardOverview })));
const ProfilePage = lazy(() => import("./features/auth/ProfilePage").then(m => ({ default: m.ProfilePage })));
const TeamsPage = lazy(() => import("./features/teams/TeamsPage").then(m => ({ default: m.TeamsPage })));
const WorkspaceSettingsPage = lazy(() => import("./features/auth/WorkspaceSettingsPage").then(m => ({ default: m.WorkspaceSettingsPage })));
const ProjectsPage = lazy(() => import("./features/projects/ProjectsPage").then(m => ({ default: m.ProjectsPage })));
const StakeholdersPage = lazy(() => import("./features/stakeholders/StakeholdersPage").then(m => ({ default: m.StakeholdersPage })));
const RequirementsPage = lazy(() => import("./features/requirements/RequirementsPage").then(m => ({ default: m.RequirementsPage })));
const DiagramsPage = lazy(() => import("./features/diagrams/DiagramsPage").then(m => ({ default: m.DiagramsPage })));
const UserStoriesPage = lazy(() => import("./features/stories/UserStoriesPage").then(m => ({ default: m.UserStoriesPage })));
const DocumentGeneratorPage = lazy(() => import("./features/documents/DocumentGeneratorPage").then(m => ({ default: m.DocumentGeneratorPage })));
const SRSPage = lazy(() => import("./features/srs/SRSPage").then(m => ({ default: m.SRSPage })));
const MeetingsPage = lazy(() => import("./features/meetings/MeetingsPage").then(m => ({ default: m.MeetingsPage })));
const RisksPage = lazy(() => import("./features/risks/RisksPage").then(m => ({ default: m.RisksPage })));
const ChangeRequestsPage = lazy(() => import("./features/changes/ChangeRequestsPage").then(m => ({ default: m.ChangeRequestsPage })));
const SwotAnalysisPage = lazy(() => import("./features/strategic/SwotAnalysisPage").then(m => ({ default: m.SwotAnalysisPage })));
const GapAnalysisPage = lazy(() => import("./features/strategic/GapAnalysisPage").then(m => ({ default: m.GapAnalysisPage })));
const ReportsPage = lazy(() => import("./features/reports/ReportsPage").then(m => ({ default: m.ReportsPage })));
const AiWorkspacePage = lazy(() => import("./features/ai/AiWorkspacePage").then(m => ({ default: m.AiWorkspacePage })));
const IntegrationsPage = lazy(() => import("./features/integrations/IntegrationsPage").then(m => ({ default: m.IntegrationsPage })));
const BillingPage = lazy(() => import("./features/auth/BillingPage").then(m => ({ default: m.BillingPage })));
const AuditLogPage = lazy(() => import("./features/audit/AuditLogPage").then(m => ({ default: m.AuditLogPage })));
const TraceabilityPage = lazy(() => import("./features/traceability/TraceabilityPage").then(m => ({ default: m.TraceabilityPage })));
const UatPage = lazy(() => import("./features/uat/UatPage").then(m => ({ default: m.UatPage })));
const SuperAdminPage = lazy(() => import("./features/superadmin/SuperAdminPage").then(m => ({ default: m.SuperAdminPage })));
const PasswordResetPage = lazy(() => import("./features/auth/components/PasswordResetPage").then(m => ({ default: m.PasswordResetPage })));
const PMODashboard = lazy(() => import("./features/pmo/PMODashboard").then(m => ({ default: m.PMODashboard })));

// ─── Global Error Boundary ───────────────────────────────────────────────────
interface ErrorBoundaryState { hasError: boolean; error?: Error; }
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error("[ErrorBoundary] Caught error", { error, info });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4 text-center select-none">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 text-xl">!</div>
          <div>
            <p className="text-sm font-bold text-white">Something went wrong</p>
            <p className="text-xs text-gray-500 mt-1">Please refresh the page or contact support.</p>
          </div>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="px-4 py-1.5 text-xs font-bold rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition-colors cursor-pointer"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Loading spinner fallback for lazy routing
const PageLoader: React.FC = () => (
  <div className="w-full h-[60vh] flex flex-col items-center justify-center bg-transparent">
    <div className="relative w-10 h-10 mb-4">
      <div className="absolute inset-0 rounded-full border-2 border-white/5" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" />
    </div>
    <p className="text-[10px] font-bold text-gray-600 tracking-[0.2em] uppercase">
      Loading Page
    </p>
  </div>
);

const AuthenticatedApp: React.FC = () => {
  const { user } = useAuth();
  const isPlatformAdmin = user?.is_superuser || user?.is_staff;

  return (
    <DashboardShell>
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardOverview />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/stakeholders" element={<StakeholdersPage />} />
            <Route path="/settings" element={<WorkspaceSettingsPage />} />
            <Route path="/requirements" element={<RequirementsPage />} />
            <Route path="/diagrams" element={<DiagramsPage />} />
            <Route path="/stories" element={<UserStoriesPage />} />
            <Route path="/srs" element={<SRSPage />} />
            <Route path="/brd" element={<DocumentGeneratorPage docType="BRD" />} />
            <Route path="/frd" element={<DocumentGeneratorPage docType="FRD" />} />
            <Route path="/ieee" element={<DocumentGeneratorPage docType="IEEE" />} />
            <Route path="/meetings" element={<MeetingsPage />} />
            <Route path="/risks" element={<RisksPage />} />
            <Route path="/changes" element={<ChangeRequestsPage />} />
            <Route path="/swot" element={<SwotAnalysisPage />} />
            <Route path="/gap" element={<GapAnalysisPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/ai" element={<AiWorkspacePage />} />
            <Route path="/integrations" element={<IntegrationsPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/audit" element={<AuditLogPage />} />
            <Route path="/traceability" element={<TraceabilityPage />} />
            <Route path="/uat" element={<UatPage />} />
            <Route path="/pmo" element={<PMODashboard />} />
            {isPlatformAdmin && <Route path="/superadmin" element={<SuperAdminPage />} />}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </DashboardShell>
  );
};

import { BillingBlockedScreen } from "./features/auth/components/BillingBlockedScreen";
import { PrivacyPolicyPage } from "./features/legal/PrivacyPolicyPage";
import { TermsOfServicePage } from "./features/legal/TermsOfServicePage";
import { ContactPage } from "./features/legal/ContactPage";

const MainAppContent: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const [bypassWaitlistLock, setBypassWaitlistLock] = useState(false);
  const { waitlist_countdown_enabled } = usePublicSettings();

  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname.toLowerCase();

  const isExplicitLanding = path === "/landing" || path === "/welcome";
  const isRoot = path === "/" || path === "";
  const isLandingPath = isRoot || isExplicitLanding;
  const isWaitlistPath = path === "/waitlist" || path === "/join";
  const isLoginPath = path === "/login";
  const isRegisterPath = path === "/register";

  if (path === "/admin" || path === "/admin/") {
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const backendAdminUrl = isLocal
      ? "http://127.0.0.1:8000/admin/"
      : "https://bahub-backend.onrender.com/admin/";
    window.location.href = backendAdminUrl;
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500 mb-4 animate-pulse" />
        <span className="text-xs font-bold text-gray-400 tracking-wider">Redirecting to Django Administration...</span>
      </div>
    );
  }

  const isPlatformAdmin = user?.is_superuser || user?.is_staff;
  const isDemoUser = user?.username === "analyst" || user?.username === "admin";

  const queryParams = new URLSearchParams(location.search);
  const waitlistBypassParam = queryParams.get("waitlist_bypass") === "true";
  const hasWaitlistBypass = waitlistBypassParam || bypassWaitlistLock;

  // Waitlist Lockout check — admins, demo users, and explicit bypass holders get through
  if (waitlist_countdown_enabled && !isPlatformAdmin && !isDemoUser) {
    if (!isLandingPath && !isWaitlistPath && !hasWaitlistBypass) {
      return <Navigate to="/waitlist" replace />;
    }
    if ((isLoginPath || isRegisterPath) && !hasWaitlistBypass) {
      return <Navigate to="/waitlist" replace />;
    }
  }

  // Handle direct url path for the waitlist countdown/join screen
  if (isWaitlistPath) {
    return (
      <LaunchLockedScreen
        onAdminClick={() => {
          setBypassWaitlistLock(true);
          navigate("/login");
        }}
        onBackToHome={() => {
          navigate("/");
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-black">
        {/* Glow orb */}
        <div className="absolute w-96 h-96 rounded-full bg-purple-600/5 blur-3xl pointer-events-none" />
        <div className="relative w-14 h-14 mb-5">
          <div className="absolute inset-0 rounded-full border-2 border-white/5" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" />
          <div className="absolute inset-2 rounded-full border border-transparent border-t-blue-400 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
        </div>
        <p className="text-[10px] font-bold text-gray-600 tracking-[0.25em] uppercase">
          Hydrating Workspace
        </p>
        <div className="flex gap-1 mt-3">
          <span className="w-1 h-1 rounded-full bg-purple-500/60 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1 h-1 rounded-full bg-purple-500/60 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1 h-1 rounded-full bg-purple-500/60 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  // Public pages — always accessible, no auth required
  if (path === "/privacy") return <PrivacyPolicyPage />;
  if (path === "/terms") return <TermsOfServicePage />;
  if (path === "/contact") return <ContactPage />;

  // Password reset pages — public, no auth required
  if (path === "/forgot-password" || path === "/reset-password") {
    return (
      <div className="w-screen h-screen flex bg-black text-white overflow-hidden">
        <div className="w-full md:w-[40%] h-full flex items-center justify-center p-8 overflow-y-auto bg-black relative">
          <div className="absolute top-0 left-0 w-80 h-80 rounded-full bg-purple-600/5 blur-3xl pointer-events-none" />
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={() => navigate("/")}
              className="text-[10px] font-bold text-gray-600 hover:text-gray-300 cursor-pointer flex items-center gap-1.5 bg-transparent border-none outline-none transition-colors"
            >
              <span>←</span> Back to Home
            </button>
          </div>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <PasswordResetPage />
            </Suspense>
          </ErrorBoundary>
        </div>
        <div className="hidden md:flex md:w-[60%] h-full items-center justify-center bg-black border-l border-white/[0.06] select-none">
          <img src={banner} alt="BAHub Workspace Banner" className="w-full h-full object-contain" />
        </div>
      </div>
    );
  }


  // If user is logged in, and tries to go to login or register page, send them to dashboard
  if (isAuthenticated && (isLoginPath || isRegisterPath) && !waitlist_countdown_enabled) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleTryDemo = async () => {
    try {
      // Credentials are stored server-side only — never hardcoded in the frontend bundle
      const res = await api.post<any, any>("/auth/demo-login/");
      const resData = res?.data || res;
      if (resData?.access) {
        localStorage.setItem("accessToken", resData.access);
      }
      if (resData?.refresh) {
        localStorage.setItem("refreshToken", resData.refresh);
      }
      // Reload to hydrate auth context via initAuth
      window.location.href = "/dashboard";
    } catch {
      // Demo login unavailable — redirect to login so users can sign up
      navigate("/login");
    }
  };

  if (isLandingPath) {
    return (
      <LandingPage
        onNavigateToLogin={() => navigate("/login")}
        onNavigateToRegister={() => navigate("/register")}
        onTryDemo={handleTryDemo}
      />
    );
  }

  if (isLoginPath || isRegisterPath) {
    return (
      <div className="w-screen h-screen flex bg-black text-white overflow-hidden">
        {/* Left Side: Form Container */}
        <div className="w-full md:w-[40%] h-full flex items-center justify-center p-8 overflow-y-auto bg-black relative">
          {/* Subtle glow orb */}
          <div className="absolute top-0 left-0 w-80 h-80 rounded-full bg-purple-600/5 blur-3xl pointer-events-none" />
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={() => navigate("/")}
              className="text-[10px] font-bold text-gray-600 hover:text-gray-300 cursor-pointer flex items-center gap-1.5 bg-transparent border-none outline-none transition-colors duration-150"
            >
              <span>←</span> Back to Home
            </button>
          </div>
          {isLoginPath ? (
            <LoginForm
              onSuccess={() => navigate("/dashboard")}
              onNavigateToRegister={() => navigate("/register")}
            />
          ) : (
            <RegisterForm
              onSuccess={() => navigate("/login")}
              onNavigateToLogin={() => navigate("/login")}
            />
          )}
        </div>

        {/* Right Side: Banner Showcase Panel */}
        <div className="hidden md:flex md:w-[60%] h-full items-center justify-center bg-black border-l border-white/[0.06] select-none">
          <img
            src={banner}
            alt="BAHub Workspace Banner"
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    );
  }

  // Fallback for unauthenticated access to any other app page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isBillingBlocked = user && user.plan_tier && user.plan_tier !== "FREE" && !user.plan_verified && !isPlatformAdmin;
  if (isBillingBlocked) {
    return <BillingBlockedScreen />;
  }

  return <AuthenticatedApp />;
};

const SEOMetadataHandler: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.toLowerCase();
    let title = "BAHub — AI-Powered Business Analyst Workspace";
    let description = "BAHub — The AI-Powered Business Analyst Workspace. Synthesize requirements, generate compliant BRDs, manage stakeholders, and run AI-assisted analyses.";

    switch (path) {
      case "/dashboard":
        title = "Dashboard | BAHub — Workspace Overview";
        description = "View your active project metrics, quick actions, recent requirements, generated documents, and system audit logs in one central hub.";
        break;
      case "/profile":
        title = "My Profile | BAHub";
        description = "Manage your BAHub profile settings, personal information, authentication credentials, and user preferences.";
        break;
      case "/teams":
        title = "Team Management | BAHub";
        description = "Coordinate with project stakeholders, manage workspace permissions, and assign organization member roles.";
        break;
      case "/projects":
        title = "Projects Directory | BAHub";
        description = "View, create, and customize all business analysis projects and organizational workspaces.";
        break;
      case "/stakeholders":
        title = "Stakeholders Register | BAHub";
        description = "Register key stakeholders, track their interest and influence level, and link them to system requirements.";
        break;
      case "/settings":
        title = "Workspace Settings | BAHub";
        description = "Configure organization settings, subscription tiers, member seats, and project policies.";
        break;
      case "/requirements":
        title = "Requirements Management | BAHub";
        description = "Draft, refine, tag, and trace functional and non-functional requirements in your workspace backlog.";
        break;
      case "/diagrams":
        title = "Process Canvas & Diagrams | BAHub";
        description = "Generate and edit BPMN process diagrams, UML sequence flows, and use case maps directly in your browser.";
        break;
      case "/stories":
        title = "User Stories & Backlog Sync | BAHub";
        description = "Convert requirements into agile user stories, specify acceptance criteria, and sync directly with Jira.";
        break;
      case "/brd":
        title = "Business Requirements Document (BRD) Compiler | BAHub";
        description = "Generate standardized, client-ready BRD specifications with full traceability and formatting exports.";
        break;
      case "/frd":
        title = "Functional Requirements Document (FRD) Compiler | BAHub";
        description = "Compile system-level functional details, data models, and architectural specs into a comprehensive FRD.";
        break;
      case "/ieee":
        title = "IEEE Standard Document Generator | BAHub";
        description = "Generate IEEE-compliant technical specification documents with standardized formatting, requirements traceability, and validation criteria.";
        break;
      case "/meetings":
        title = "Meeting Briefings & Action Items | BAHub";
        description = "Document meeting minutes, capture transcripts, track action items, and link resolutions to requirements.";
        break;
      case "/risks":
        title = "Risk Register & Governance | BAHub";
        description = "Identify business risks, assign owners, outline mitigation strategies, and review compliance requirements.";
        break;
      case "/changes":
        title = "Change Request Control | BAHub";
        description = "Submit, review, audit, and approve formal scope adjustments and project change requests.";
        break;
      case "/swot":
        title = "SWOT Analysis Modeler | BAHub";
        description = "Map organization strengths, weaknesses, opportunities, and threats using interactive matrix canvases.";
        break;
      case "/gap":
        title = "Gap Analysis Planner | BAHub";
        description = "Analyze the differences between current and future state systems, mapping out clear action items.";
        break;
      case "/reports":
        title = "Reports & Analytics | BAHub";
        description = "Visualize project health, requirement trace maps, coverage metrics, and stakeholder engagement stats.";
        break;
      case "/ai":
        title = "AI Strategic Assistant | BAHub";
        description = "Consult the BAHub AI assistant to refine briefs, audit compliance, brainstorm strategies, and generate specs.";
        break;
      case "/integrations":
        title = "Integrations & API Sync | BAHub";
        description = "Connect your workspace with Jira, Confluence, Slack, GitHub, and custom B2B developer APIs.";
        break;
      case "/billing":
        title = "Billing & Subscriptions | BAHub";
        description = "Manage subscription plans, workspace seat limits, payment methods, and premium Gemini AI credits.";
        break;
      case "/audit":
        title = "Audit Logs & Traceability | BAHub";
        description = "Inspect immutable history logs of user actions, updates, and configuration revisions for SOC 2 compliance.";
        break;
      case "/traceability":
        title = "Traceability Matrix | BAHub";
        description = "Trace requirements backwards to stakeholders and meetings, and forwards to diagrams, stories, and UAT cases.";
        break;
      case "/uat":
        title = "User Acceptance Testing (UAT) | BAHub";
        description = "Manage validation criteria, execute test scenarios, track test results, and collect business sign-offs.";
        break;
      default:
        break;
    }

    document.title = title;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", description);
    }
  }, [location]);

  return null;
};

function App() {
  return (
    <BrowserRouter>
      <SEOMetadataHandler />
      <AuthProvider>
        <ProjectProvider>
          <MainAppContent />
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
