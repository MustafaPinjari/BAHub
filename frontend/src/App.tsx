import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./features/auth/AuthContext";
import { ProjectProvider } from "./features/projects/ProjectContext";
import { LoginForm } from "./features/auth/components/LoginForm";
import { RegisterForm } from "./features/auth/components/RegisterForm";
import { DashboardShell } from "./components/layout/DashboardShell";
import { DashboardOverview } from "./features/dashboard/DashboardOverview";
import { ProfilePage } from "./features/auth/ProfilePage";
import logo from "./assets/logo.png";
import banner from "./assets/banner.png";
import { TeamsPage } from "./features/teams/TeamsPage";
import { WorkspaceSettingsPage } from "./features/auth/WorkspaceSettingsPage";
import { ProjectsPage } from "./features/projects/ProjectsPage";
import { StakeholdersPage } from "./features/stakeholders/StakeholdersPage";
import { RequirementsPage } from "./features/requirements/RequirementsPage";
import { DiagramsPage } from "./features/diagrams/DiagramsPage";
import { UserStoriesPage } from "./features/stories/UserStoriesPage";
import { DocumentGeneratorPage } from "./features/documents/DocumentGeneratorPage";
import { MeetingsPage } from "./features/meetings/MeetingsPage";
import { RisksPage } from "./features/risks/RisksPage";
import { ChangeRequestsPage } from "./features/changes/ChangeRequestsPage";
import { SwotAnalysisPage } from "./features/strategic/SwotAnalysisPage";
import { GapAnalysisPage } from "./features/strategic/GapAnalysisPage";
import { ReportsPage } from "./features/reports/ReportsPage";
import { AiAssistantPage } from "./features/ai/AiAssistantPage";
import { IntegrationsPage } from "./features/integrations/IntegrationsPage";
import { BillingPage } from "./features/auth/BillingPage";
import { AuditLogPage } from "./features/audit/AuditLogPage";
import { LandingPage } from "./features/landing/LandingPage.tsx";
import { TraceabilityPage } from "./features/traceability/TraceabilityPage";

const AuthenticatedApp: React.FC = () => {
  return (
    <DashboardShell>
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
        <Route path="/ai" element={<AiAssistantPage />} />
        <Route path="/integrations" element={<IntegrationsPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/audit" element={<AuditLogPage />} />
        <Route path="/traceability" element={<TraceabilityPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
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
        <div className="w-full md:w-[50%] h-full flex items-center justify-center p-8 overflow-y-auto bg-black relative">
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

        {/* Right Side: Dracula Showcase Panel */}
        <div className="hidden md:flex md:w-[50%] h-full flex-col justify-between bg-black border-l border-white/[0.06] p-12 text-white relative overflow-hidden select-none">
          {/* Glow orbs */}
          <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full bg-purple-600/10 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[-80px] left-[-80px] w-72 h-72 rounded-full bg-blue-600/8 blur-[120px] pointer-events-none" />
          <div className="absolute top-[40%] right-[10%] w-40 h-40 rounded-full bg-violet-500/5 blur-[60px] pointer-events-none" />

          {/* Logo */}
          <div className="flex items-center gap-2.5 z-10">
            <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
              <img src={logo} alt="BAHub Logo" className="w-4 h-4 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[11px] tracking-widest uppercase text-white/80">BAHub</span>
              <span className="text-[8px] font-semibold text-purple-400 uppercase tracking-widest leading-none">Workspace Platform</span>
            </div>
          </div>

          {/* Dracula Terminal Preview */}
          <div className="flex-1 flex items-center justify-center my-6 z-10">
            <div className="w-full max-w-[480px] rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#282a36', border: '1px solid #44475a' }}>
              {/* macOS dots */}
              <div className="h-9 px-4 flex items-center gap-2 border-b" style={{ borderColor: '#44475a', background: 'rgba(40,42,54,0.8)' }}>
                <span className="w-3 h-3 rounded-full" style={{ background: '#ff5555' }} />
                <span className="w-3 h-3 rounded-full" style={{ background: '#f1fa8c' }} />
                <span className="w-3 h-3 rounded-full" style={{ background: '#50fa7b' }} />
                <span className="ml-3 text-[11px] font-mono" style={{ color: '#6272a4' }}>bahub_workspace.app</span>
              </div>
              {/* Terminal content */}
              <div className="p-5 font-mono text-[11px] leading-relaxed space-y-1">
                <div>
                  <span style={{ color: '#ff79c6' }}>~/bahub</span>
                  <span style={{ color: '#6272a4' }}> on main</span>
                </div>
                <div>
                  <span style={{ color: '#8be9fd' }}>$ </span>
                  <span style={{ color: '#50fa7b' }}>bahub generate</span>
                  <span style={{ color: '#8be9fd' }}> --type brd --project checkout-v2</span>
                </div>
                <div style={{ color: '#6272a4' }}>✓ Synthesizing 42 requirements...</div>
                <div style={{ color: '#6272a4' }}>✓ Running AI compliance scan...</div>
                <div style={{ color: '#50fa7b' }}>✓ BRD-2026-92 generated (18 pages)</div>
                <div style={{ color: '#8be9fd' }}>$ </div>
              </div>
              {/* Banner image below terminal */}
              <div className="px-5 pb-5">
                <img
                  src={banner}
                  alt="BAHub Workspace Banner"
                  className="w-full h-auto max-h-[22vh] object-contain rounded-lg opacity-80"
                />
              </div>
            </div>
          </div>

          {/* Tagline */}
          <div className="flex flex-col gap-3 max-w-md text-left z-10">
            <h2 className="text-xl font-bold tracking-tight leading-tight">
              The AI-Powered{" "}
              <span className="text-gradient-blue-purple">Business Analyst</span>{" "}Workspace
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Synthesize conversations into compliant specs, manage stakeholders, register risks, and run AI-assisted analyses — all in one platform.
            </p>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[10px] text-gray-500 font-medium">Audit trail ready</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-[10px] text-gray-500 font-medium">Data controls planned</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span className="text-[10px] text-gray-500 font-medium">Status monitoring planned</span>
              </div>
            </div>
          </div>
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
