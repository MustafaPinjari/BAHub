import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { useProject } from "../../features/projects/ProjectContext";
import { Badge } from "../common/UIComponents";
import { GlobalSearchModal } from "../common/GlobalSearchModal";
import { OnboardingWizard } from "../common/OnboardingWizard";
import logo from "../../assets/logo.png";
import {
  LayoutDashboard,
  FolderGit,
  Users,
  FileSpreadsheet,
  ClipboardList,
  FileText,
  FileCheck,
  Calendar,
  ShieldAlert,
  RefreshCw,
  GitCompare,
  Grid,
  BarChart2,
  Settings,
  Bot,
  Link2,
  LogOut,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Bell,
  ChevronsUpDown,
  Search,
  CreditCard,
  History,
  Network,
  Zap,
  GitMerge,
  Lock,
  Bug,
  HelpCircle,
} from "lucide-react";

interface SidebarItem {
  name: string;
  icon: React.ComponentType<any>;
  path: string;
  category?: string;
  requiredTier?: "PRO" | "ENTERPRISE";
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { name: "Dashboard", icon: LayoutDashboard, path: "dashboard", category: "overview" },
  { name: "Projects", icon: FolderGit, path: "projects", category: "overview" },
  { name: "Teams", icon: Users, path: "teams", category: "overview" },
  { name: "Stakeholders", icon: UserIcon, path: "stakeholders", category: "workspace" },
  { name: "Requirements", icon: FileSpreadsheet, path: "requirements", category: "workspace" },
  { name: "Traceability", icon: GitMerge, path: "traceability", category: "workspace" },
  { name: "Analysis Models", icon: Network, path: "diagrams", category: "workspace" },
  { name: "User Stories", icon: ClipboardList, path: "stories", category: "workspace" },
  { name: "UAT & Testing", icon: Bug, path: "uat", category: "workspace" },
  { name: "BRD Generator", icon: FileText, path: "brd", category: "documents", requiredTier: "PRO" },
  { name: "FRD Generator", icon: FileCheck, path: "frd", category: "documents", requiredTier: "PRO" },
  { name: "Meetings", icon: Calendar, path: "meetings", category: "documents" },
  { name: "Risks", icon: ShieldAlert, path: "risks", category: "governance" },
  { name: "Change Requests", icon: RefreshCw, path: "changes", category: "governance" },
  { name: "Gap Analysis", icon: GitCompare, path: "gap", category: "governance" },
  { name: "SWOT Analysis", icon: Grid, path: "swot", category: "governance" },
  { name: "Reports", icon: BarChart2, path: "reports", category: "intelligence" },
  { name: "AI Assistant", icon: Bot, path: "ai", category: "intelligence" },
  { name: "Integrations", icon: Link2, path: "integrations", category: "settings", requiredTier: "ENTERPRISE" },
  { name: "Billing", icon: CreditCard, path: "billing", category: "settings" },
  { name: "Audit Logs", icon: History, path: "audit", category: "settings", requiredTier: "ENTERPRISE" },
];

interface DashboardShellProps {
  children: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  children,
}) => {
  const { user, logout } = useAuth();
  const { activeProject } = useProject();
  const navigate = useNavigate();
  const location = useLocation();

  const currentTab = location.pathname.substring(1) || "dashboard";

  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [activeHelpTab, setActiveHelpTab] = useState<"general" | "requirements" | "uat" | "approvals">("general");

  // Check if onboarding needs to trigger
  useEffect(() => {
    if (user?.id) {
      const showOnboarding = localStorage.getItem("show_onboarding_wizard") === "true";
      const completed = localStorage.getItem(`bahub_onboarding_completed_${user.id}`);
      if (showOnboarding && completed !== "true") {
        setIsOnboardingOpen(true);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.preferences?.sidebar_state) {
      setSidebarExpanded(user.preferences.sidebar_state === "expanded");
    }
  }, [user?.preferences?.sidebar_state]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = () => {
      setProfileDropdownOpen(false);
      setNotificationsOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // Global Ctrl+K / Cmd+K shortcut to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const toggleSidebar = () => {
    setSidebarExpanded((prev) => !prev);
  };

  const isLocked = (item: SidebarItem) => {
    if (!item.requiredTier) return false;
    const tier = user?.plan_tier || "FREE";
    if (item.requiredTier === "PRO") {
      return tier === "FREE";
    }
    if (item.requiredTier === "ENTERPRISE") {
      return tier !== "ENTERPRISE";
    }
    return false;
  };


  const breadcrumbs = [
    { label: user?.organization_name || "Workspace", path: "" },
    {
      label: currentTab.charAt(0).toUpperCase() + currentTab.slice(1),
      path: currentTab,
    },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-white">
      {/* ==========================================
          SIDEBAR — DNA pitch-black with hairline borders
          ========================================== */}
      <aside
        className={`flex flex-col h-full border-r border-white/[0.07] bg-black transition-all duration-200 z-30 select-none ${
          sidebarExpanded ? "w-[220px]" : "w-[52px]"
        }`}
      >
        {/* Workspace Switcher */}
        <div className="flex items-center justify-between px-3 py-3.5 border-b border-white/[0.07] min-h-[53px]">
          <div className="flex items-center gap-2.5 overflow-hidden w-full">
            <div className="w-6 h-6 flex items-center justify-center shrink-0 rounded-md bg-white/5 border border-white/10">
              <img src={logo} alt="BAHub" className="w-3.5 h-3.5 object-contain" />
            </div>
            {sidebarExpanded && (
              <div className="flex items-center justify-between w-full overflow-hidden">
                <div className="flex flex-col text-left overflow-hidden">
                  <span className="font-semibold text-[11px] text-white/90 truncate w-28 leading-tight">
                    {user?.organization_name || "BAHub"}
                  </span>
                  <span className={`text-[8px] uppercase font-bold tracking-wider leading-none mt-0.5 ${
                    user?.plan_tier === "ENTERPRISE"
                      ? "text-green-500"
                      : user?.plan_tier === "PRO"
                      ? "text-purple-400"
                      : "text-gray-600"
                  }`}>
                    {user?.plan_tier ? `${user.plan_tier} Plan` : "Free Plan"}
                  </span>
                </div>
                <ChevronsUpDown className="w-3 h-3 text-gray-700 shrink-0 ml-1" />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-2 overflow-y-auto flex flex-col gap-0.5">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.path;
            return (
              <button
                key={item.name}
                onClick={() => navigate(`/${item.path}`)}
                className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-[11px] font-medium tracking-tight transition-all duration-150 text-left cursor-pointer w-full ${
                  isActive
                    ? "bg-white/[0.08] text-white"
                    : "text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]"
                }`}
                title={!sidebarExpanded ? (isLocked(item) ? `${item.name} 🔒 (Locked)` : item.name) : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-white" : "text-gray-600"}`} />
                {sidebarExpanded && (
                  <span className="truncate">{item.name}</span>
                )}
                {isLocked(item) && sidebarExpanded && (
                  <Lock className="w-3 h-3 text-purple-400/80 ml-auto shrink-0" />
                )}
                {isActive && !isLocked(item) && sidebarExpanded && (
                  <span className="ml-auto w-1 h-1 rounded-full bg-purple-500 shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-2 py-3 border-t border-white/[0.07] flex flex-col gap-1.5">
          <div className="flex items-center gap-2 overflow-hidden px-1">
            <div className="w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <UserIcon className="w-3 h-3" />
            </div>
            {sidebarExpanded && (
              <div className="flex flex-col text-left overflow-hidden flex-1">
                <span className="font-semibold text-[11px] text-white/80 truncate w-28 leading-tight">
                  {user?.first_name} {user?.last_name}
                </span>
                <span className="text-[8px] text-gray-600 uppercase font-bold tracking-wider leading-none mt-0.5">
                  {user?.role?.replace("_", " ")}
                </span>
              </div>
            )}
            {sidebarExpanded && (
              <button
                onClick={toggleSidebar}
                className="p-1 rounded-md hover:bg-white/[0.05] text-gray-700 hover:text-gray-400 cursor-pointer transition-colors ml-auto"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
            )}
          </div>
          {!sidebarExpanded && (
            <button
              onClick={toggleSidebar}
              className="p-1.5 mx-auto rounded-md hover:bg-white/[0.05] text-gray-700 hover:text-gray-400 flex items-center justify-center cursor-pointer transition-colors"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* ==========================================
          MAIN CONTENT AREA
          ========================================== */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar — DNA glass blur */}
        <header className="h-12 border-b border-white/[0.07] bg-black/70 backdrop-blur-xl flex items-center justify-between px-5 shrink-0 z-20">
          {/* Left: Breadcrumbs & Project Context */}
          <div className="flex items-center gap-2 text-xs text-gray-600 font-medium select-none">
            {activeProject && (
              <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2.5 py-1 rounded-md text-[9px] uppercase font-bold tracking-wider shrink-0">
                <FolderGit className="w-2.5 h-2.5" />
                <span>{activeProject.name}</span>
              </div>
            )}
            {activeProject && <span className="text-gray-800 font-normal select-none">/</span>}

            <div className="flex items-center gap-1">
              {breadcrumbs.map((bc, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-gray-800 font-normal">/</span>}
                  <span
                    className={
                      idx === breadcrumbs.length - 1
                        ? "text-gray-300 font-semibold text-[11px]"
                        : "text-gray-700 hover:text-gray-400 transition-colors cursor-pointer text-[11px]"
                    }
                    onClick={() => bc.path && navigate(`/${bc.path}`)}
                  >
                    {bc.label}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 relative">
            {/* Quick Search — opens GlobalSearchModal */}
            <div className="relative hidden sm:flex items-center">
              <Search className="w-3 h-3 text-gray-700 absolute left-2.5" />
              <button
                id="global-search-trigger"
                onClick={() => setIsSearchOpen(true)}
                className="pl-7 pr-10 py-1 text-[11px] rounded-md bg-gray-900/60 border border-white/[0.06] text-gray-600 outline-none w-44 text-left placeholder:text-gray-700 hover:border-white/[0.16] hover:text-gray-400 font-medium transition-colors cursor-pointer"
              >
                Search…
              </button>
              <kbd className="absolute right-2 text-[9px] text-gray-700 font-mono bg-gray-900 border border-white/[0.05] rounded px-1">⌘K</kbd>
            </div>

            {/* Quick Tour Guide */}
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="w-8 h-8 rounded-md flex items-center justify-center text-gray-600 hover:text-gray-300 hover:bg-white/[0.05] transition-all relative cursor-pointer"
              title="Start workspace guide tour"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setNotificationsOpen(!notificationsOpen); setProfileDropdownOpen(false); }}
                className="w-8 h-8 rounded-md flex items-center justify-center text-gray-600 hover:text-gray-300 hover:bg-white/[0.05] transition-all relative cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-purple-500 rounded-full border border-black" />
              </button>
              {notificationsOpen && (
                <div
                  className="absolute right-0 top-10 w-72 bg-gray-950 shadow-2xl border border-white/[0.08] rounded-xl p-3 z-30 flex flex-col gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center pb-2 border-b border-white/[0.06]">
                    <span className="font-semibold text-[11px] text-white">Notifications</span>
                    <Badge variant="default">1 New</Badge>
                  </div>
                  <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto">
                    <div className="p-2 rounded-lg hover:bg-white/[0.04] cursor-pointer flex flex-col gap-0.5 transition-colors">
                      <div className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-purple-400 shrink-0" />
                        <span className="font-semibold text-[11px] text-white">Workspace active</span>
                      </div>
                      <span className="text-[10px] text-gray-600 pl-5">Your BAHub team portal has been provisioned.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Help & Guides Trigger Button */}
            <button
              onClick={() => setIsHelpOpen(!isHelpOpen)}
              className={`p-1.5 rounded-lg border border-white/[0.07] hover:bg-white/[0.04] transition-all cursor-pointer text-gray-500 hover:text-white shrink-0 ${isHelpOpen ? "bg-white/[0.08] text-white border-white/20" : ""}`}
              title="Help & Guides"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                className="flex items-center gap-1.5 py-1 px-2 border border-white/[0.07] rounded-md hover:bg-white/[0.04] hover:border-white/[0.12] transition-all cursor-pointer"
                onClick={(e) => { e.stopPropagation(); setProfileDropdownOpen(!profileDropdownOpen); setNotificationsOpen(false); }}
              >
                <div className="w-5 h-5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <UserIcon className="w-3 h-3" />
                </div>
                <span className="text-[11px] font-semibold text-gray-400 hidden md:inline">
                  {user?.username}
                </span>
              </button>
              {profileDropdownOpen && (
                <div
                  className="absolute right-0 top-10 w-48 bg-gray-950 shadow-2xl border border-white/[0.08] rounded-xl p-1.5 z-30 flex flex-col gap-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-2.5 py-2 border-b border-white/[0.06] mb-1">
                    <p className="font-bold text-[11px] text-white truncate">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-[9px] text-gray-600 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { setProfileDropdownOpen(false); navigate("/profile"); }}
                    className="w-full text-left px-2.5 py-1.5 text-[11px] text-gray-400 hover:text-white hover:bg-white/[0.05] rounded-lg flex items-center gap-2 cursor-pointer font-medium transition-colors"
                  >
                    <UserIcon className="w-3 h-3 text-gray-700" />
                    My Profile
                  </button>
                  <button
                    onClick={() => { setProfileDropdownOpen(false); navigate("/settings"); }}
                    className="w-full text-left px-2.5 py-1.5 text-[11px] text-gray-400 hover:text-white hover:bg-white/[0.05] rounded-lg flex items-center gap-2 cursor-pointer font-medium transition-colors"
                  >
                    <Settings className="w-3 h-3 text-gray-700" />
                    Workspace Settings
                  </button>
                  <button
                    onClick={() => { setProfileDropdownOpen(false); logout(); }}
                    className="w-full text-left px-2.5 py-1.5 text-[11px] text-red-500 hover:bg-red-500/10 rounded-lg flex items-center gap-2 cursor-pointer font-bold border-t border-white/[0.05] mt-0.5 pt-2 transition-colors"
                  >
                    <LogOut className="w-3 h-3" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-black">
          {children}
        </main>
      </div>

      {/* Global Search Modal — renders above everything */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Onboarding Wizard — guide overlay */}
      <OnboardingWizard 
        isOpen={isOnboardingOpen} 
        onClose={() => {
          setIsOnboardingOpen(false);
          localStorage.removeItem("show_onboarding_wizard");
        }}
      />

      {/* Contextual Help Slide-out Panel */}
      {isHelpOpen && (
        <div className="fixed inset-y-0 right-0 w-80 bg-gray-950 border-l border-white/[0.08] shadow-2xl z-40 flex flex-col select-none text-left">
          {/* Drawer Header */}
          <div className="px-4 py-3.5 border-b border-white/[0.08] flex justify-between items-center bg-white/[0.01]">
            <span className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-purple-400" /> Guidance Center
            </span>
            <button onClick={() => setIsHelpOpen(false)} className="text-gray-500 hover:text-white cursor-pointer transition-colors p-1">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Guide Tabs */}
          <div className="grid grid-cols-4 border-b border-white/[0.06] text-[9px] font-bold text-center uppercase tracking-wider text-gray-500">
            {(["general", "requirements", "uat", "approvals"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveHelpTab(tab)}
                className={`py-2 hover:text-white transition-colors cursor-pointer border-b-2 ${activeHelpTab === tab ? "border-purple-500 text-white bg-white/[0.02]" : "border-transparent"}`}
              >
                {tab === "uat" ? "UAT" : tab}
              </button>
            ))}
          </div>

          {/* Help Content */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-xs font-semibold text-gray-400 select-text leading-relaxed">
            {activeHelpTab === "general" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <h4 className="text-white text-xs font-extrabold uppercase tracking-wide">Overview Checklist</h4>
                  <p>Welcome to BAHub, your agile business analysis backlog. You can navigate the lifecycle modules via the sidebar:</p>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl flex flex-col gap-2">
                  <p className="text-[11px]"><strong className="text-white">1. Requirements Backlog:</strong> Log functional or compliance constraints.</p>
                  <p className="text-[11px]"><strong className="text-white">2. User Stories:</strong> Expand requirements into agile sprint story cards.</p>
                  <p className="text-[11px]"><strong className="text-white">3. Traceability Matrix:</strong> Audits test execution status and active defects against requirements.</p>
                </div>
              </>
            )}

            {activeHelpTab === "requirements" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <h4 className="text-white text-xs font-extrabold uppercase tracking-wide">Writing Great Specs</h4>
                  <p>Requirements cataloged in the backlog should follow the SMART goals and INVEST criteria:</p>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl flex flex-col gap-2 text-[11px]">
                  <p><strong className="text-white">I - Independent:</strong> Minimize inter-requirement dependencies.</p>
                  <p><strong className="text-white">N - Negotiable:</strong> Co-created with developers/stakeholders.</p>
                  <p><strong className="text-white">V - Valuable:</strong> Direct contribution to business outcome.</p>
                  <p><strong className="text-white">E - Estimable:</strong> Understood well enough to points estimate.</p>
                  <p><strong className="text-white">S - Small:</strong> Sized to fit comfortably in a single iteration.</p>
                  <p><strong className="text-white">T - Testable:</strong> Measurable criteria exist to verify state.</p>
                </div>
              </>
            )}

            {activeHelpTab === "uat" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <h4 className="text-white text-xs font-extrabold uppercase tracking-wide">UAT & Defects Audit</h4>
                  <p>UAT test plans verify requirement acceptance criteria. Track defect severity standards:</p>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl flex flex-col gap-2 text-[11px]">
                  <p><strong className="text-rose-500">CRITICAL:</strong> System crashes, data corruption, security breaches, zero functional workarounds.</p>
                  <p><strong className="text-orange-500">HIGH:</strong> Major feature broken with no viable workaround.</p>
                  <p><strong className="text-yellow-500">MEDIUM:</strong> Feature issues that have standard manual overrides.</p>
                  <p><strong className="text-gray-400">LOW:</strong> Cosmetic style anomalies, text typo corrections.</p>
                </div>
              </>
            )}

            {activeHelpTab === "approvals" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <h4 className="text-white text-xs font-extrabold uppercase tracking-wide">Review Workflows</h4>
                  <p>Business documents follow structured lifecycle tracks before engineering implementation begins:</p>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl flex flex-col gap-2 text-[11px]">
                  <p><strong className="text-purple-400">Draft:</strong> Document is compiled. Revisions can be saved.</p>
                  <p><strong className="text-blue-400">Under Review:</strong> Document is submitted to project managers or product owners for validation.</p>
                  <p><strong className="text-yellow-400">Revision Requested:</strong> Comment logs describe required fixes.</p>
                  <p><strong className="text-green-500">Approved & Sign-off:</strong> Compliance checkmarks passed. Content snaps are frozen.</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
