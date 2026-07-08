import React, { useState, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./features/auth/AuthContext";
import { ProjectProvider } from "./features/projects/ProjectContext";
import { LoginForm } from "./features/auth/components/LoginForm";
import { RegisterForm } from "./features/auth/components/RegisterForm";
import { DashboardShell } from "./components/layout/DashboardShell";
import logo from "./assets/logo.png";
import banner from "./assets/banner.png";
import { LandingPage } from "./features/landing/LandingPage.tsx";

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
  return (
    <DashboardShell>
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
          <Route path="/brd" element={<DocumentGeneratorPage docType="BRD" />} />
          <Route path="/frd" element={<DocumentGeneratorPage docType="FRD" />} />
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
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </DashboardShell>
  );
};

const MainAppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState<"landing" | "login" | "register">("landing");

  // Allow explicit preview of landing page via /landing or /welcome route regardless of auth state
  const path = window.location.pathname.toLowerCase();
  const isExplicitLanding = path === "/landing" || path === "/welcome";

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

  if (isExplicitLanding || !isAuthenticated) {
    if (authView === "landing" || isExplicitLanding) {
      return (
        <LandingPage 
          onNavigateToLogin={() => setAuthView("login")} 
          onNavigateToRegister={() => setAuthView("register")} 
        />
      );
    }

    return (
      <div className="w-screen h-screen flex bg-black text-white overflow-hidden">
        {/* Left Side: Form Container */}
        <div className="w-full md:w-[40%] h-full flex items-center justify-center p-8 overflow-y-auto bg-black relative">
          {/* Subtle glow orb */}
          <div className="absolute top-0 left-0 w-80 h-80 rounded-full bg-purple-600/5 blur-3xl pointer-events-none" />
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={() => setAuthView("landing")}
              className="text-[10px] font-bold text-gray-600 hover:text-gray-300 cursor-pointer flex items-center gap-1.5 bg-transparent border-none outline-none transition-colors duration-150"
            >
              <span>←</span> Back to Home
            </button>
          </div>
          {authView === "login" ? (
            <LoginForm
              onSuccess={() => {}}
              onNavigateToRegister={() => setAuthView("register")}
            />
          ) : (
            <RegisterForm
              onSuccess={() => setAuthView("login")}
              onNavigateToLogin={() => setAuthView("login")}
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

  return <AuthenticatedApp />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <MainAppContent />
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
