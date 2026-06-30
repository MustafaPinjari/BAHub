import React, { useState, useEffect } from "react";
import { useAuth } from "../../features/auth/AuthContext";
import { Button, Badge } from "../common/UIComponents";
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
  Building
} from "lucide-react";

interface SidebarItem {
  name: string;
  icon: React.ComponentType<any>;
  path: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { name: "Dashboard", icon: LayoutDashboard, path: "dashboard" },
  { name: "Projects", icon: FolderGit, path: "projects" },
  { name: "Stakeholders", icon: Users, path: "stakeholders" },
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

  // Sync sidebar state from user preference
  useEffect(() => {
    if (user?.preferences?.sidebar_state) {
      setSidebarExpanded(user.preferences.sidebar_state === "expanded");
    }
  }, [user?.preferences?.sidebar_state]);

  const toggleSidebar = async () => {
    const nextState = !sidebarExpanded;
    setSidebarExpanded(nextState);
    
    // Save to server if user exists
    if (user) {
      try {
        await updateProfile({
          preferences: {
            ...user.preferences,
            sidebar_state: nextState ? "expanded" : "collapsed",
          },
        });
      } catch (e) {
        console.warn("Failed to sync sidebar state preference:", e);
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
      console.warn("Failed to sync theme preference:", e);
    }
  };

  const getThemeIcon = () => {
    if (!user) return <Sun className="w-5 h-5" />;
    const theme = user.preferences.theme;
    if (theme === "dark") return <Moon className="w-5 h-5" />;
    if (theme === "light") return <Sun className="w-5 h-5" />;
    // system theme icon checks current browser environment
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return isDark ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />;
  };

  // Simple Breadcrumbs calculation
  const breadcrumbs = [
    { label: "Workspace", path: "" },
    { label: user?.organization_name || "Organization", path: "" },
    {
      label: currentTab.charAt(0).toUpperCase() + currentTab.slice(1),
      path: currentTab,
    },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* ==========================================
          SIDEBAR
          ========================================== */}
      <aside
        className={`flex flex-col h-full border-r border-border glass transition-all duration-300 z-30 ${
          sidebarExpanded ? "w-64" : "w-20"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
              <Building className="w-5 h-5" />
            </div>
            {sidebarExpanded && (
              <div className="flex flex-col">
                <span className="font-bold text-foreground text-sm tracking-tight truncate w-36">
                  {user?.organization_name || "BAHub"}
                </span>
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                  SaaS Enterprise
                </span>
              </div>
            )}
          </div>
          {sidebarExpanded && (
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto flex flex-col gap-1 select-none">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.path;
            return (
              <button
                key={item.name}
                onClick={() => onTabChange(item.path)}
                className={`flex items-center gap-3 p-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                title={!sidebarExpanded ? item.name : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {sidebarExpanded && <span>{item.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border flex flex-col gap-2">
          {!sidebarExpanded && (
            <button
              onClick={toggleSidebar}
              className="p-2.5 mx-auto rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3 overflow-hidden">
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt="Profile"
                className="w-10 h-10 rounded-full border border-border object-cover shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                <UserIcon className="w-5 h-5" />
              </div>
            )}
            {sidebarExpanded && (
              <div className="flex flex-col overflow-hidden">
                <span className="font-semibold text-foreground text-sm truncate">
                  {user?.first_name} {user?.last_name}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  {user?.role.replace("_", " ")}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ==========================================
          MAIN CONTENT AREA
          ========================================== */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-border glass flex items-center justify-between px-6 z-20">
          {/* Left: Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium select-none">
            {breadcrumbs.map((bc, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-muted-foreground/40 font-normal">/</span>}
                <span
                  className={
                    idx === breadcrumbs.length - 1
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  }
                  onClick={() => bc.path && onTabChange(bc.path)}
                >
                  {bc.label}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 relative">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleThemeToggle}
              title="Toggle Theme"
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {getThemeIcon()}
            </Button>

            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="text-muted-foreground hover:text-foreground relative cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-destructive rounded-full border border-card"></span>
              </Button>
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 glass shadow-xl border rounded-xl p-3 z-30 flex flex-col gap-2">
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <span className="font-bold text-foreground">Notifications</span>
                    <Badge variant="default">1 New</Badge>
                  </div>
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                    <div className="p-2 rounded hover:bg-muted/50 cursor-pointer flex flex-col gap-1">
                      <span className="font-semibold text-xs text-foreground">Workspace ready</span>
                      <span className="text-xs text-muted-foreground">Welcome to your BAHub workspace dashboard!</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <Button
                variant="ghost"
                className="flex items-center gap-2 p-1 pl-2 pr-2 border rounded-full border-border hover:bg-muted/50 cursor-pointer"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              >
                <span className="text-xs font-semibold text-foreground hidden md:inline">
                  {user?.username}
                </span>
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt="User"
                    className="w-7 h-7 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </Button>
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 glass shadow-xl border rounded-xl p-2 z-30 flex flex-col gap-1 select-none">
                  <div className="px-3 py-2 border-b border-border mb-1">
                    <p className="font-bold text-sm text-foreground">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onTabChange("profile");
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted/50 rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-muted-foreground" />
                    My Profile
                  </button>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onTabChange("settings");
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted/50 rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    Workspace Settings
                  </button>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-red-500/10 rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
};
