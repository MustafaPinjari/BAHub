import React, { useState } from "react";
import { AuthProvider, useAuth } from "./features/auth/AuthContext";
import { LoginForm } from "./features/auth/components/LoginForm";
import { RegisterForm } from "./features/auth/components/RegisterForm";
import { DashboardShell } from "./components/layout/DashboardShell";
import { DashboardOverview } from "./features/dashboard/DashboardOverview";
import { ProfilePage } from "./features/auth/ProfilePage";
import { Card } from "./components/common/UIComponents";
import { ShieldAlert } from "lucide-react";
import logo from "./assets/logo.png";
import banner from "./assets/banner.png";
import { TeamsPage } from "./features/teams/TeamsPage";
import { WorkspaceSettingsPage } from "./features/auth/WorkspaceSettingsPage";
import { ProjectsPage } from "./features/projects/ProjectsPage";
import { StakeholdersPage } from "./features/stakeholders/StakeholdersPage";
import { RequirementsPage } from "./features/requirements/RequirementsPage";
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

const MainAppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Show a premium loading screen while restoring token sessions
  if (loading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#F8FAFC] text-[#0F172A]">
        <div className="relative w-12 h-12 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200 border-t-[#2563EB] animate-spin"></div>
        </div>
        <p className="text-xs font-bold text-slate-500 tracking-widest uppercase animate-pulse">
          Hydrating BAHub Workspace...
        </p>
      </div>
    );
  }

  // Auth pages in Split-Screen layout (Form Left, Banner Showcase Right)
  if (!isAuthenticated) {
    return (
      <div className="w-screen h-screen flex bg-background text-foreground overflow-hidden">
        {/* Left Side: Form Container */}
        <div className="w-full md:w-[50%] h-full flex items-center justify-center p-8 overflow-y-auto bg-background">
          {authView === "login" ? (
            <LoginForm
              onSuccess={() => setActiveTab("dashboard")}
              onNavigateToRegister={() => setAuthView("register")}
            />
          ) : (
            <RegisterForm
              onSuccess={() => setAuthView("login")}
              onNavigateToLogin={() => setAuthView("login")}
            />
          )}
        </div>
        
        {/* Right Side: Showcase Panel (Hidden on mobile devices) */}
        <div className="hidden md:flex md:w-[50%] h-full flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 p-12 text-white relative overflow-hidden select-none">
          {/* Decorative subtle background glows */}
          <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-primary/10 blur-[80px] pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />

          {/* Top: Branding logo */}
          <div className="flex items-center gap-2 z-10">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/15 backdrop-blur-sm shadow-inner">
              <img src={logo} alt="BAHub Logo" className="w-4 h-4 object-contain" />
            </div>
            <span className="font-bold text-[10px] tracking-widest uppercase text-white/70">
              BAHub Enterprise
            </span>
          </div>

          {/* Middle: Premium Browser mock-up containing the entire banner */}
          <div className="flex-1 flex items-center justify-center my-6 z-10">
            <div className="w-full max-w-[480px] rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-md shadow-2xl shadow-slate-950/80 overflow-hidden flex flex-col transition-all duration-300 hover:border-white/15 hover:shadow-indigo-500/5">
              {/* Window Title Bar */}
              <div className="h-8 border-b border-white/5 bg-slate-950/40 px-4 flex items-center gap-1.5 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                <span className="text-[10px] text-white/30 font-semibold tracking-wider ml-2 select-none">
                  bahub_workspace.app
                </span>
              </div>
              {/* Image Frame */}
              <div className="p-3 bg-slate-950/10 flex items-center justify-center overflow-hidden">
                <img
                  src={banner}
                  alt="BAHub Workspace Banner"
                  className="w-full h-auto max-h-[35vh] object-contain rounded-md shadow-inner transition-transform duration-500 hover:scale-[1.01]"
                />
              </div>
            </div>
          </div>

          {/* Bottom: Text Showcase */}
          <div className="flex flex-col gap-3 max-w-md text-left z-10">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
              The AI-Powered Business Analyst Workspace
            </h2>
            <p className="text-xs text-white/70 leading-relaxed font-medium">
              A comprehensive system designed to gather requirements, generate functional specification documents, manage stakeholders, register risks, and run AI-assisted analyses.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Dashboard Tab Router
  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardOverview />;
      case "profile":
        return <ProfilePage />;
      case "teams":
        return <TeamsPage />;
      case "projects":
        return <ProjectsPage />;
      case "stakeholders":
        return <StakeholdersPage />;
      case "settings":
        return <WorkspaceSettingsPage />;
      case "requirements":
        return <RequirementsPage />;
      case "stories":
        return <UserStoriesPage />;
      case "brd":
        return <DocumentGeneratorPage docType="BRD" />;
      case "frd":
        return <DocumentGeneratorPage docType="FRD" />;
      case "meetings":
        return <MeetingsPage />;
      case "risks":
        return <RisksPage />;
      case "changes":
        return <ChangeRequestsPage />;
      case "swot":
        return <SwotAnalysisPage />;
      case "gap":
        return <GapAnalysisPage />;
      case "reports":
        return <ReportsPage />;
      case "ai":
        return <AiAssistantPage />;
      case "integrations":
        return <IntegrationsPage />;
      default:
        // Elegant placeholder for subsequent sequential modules
        return (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <Card className="max-w-md text-center flex flex-col items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary border border-primary/20 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-foreground uppercase tracking-wider">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This feature is part of the next sequential roadmap phase. All core databases, API versioning paths, and UI shells are already configured to support this module.
              </p>
            </Card>
          </div>
        );
    }
  };

  return (
    <DashboardShell currentTab={activeTab} onTabChange={setActiveTab}>
      {renderTabContent()}
    </DashboardShell>
  );
};

function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

export default App;
