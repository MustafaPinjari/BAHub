import React, { useState } from "react";
import { AuthProvider, useAuth } from "./features/auth/AuthContext";
import { LoginForm } from "./features/auth/components/LoginForm";
import { RegisterForm } from "./features/auth/components/RegisterForm";
import { DashboardShell } from "./components/layout/DashboardShell";
import { DashboardOverview } from "./features/dashboard/DashboardOverview";
import { ProfilePage } from "./features/auth/ProfilePage";
import { Card } from "./components/common/UIComponents";
import { ShieldAlert, Bot } from "lucide-react";

const MainAppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Show a premium loading screen while restoring token sessions
  if (loading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#0a0f1e] text-white">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
        </div>
        <p className="mt-4 text-sm font-semibold text-indigo-200 tracking-widest uppercase animate-pulse">
          Hydrating BAHub Workspace...
        </p>
      </div>
    );
  }

  // Auth pages logic
  if (!isAuthenticated) {
    return (
      <div className="w-screen min-h-screen flex items-center justify-center p-4 bg-[#0a0f1e] overflow-y-auto">
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
    );
  }

  // Authenticated Dashboard Tab Router
  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardOverview />;
      case "profile":
        return <ProfilePage />;
      default:
        // Elegant placeholder for subsequent sequential modules
        return (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <Card className="max-w-md text-center flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                {activeTab === "ai" ? <Bot className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
              </div>
              <h2 className="text-xl font-bold text-foreground">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module
              </h2>
              <p className="text-sm text-muted-foreground">
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
