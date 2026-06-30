import React, { useState, useEffect } from "react";
import { useAuth } from "../../features/auth/AuthContext";
import { Button, Badge } from "../common/UIComponents";
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
  LogOut,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Bell,
  ChevronsUpDown,
  Search
} from "lucide-react";

interface SidebarItem {
  name: string;
  icon: React.ComponentType<any>;
  path: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { name: "Dashboard", icon: LayoutDashboard, path: "dashboard" },
  { name: "Projects", icon: FolderGit, path: "projects" },
  { name: "Teams", icon: Users, path: "teams" },
  { name: "Stakeholders", icon: UserIcon, path: "stakeholders" },
  { name: "Requirements", icon: FileSpreadsheet, path: "requirements" },
  { name: "User Stories", icon: ClipboardList, path: "stories" },
  { name: "BRD Generator", icon: FileText, path: "brd" },
  { name: "FRD Generator", icon: FileCheck, path: "frd" },
  { name: "Meetings", icon: Calendar, path: "meetings" },
  { name: "Risks", icon: ShieldAlert, path: "risks" },
  { name: "Change Requests", icon: RefreshCw, path: "changes" },
  { name: "Gap Analysis", icon: GitCompare, path: "gap" },
  { name: "SWOT Analysis", icon: Grid, path: "swot" },
  { name: "Reports", icon: BarChart2, path: "reports" },
  { name: "AI Assistant", icon: Bot, path: "ai" },
];

interface DashboardShellProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  currentTab,
  onTabChange,
  children,
}) => {
  const { user, logout, updateProfile } = useAuth();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    if (user?.preferences?.sidebar_state) {
      setSidebarExpanded(user.preferences.sidebar_state === "expanded");
    }
  }, [user?.preferences?.sidebar_state]);

  const toggleSidebar = async () => {
    const nextState = !sidebarExpanded;
    setSidebarExpanded(nextState);
    if (user) {
      try {
        await updateProfile({
          preferences: {
            ...user.preferences,
            sidebar_state: nextState ? "expanded" : "collapsed",
          },
        });
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const handleThemeToggle = async () => {
    if (!user) return;
    const currentTheme = user.preferences.theme;
    const themes: Array<"dark" | "light" | "system"> = ["light", "dark", "system"];
    const nextThemeIdx = (themes.indexOf(currentTheme) + 1) % themes.length;
    const nextTheme = themes[nextThemeIdx];

    try {
      await updateProfile({
        preferences: {
          ...user.preferences,
          theme: nextTheme,
        },
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const getThemeIcon = () => {
    if (!user) return <Sun className="w-4 h-4" />;
    const theme = user.preferences.theme;
    if (theme === "dark") return <Moon className="w-4 h-4" />;
    if (theme === "light") return <Sun className="w-4 h-4" />;
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />;
  };

  const breadcrumbs = [
    { label: "Workspace", path: "" },
    { label: user?.organization_name || "Organization", path: "" },
    {
      label: currentTab.charAt(0).toUpperCase() + currentTab.slice(1),
      path: currentTab,
    },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* ==========================================
          SIDEBAR
          ========================================== */}
      <aside
        className={`flex flex-col h-full border-r border-border bg-card transition-all duration-150 z-30 select-none ${
          sidebarExpanded ? "w-60" : "w-16"
        }`}
      >
        {/* Workspace Switcher */}
        <div className="flex items-center justify-between p-3 border-b border-border min-h-[57px]">
          <div className="flex items-center gap-2 overflow-hidden w-full">
            <div className="w-7 h-7 flex items-center justify-center shrink-0">
              <img src={logo} alt="BAHub" className="w-5.5 h-5.5 object-contain" />
            </div>
            {sidebarExpanded && (
              <div className="flex items-center justify-between w-full overflow-hidden">
                <div className="flex flex-col text-left overflow-hidden">
                  <span className="font-semibold text-xs text-foreground truncate w-32 leading-tight">
                    {user?.organization_name || "BAHub"}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider leading-none mt-0.5">
                    Free Plan
                  </span>
                </div>
                <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0 ml-1" />
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
                onClick={() => onTabChange(item.path)}
                className={`flex items-center gap-2.5 p-2 rounded-md text-xs font-semibold tracking-tight transition-all text-left cursor-pointer ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
                title={!sidebarExpanded ? item.name : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {sidebarExpanded && <span className="truncate">{item.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border flex flex-col gap-2 bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                <UserIcon className="w-4 h-4" />
              </div>
              {sidebarExpanded && (
                <div className="flex flex-col text-left overflow-hidden">
                  <span className="font-semibold text-xs text-foreground truncate w-32 leading-tight">
                    {user?.first_name} {user?.last_name}
                  </span>
                  <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider leading-none mt-0.5">
                    {user?.role.replace("_", " ")}
                  </span>
                </div>
              )}
            </div>
            {sidebarExpanded && (
              <button
                onClick={toggleSidebar}
                className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {!sidebarExpanded && (
            <button
              onClick={toggleSidebar}
              className="p-1 mx-auto rounded hover:bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer"
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
        {/* Top Navbar */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-5 shrink-0 z-20">
          {/* Left: Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold select-none">
            {breadcrumbs.map((bc, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-muted-foreground/30 font-normal">/</span>}
                <span
                  className={
                    idx === breadcrumbs.length - 1
                      ? "text-foreground font-bold"
                      : "hover:text-foreground transition-colors cursor-pointer"
                  }
                  onClick={() => bc.path && onTabChange(bc.path)}
                >
                  {bc.label}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 relative">
            {/* Quick Search */}
            <div className="relative hidden sm:block">
              <Search className="w-3.5 h-3.5 text-muted-foreground/60 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                disabled
                className="pl-8 pr-2.5 py-1 text-xs rounded-md bg-secondary border border-border outline-none w-40 placeholder:text-muted-foreground/60 select-none cursor-not-allowed"
              />
            </div>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleThemeToggle}
              title="Toggle Theme"
              className="text-muted-foreground hover:text-foreground w-8 h-8 rounded-md"
            >
              {getThemeIcon()}
            </Button>

            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="text-muted-foreground hover:text-foreground w-8 h-8 rounded-md relative"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-destructive rounded-full border border-card"></span>
              </Button>
              {notificationsOpen && (
                <div className="absolute right-0 mt-1.5 w-72 bg-card shadow-lg border border-border rounded-xl p-3 z-30 flex flex-col gap-2 select-none">
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <span className="font-bold text-xs text-foreground">Notifications</span>
                    <Badge variant="default">1 New</Badge>
                  </div>
                  <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
                    <div className="p-2 rounded-md hover:bg-secondary/60 cursor-pointer flex flex-col gap-0.5">
                      <span className="font-bold text-xs text-foreground">Workspace active</span>
                      <span className="text-[11px] text-muted-foreground">Your BAHub team portal has been successfully provisioned.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <Button
                variant="ghost"
                className="flex items-center gap-1.5 p-1 px-2 border rounded-md border-border hover:bg-secondary/60 w-8 h-8 md:w-auto md:h-auto select-none"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              >
                <span className="text-xs font-bold text-foreground hidden md:inline">
                  {user?.username}
                </span>
                <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
              </Button>
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-card shadow-lg border border-border rounded-xl p-1.5 z-30 flex flex-col gap-0.5 select-none">
                  <div className="px-2.5 py-1.5 border-b border-border mb-1">
                    <p className="font-bold text-xs text-foreground truncate">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onTabChange("profile");
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary rounded-lg flex items-center gap-2 cursor-pointer font-semibold"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-muted-foreground/60" />
                    My Profile
                  </button>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onTabChange("settings");
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary rounded-lg flex items-center gap-2 cursor-pointer font-semibold"
                  >
                    <Settings className="w-3.5 h-3.5 text-muted-foreground/60" />
                    Workspace Settings
                  </button>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-destructive hover:bg-red-500/10 rounded-lg flex items-center gap-2 cursor-pointer font-bold border-t border-border mt-1 pt-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-background/50">
          {children}
        </main>
      </div>
    </div>
  );
};
