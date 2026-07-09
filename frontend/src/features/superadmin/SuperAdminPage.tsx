import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Card, Button, Input } from "../../components/common/UIComponents";
import { 
  Building, 
  Users, 
  ShieldCheck, 
  Trash2, 
  Loader2, 
  Search, 
  Activity,
  CreditCard,
  History,
  ToggleLeft,
  ToggleRight,
  Server,
  Database,
  Cpu,
  Settings,
  AlertTriangle,
  RefreshCw,
  Mail,
} from "lucide-react";

interface OrganizationInfo {
  id: string;
  name: string;
  description: string;
  plan_tier: "FREE" | "PRO" | "ENTERPRISE";
  plan_verified: boolean;
  is_active: boolean;
  member_count: number;
  ai_credits_used: number;
  ai_credits_limit: number;
  projects_count: number;
  requirements_count: number;
  stories_count: number;
  documents_count: number;
  created_at: string;
}

interface UserInfo {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  organization_name: string;
  organization_id: string | null;
  created_at: string;
}

interface AuditLogInfo {
  id: string;
  user_username: string;
  action: string;
  resource_type: string;
  resource_name: string;
  ip_address: string;
  created_at: string;
}

interface PaymentInfo {
  id: string;
  receipt_number: string;
  organization_name: string;
  plan: string;
  amount: number;
  payment_status: string;
  billing_cycle: string;
  created_at: string;
}

interface WebhookInfo {
  id: string;
  stripe_event_id: string;
  processed_at: string;
}

interface SystemHealth {
  database_status: string;
  database_latency_ms: number;
  stripe_api_configured: boolean;
  jira_api_configured: boolean;
  timestamp: string;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  BUSINESS_ANALYST: "Business Analyst",
  PRODUCT_OWNER: "Product Owner",
  DEVELOPER: "Developer",
  QA_TESTER: "QA Tester",
  STAKEHOLDER: "Stakeholder",
};

export const SuperAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "organizations" | "users" | "audit" | "payments" | "settings">("overview");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [orgs, setOrgs] = useState<OrganizationInfo[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogInfo[]>([]);
  const [payments, setPayments] = useState<PaymentInfo[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookInfo[]>([]);
  const [systemSettings, setSystemSettings] = useState<Record<string, string>>({});
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [waitlistCount, setWaitlistCount] = useState<number>(0);
  const [waitlistSubscribers, setWaitlistSubscribers] = useState<any[]>([]);

  // Multi-select lists
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // AI override states
  const [aiLimitOverrides, setAiLimitOverrides] = useState<Record<string, number>>({});
  const [aiUsedOverrides, setAiUsedOverrides] = useState<Record<string, number>>({});

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlanFilter, setSelectedPlanFilter] = useState("ALL");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<any, any>("/auth/superadmin/dashboard/");
      
      setOrgs(res.data.organizations || []);
      setUsers(res.data.users || []);
      setAuditLogs(res.data.audit_logs || []);
      setPayments(res.data.payments || []);
      setWebhooks(res.data.webhook_events || []);
      setSystemSettings(res.data.system_settings || {});
      setHealth(res.data.system_health || null);
      setWaitlistCount(res.data.waitlist_count || 0);
      setWaitlistSubscribers(res.data.waitlist_subscribers || []);

      // Pre-populate AI overrides
      const limits: Record<string, number> = {};
      const used: Record<string, number> = {};
      (res.data.organizations || []).forEach((o: OrganizationInfo) => {
        limits[o.id] = o.ai_credits_limit;
        used[o.id] = o.ai_credits_used;
      });
      setAiLimitOverrides(limits);
      setAiUsedOverrides(used);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load platform superadmin dashboard configuration payload.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateOrganization = async (
    orgId: string, 
    planTier: string, 
    planVerified: boolean, 
    isActive: boolean,
    aiUsed?: number,
    aiLimit?: number
  ) => {
    try {
      setActionLoading(`org-${orgId}`);
      setError(null);
      setSuccess(null);
      const res = await api.post<any, any>("/auth/superadmin/dashboard/", {
        action: "update_organization",
        organization_id: orgId,
        plan_tier: planTier,
        plan_verified: planVerified,
        is_active: isActive,
        ai_credits_used: aiUsed,
        ai_credits_limit: aiLimit
      });
      setSuccess(res.message || "Organization updated successfully.");
      await fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update organization.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkUpdateOrgs = async (payload: { plan_tier?: string; plan_verified?: boolean; is_active?: boolean; delete?: boolean }) => {
    try {
      setActionLoading("bulk-org");
      setError(null);
      setSuccess(null);
      const res = await api.post<any, any>("/auth/superadmin/dashboard/", {
        action: "bulk_update_organizations",
        organization_ids: selectedOrgIds,
        ...payload
      });
      setSuccess(res.message || "Bulk workspaces updated successfully.");
      setSelectedOrgIds([]);
      await fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to perform bulk workspace update.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateUser = async (userId: string, role: string, isActive: boolean, isStaff: boolean) => {
    try {
      setActionLoading(`user-${userId}`);
      setError(null);
      setSuccess(null);
      const res = await api.post<any, any>("/auth/superadmin/dashboard/", {
        action: "update_user",
        user_id: userId,
        role: role,
        is_active: isActive,
        is_staff: isStaff
      });
      setSuccess(res.message || "User updated successfully.");
      await fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update user.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkUpdateUsers = async (payload: { role?: string; is_active?: boolean; is_staff?: boolean; delete?: boolean }) => {
    try {
      setActionLoading("bulk-user");
      setError(null);
      setSuccess(null);
      const res = await api.post<any, any>("/auth/superadmin/dashboard/", {
        action: "bulk_update_users",
        user_ids: selectedUserIds,
        ...payload
      });
      setSuccess(res.message || "Bulk users updated successfully.");
      setSelectedUserIds([]);
      await fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to perform bulk user update.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveSettings = async (updatedSettings: Record<string, string>) => {
    try {
      setActionLoading("settings-save");
      setError(null);
      setSuccess(null);
      const res = await api.post<any, any>("/auth/superadmin/dashboard/", {
        action: "update_settings",
        settings: updatedSettings
      });
      setSuccess(res.message || "Global settings updated successfully.");
      await fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update global settings.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteOrganization = async (orgId: string, orgName: string) => {
    if (!window.confirm(`⚠️ CRITICAL WARNING!\n\nAre you sure you want to delete organization "${orgName}"?\n\nThis will trigger database cascade deletions and permanently purge all associated projects, requirements, user stories, risks, and documents.`)) {
      return;
    }
    try {
      setActionLoading(`delete-org-${orgId}`);
      setError(null);
      setSuccess(null);
      const res = await api.post<any, any>("/auth/superadmin/dashboard/", {
        action: "delete_organization",
        organization_id: orgId
      });
      setSuccess(res.message || "Organization deleted successfully.");
      await fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete organization.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to delete user account "${username}"?`)) {
      return;
    }
    try {
      setActionLoading(`delete-user-${userId}`);
      setError(null);
      setSuccess(null);
      const res = await api.post<any, any>("/auth/superadmin/dashboard/", {
        action: "delete_user",
        user_id: userId
      });
      setSuccess(res.message || "User deleted successfully.");
      await fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete user.");
    } finally {
      setActionLoading(null);
    }
  };

  // Filters calculation
  const totalOrgs = orgs.length;
  const totalUsers = users.length;
  const activeUsersCount = users.filter(u => u.is_active).length;
  
  const planCounts = orgs.reduce((acc, current) => {
    acc[current.plan_tier] = (acc[current.plan_tier] || 0) + 1;
    return acc;
  }, { FREE: 0, PRO: 0, ENTERPRISE: 0 } as Record<string, number>);

  const filteredOrgs = orgs.filter(o => {
    const matchesSearch = o.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (o.description && o.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPlan = selectedPlanFilter === "ALL" || o.plan_tier === selectedPlanFilter;
    return matchesSearch && matchesPlan;
  });

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.last_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRoleFilter === "ALL" || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const handleSelectOrgToggle = (orgId: string) => {
    setSelectedOrgIds(prev => 
      prev.includes(orgId) ? prev.filter(id => id !== orgId) : [...prev, orgId]
    );
  };

  const handleSelectAllOrgsToggle = (checked: boolean) => {
    setSelectedOrgIds(checked ? filteredOrgs.map(o => o.id) : []);
  };

  const handleSelectUserToggle = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllUsersToggle = (checked: boolean) => {
    // Exclude superusers from bulk actions to avoid lockouts
    const targets = filteredUsers.filter(u => !u.is_superuser).map(u => u.id);
    setSelectedUserIds(checked ? targets : []);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-black text-white p-8 relative min-h-screen pb-24">
      {/* Background glow effects */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-purple-600/5 blur-[120px] top-0 right-0 pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-600/5 blur-[120px] bottom-0 left-0 pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col gap-8 relative z-10">
        
        {/* Header title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-white/[0.08] pb-6 gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-purple-400 tracking-[0.2em] uppercase">BAHub Platform Control</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Superadmin Control Panel</h1>
            <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
              Manage multi-tenant organizations, override subscription plan tiers, configure user roles, monitor webhook streams, and control global system settings.
            </p>
          </div>

          <Button
            onClick={fetchData}
            variant="outline"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border-white/[0.08] hover:bg-white/5 px-3 py-1.5 h-auto shrink-0"
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Platform
          </Button>
        </div>

        {/* Global alerts */}
        {error && (
          <div className="text-xs font-bold text-red-400 bg-red-950/20 border border-red-500/10 rounded-lg p-4">
            {error}
          </div>
        )}
        {success && (
          <div className="text-xs font-bold text-green-400 bg-green-950/20 border border-green-500/10 rounded-lg p-4">
            {success}
          </div>
        )}

        {/* Main tabs bar */}
        <div className="flex gap-6 border-b border-white/[0.08]">
          {(["overview", "organizations", "users", "audit", "payments", "settings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { 
                setActiveTab(tab); 
                setSearchQuery(""); 
                setSelectedOrgIds([]); 
                setSelectedUserIds([]); 
              }}
              className={`pb-4 text-xs font-bold tracking-wider uppercase cursor-pointer transition-all duration-150 relative ${
                activeTab === tab ? "text-purple-400" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab === "overview" && "Overview & Health"}
              {tab === "organizations" && "Workspaces"}
              {tab === "users" && "Users & Roles"}
              {tab === "audit" && "Security Logs"}
              {tab === "payments" && "Payments"}
              {tab === "settings" && "Platform Configuration"}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin animate-pulse" />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <Card className="bg-white/[0.01] border-white/[0.06] p-5 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total Workspaces</span>
                      <Building className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-2xl font-bold">{totalOrgs}</span>
                  </Card>

                  <Card className="bg-white/[0.01] border-white/[0.06] p-5 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Active Users</span>
                      <Users className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-2xl font-bold">{activeUsersCount} <span className="text-xs text-gray-600 font-normal">/ {totalUsers} total</span></span>
                  </Card>

                  <Card className="bg-white/[0.01] border-white/[0.06] p-5 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Waitlist Signups</span>
                      <Mail className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-2xl font-bold">{waitlistCount}</span>
                  </Card>

                  <Card className="bg-white/[0.01] border-white/[0.06] p-5 flex flex-col gap-2 md:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Subscription Tiers Breakdown</span>
                      <Activity className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="flex items-center gap-6 mt-1.5">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400">Enterprise</span>
                        <span className="text-lg font-bold text-green-400">{planCounts.ENTERPRISE}</span>
                      </div>
                      <div className="h-8 w-px bg-white/[0.06]" />
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400">Pro Tier</span>
                        <span className="text-lg font-bold text-purple-400">{planCounts.PRO}</span>
                      </div>
                      <div className="h-8 w-px bg-white/[0.06]" />
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400">Free Tier</span>
                        <span className="text-lg font-bold text-gray-500">{planCounts.FREE}</span>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* System Health Panel */}
                {health && (
                  <Card className="bg-black border-white/[0.08] p-6 flex flex-col gap-5">
                    <div className="border-b border-white/[0.06] pb-3 flex items-center gap-2">
                      <Server className="w-4 h-4 text-purple-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">System Diagnostics & Integration Check</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="flex items-center gap-4 bg-white/[0.01] border border-white/[0.04] p-4 rounded-xl">
                        <Database className="w-8 h-8 text-blue-400/80" />
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Database Status</span>
                          <span className="text-xs font-bold text-green-400 flex items-center gap-1.5 mt-0.5">
                            {health.database_status} 
                            <span className="text-[10px] text-gray-500 font-mono font-normal">({health.database_latency_ms}ms latency)</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 bg-white/[0.01] border border-white/[0.04] p-4 rounded-xl">
                        <CreditCard className="w-8 h-8 text-purple-400/80" />
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Stripe Gateway</span>
                          <span className={`text-xs font-bold mt-0.5 ${health.stripe_api_configured ? "text-green-400" : "text-amber-400"}`}>
                            {health.stripe_api_configured ? "ACTIVE / CONFIGURED" : "DEVELOPER MOCK MODE"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 bg-white/[0.01] border border-white/[0.04] p-4 rounded-xl">
                        <Cpu className="w-8 h-8 text-green-400/80" />
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Jira Sync Broker</span>
                          <span className={`text-xs font-bold mt-0.5 ${health.jira_api_configured ? "text-green-400" : "text-gray-500"}`}>
                            {health.jira_api_configured ? "CONNECTED" : "UNCONFIGURED"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Waitlist Signups List */}
                {waitlistSubscribers.length > 0 && (
                  <Card className="bg-black border-white/[0.08] p-6 flex flex-col gap-4">
                    <div className="border-b border-white/[0.06] pb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-400" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">Waitlist Signups ({waitlistCount})</h3>
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto border border-white/[0.06] rounded-xl bg-white/[0.01]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/[0.06] text-gray-500 uppercase tracking-wider text-[9px] font-bold bg-white/[0.02]">
                            <th className="py-2.5 px-4">Email Address</th>
                            <th className="py-2.5 px-4 text-right">Signed Up At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {waitlistSubscribers.map((sub, i) => (
                            <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02] last:border-none">
                              <td className="py-2.5 px-4 font-medium text-white">{sub.email}</td>
                              <td className="py-2.5 px-4 text-right text-gray-500">
                                {new Date(sub.created_at).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* WORKSPACES TAB */}
            {activeTab === "organizations" && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                <div className="flex justify-between items-center bg-white/[0.01] border border-white/[0.06] p-4 rounded-xl">
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-600" />
                    <Input
                      placeholder="Search workspaces by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 bg-white/[0.01] border-white/[0.06] text-xs h-9 w-full rounded-md"
                    />
                  </div>
                  <select
                    value={selectedPlanFilter}
                    onChange={(e) => setSelectedPlanFilter(e.target.value)}
                    className="bg-black border border-white/[0.08] text-white text-xs h-9 px-3 rounded-md outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="ALL">All Plans</option>
                    <option value="FREE">FREE</option>
                    <option value="PRO">PRO</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                  </select>
                </div>

                <Card className="bg-black border-white/[0.08] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.08] text-[9px] uppercase font-bold tracking-wider text-gray-500">
                          <th className="py-4 px-6 w-12 text-center">
                            <input
                              type="checkbox"
                              checked={filteredOrgs.length > 0 && selectedOrgIds.length === filteredOrgs.length}
                              onChange={(e) => handleSelectAllOrgsToggle(e.target.checked)}
                              className="rounded border-white/[0.08] bg-black text-purple-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                            />
                          </th>
                          <th className="py-4 px-4">Workspace</th>
                          <th className="py-4 px-4">Plan & Verification</th>
                          <th className="py-4 px-4">Resources utilization</th>
                          <th className="py-4 px-4">AI credits Quota</th>
                          <th className="py-4 px-4 text-center">Members</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrgs.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-10 text-center text-xs text-gray-600">
                              No organizations registered.
                            </td>
                          </tr>
                        ) : (
                          filteredOrgs.map((org) => {
                            const isPending = `org-${org.id}` === actionLoading;
                            const isSelected = selectedOrgIds.includes(org.id);
                            return (
                              <tr key={org.id} className={`border-b border-white/[0.04] text-xs hover:bg-white/[0.01] transition-colors ${isSelected ? "bg-purple-950/5" : ""}`}>
                                <td className="py-4 px-6 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleSelectOrgToggle(org.id)}
                                    className="rounded border-white/[0.08] bg-black text-purple-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                  />
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex flex-col text-left">
                                    <span className="font-semibold text-white">{org.name}</span>
                                    <span className="text-[10px] text-gray-500 mt-0.5 max-w-[200px] truncate">{org.description || "No description set."}</span>
                                    <span className="text-[9px] text-gray-600 font-mono mt-1">ID: {org.id}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex flex-col gap-2">
                                    <select
                                      value={org.plan_tier}
                                      onChange={(e) => handleUpdateOrganization(org.id, e.target.value, org.plan_verified, org.is_active)}
                                      className="bg-black text-xs border border-white/[0.08] rounded px-2 py-1 font-medium focus:outline-none focus:border-purple-500"
                                      disabled={isPending}
                                    >
                                      <option value="FREE">FREE</option>
                                      <option value="PRO">PRO</option>
                                      <option value="ENTERPRISE">ENTERPRISE</option>
                                    </select>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleUpdateOrganization(org.id, org.plan_tier, !org.plan_verified, org.is_active)}
                                        className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border cursor-pointer transition-colors ${
                                          org.plan_verified
                                            ? "bg-green-500/10 border-green-500/20 text-green-400"
                                            : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                        }`}
                                        disabled={isPending}
                                      >
                                        {org.plan_verified ? "Verified" : "Pending"}
                                      </button>
                                      <button
                                        onClick={() => handleUpdateOrganization(org.id, org.plan_tier, org.plan_verified, !org.is_active)}
                                        className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border cursor-pointer transition-colors ${
                                          org.is_active
                                            ? "bg-green-500/10 border-green-500/20 text-green-400"
                                            : "bg-red-500/10 border-red-500/20 text-red-400"
                                        }`}
                                        disabled={isPending}
                                      >
                                        {org.is_active ? "Active" : "Locked"}
                                      </button>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-4 font-mono text-[10px] text-gray-300">
                                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                    <span>Projects: <strong className="text-white">{org.projects_count}</strong></span>
                                    <span>Requirements: <strong className="text-white">{org.requirements_count}</strong></span>
                                    <span>User Stories: <strong className="text-white">{org.stories_count}</strong></span>
                                    <span>Documents: <strong className="text-white">{org.documents_count}</strong></span>
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex flex-col gap-1.5 max-w-[140px]">
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-gray-500 font-mono">Used:</span>
                                      <input
                                        type="number"
                                        value={aiUsedOverrides[org.id] ?? org.ai_credits_used}
                                        onChange={(e) => setAiUsedOverrides({ ...aiUsedOverrides, [org.id]: parseInt(e.target.value) || 0 })}
                                        className="w-12 bg-black border border-white/[0.08] text-white text-[10px] px-1 py-0.5 rounded focus:outline-none"
                                      />
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-gray-500 font-mono">Limit:</span>
                                      <input
                                        type="number"
                                        value={aiLimitOverrides[org.id] ?? org.ai_credits_limit}
                                        onChange={(e) => setAiLimitOverrides({ ...aiLimitOverrides, [org.id]: parseInt(e.target.value) || 0 })}
                                        className="w-12 bg-black border border-white/[0.08] text-white text-[10px] px-1 py-0.5 rounded focus:outline-none"
                                      />
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="primary"
                                      onClick={() => handleUpdateOrganization(
                                        org.id, 
                                        org.plan_tier, 
                                        org.plan_verified, 
                                        org.is_active,
                                        aiUsedOverrides[org.id],
                                        aiLimitOverrides[org.id]
                                      )}
                                      className="text-[9px] font-extrabold h-6 py-0 uppercase mt-0.5"
                                      disabled={isPending}
                                    >
                                      Save Override
                                    </Button>
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-center font-semibold text-gray-300">
                                  {org.member_count}
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteOrganization(org.id, org.name)}
                                    className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-white p-2 min-h-0 h-8 rounded-md"
                                    disabled={isPending}
                                  >
                                    {isPending ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === "users" && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                <div className="flex justify-between items-center bg-white/[0.01] border border-white/[0.06] p-4 rounded-xl">
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-600" />
                    <Input
                      placeholder="Search users by name/email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 bg-white/[0.01] border-white/[0.06] text-xs h-9 w-full rounded-md"
                    />
                  </div>
                  <select
                    value={selectedRoleFilter}
                    onChange={(e) => setSelectedRoleFilter(e.target.value)}
                    className="bg-black border border-white/[0.08] text-white text-xs h-9 px-3 rounded-md outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="ALL">All Roles</option>
                    {Object.entries(ROLE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                <Card className="bg-black border-white/[0.08] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.08] text-[9px] uppercase font-bold tracking-wider text-gray-500">
                          <th className="py-4 px-6 w-12 text-center">
                            <input
                              type="checkbox"
                              checked={filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.filter(u => !u.is_superuser).length}
                              onChange={(e) => handleSelectAllUsersToggle(e.target.checked)}
                              className="rounded border-white/[0.08] bg-black text-purple-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                            />
                          </th>
                          <th className="py-4 px-4">User details</th>
                          <th className="py-4 px-4">Workspace</th>
                          <th className="py-4 px-4">Role</th>
                          <th className="py-4 px-4">Active</th>
                          <th className="py-4 px-4">Staff Flag</th>
                          <th className="py-4 px-4">Created Date</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-10 text-center text-xs text-gray-600">
                              No users match current filters.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((user) => {
                            const isPending = `user-${user.id}` === actionLoading;
                            const isSelected = selectedUserIds.includes(user.id);
                            return (
                              <tr key={user.id} className={`border-b border-white/[0.04] text-xs hover:bg-white/[0.01] transition-colors ${isSelected ? "bg-purple-950/5" : ""}`}>
                                <td className="py-4 px-6 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleSelectUserToggle(user.id)}
                                    className="rounded border-white/[0.08] bg-black text-purple-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                    disabled={user.is_superuser}
                                  />
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex flex-col text-left">
                                    <span className="font-semibold text-white flex items-center gap-1.5">
                                      {user.username}
                                      {user.is_superuser && (
                                        <span className="bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[8px] uppercase tracking-wider font-extrabold px-1 rounded">
                                          Superuser
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-[10px] text-gray-500 mt-0.5">{user.first_name || ""} {user.last_name || ""} • {user.email}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-4 font-medium text-gray-300">
                                  {user.organization_name}
                                </td>
                                <td className="py-4 px-4">
                                  <select
                                    value={user.role}
                                    onChange={(e) => handleUpdateUser(user.id, e.target.value, user.is_active, user.is_staff)}
                                    className="bg-black text-xs border border-white/[0.08] rounded px-2 py-1 font-medium focus:outline-none focus:border-purple-500"
                                    disabled={isPending || user.is_superuser}
                                  >
                                    {Object.entries(ROLE_LABELS).map(([val, label]) => (
                                      <option key={val} value={val}>{label}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-4 px-4">
                                  <button
                                    onClick={() => handleUpdateUser(user.id, user.role, !user.is_active, user.is_staff)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border cursor-pointer transition-colors ${
                                      user.is_active
                                        ? "bg-green-500/10 border-green-500/20 text-green-400"
                                        : "bg-red-500/10 border-red-500/20 text-red-400"
                                    }`}
                                    disabled={isPending || user.is_superuser}
                                  >
                                    {user.is_active ? "Active" : "Inactive"}
                                  </button>
                                </td>
                                <td className="py-4 px-4">
                                  <button
                                    onClick={() => handleUpdateUser(user.id, user.role, user.is_active, !user.is_staff)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border cursor-pointer transition-colors ${
                                      user.is_staff
                                        ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                                        : "bg-gray-800 border-white/5 text-gray-500"
                                    }`}
                                    disabled={isPending || user.is_superuser}
                                  >
                                    {user.is_staff ? "Yes" : "No"}
                                  </button>
                                </td>
                                <td className="py-4 px-4 text-gray-500 font-mono text-[10px]">
                                  {user.created_at || "N/A"}
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteUser(user.id, user.username)}
                                    className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-white p-2 min-h-0 h-8 rounded-md"
                                    disabled={isPending || user.is_superuser}
                                  >
                                    {isPending ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* AUDIT LOGS TAB */}
            {activeTab === "audit" && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                <div className="border-b border-white/[0.08] pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                    <History className="w-4 h-4 text-purple-400" />
                    Security & Mutation Audit Logs
                  </h3>
                </div>

                <Card className="bg-black border-white/[0.08] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.08] text-[9px] uppercase font-bold tracking-wider text-gray-500">
                          <th className="py-4 px-6">Timestamp</th>
                          <th className="py-4 px-4">User</th>
                          <th className="py-4 px-4">Action</th>
                          <th className="py-4 px-4">Resource</th>
                          <th className="py-4 px-6">IP Address</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-10 text-center text-xs text-gray-600">
                              No security audit logs recorded.
                            </td>
                          </tr>
                        ) : (
                          auditLogs.map((log) => (
                            <tr key={log.id} className="border-b border-white/[0.04] text-[11px] hover:bg-white/[0.01] transition-colors">
                              <td className="py-4 px-6 text-gray-400 font-mono text-[10px]">
                                {log.created_at}
                              </td>
                              <td className="py-4 px-4 font-semibold text-white">
                                {log.user_username}
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                                  log.action === "DELETE"
                                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                    : log.action === "CREATE"
                                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                }`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="py-4 px-4 font-medium text-gray-300">
                                {log.resource_type} • <span className="text-[10px] text-gray-500 font-normal">{log.resource_name}</span>
                              </td>
                              <td className="py-4 px-6 text-gray-500 font-mono text-[10px]">
                                {log.ip_address}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* PAYMENTS TAB */}
            {activeTab === "payments" && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                <div className="border-b border-white/[0.08] pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-green-400" />
                    Stripe Payments & Checkout History
                  </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Payments list */}
                  <Card className="bg-black border-white/[0.08] overflow-hidden lg:col-span-2">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/[0.08] text-[9px] uppercase font-bold tracking-wider text-gray-500">
                            <th className="py-4 px-6">Receipt #</th>
                            <th className="py-4 px-4">Organization</th>
                            <th className="py-4 px-4">Plan</th>
                            <th className="py-4 px-4">Amount</th>
                            <th className="py-4 px-4">Status</th>
                            <th className="py-4 px-6">Paid At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-10 text-center text-xs text-gray-600">
                                No payment receipts processed.
                              </td>
                            </tr>
                          ) : (
                            payments.map((p) => (
                              <tr key={p.id} className="border-b border-white/[0.04] text-xs hover:bg-white/[0.01] transition-colors">
                                <td className="py-4 px-6 font-mono text-purple-400 text-[10px]">
                                  {p.receipt_number}
                                </td>
                                <td className="py-4 px-4 font-semibold text-white">
                                  {p.organization_name}
                                </td>
                                <td className="py-4 px-4 uppercase text-[10px] text-gray-400">
                                  {p.plan} ({p.billing_cycle})
                                </td>
                                <td className="py-4 px-4 font-bold text-white">
                                  ${p.amount.toFixed(2)}
                                </td>
                                <td className="py-4 px-4">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                                    p.payment_status === "SUCCESS"
                                      ? "bg-green-500/10 text-green-400"
                                      : "bg-amber-500/10 text-amber-400"
                                  }`}>
                                    {p.payment_status}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-gray-500 font-mono text-[10px]">
                                  {p.created_at}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  {/* Webhook logs */}
                  <Card className="bg-black border-white/[0.08] p-5 flex flex-col gap-4">
                    <div className="border-b border-white/[0.06] pb-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Processed Webhook Events</h4>
                    </div>
                    <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
                      {webhooks.length === 0 ? (
                        <span className="text-xs text-gray-600 text-center py-4">No webhook events received.</span>
                      ) : (
                        webhooks.map((ev) => (
                          <div key={ev.id} className="p-2.5 rounded-lg bg-white/[0.01] border border-white/[0.04] flex flex-col gap-1 text-left">
                            <span className="text-[9px] font-mono text-purple-400 truncate">{ev.stripe_event_id}</span>
                            <span className="text-[8px] text-gray-600 font-mono">{ev.processed_at}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === "settings" && (
              <div className="flex flex-col gap-6 max-w-2xl animate-fadeIn">
                <div className="border-b border-white/[0.08] pb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">Global Platform Overrides</h3>
                </div>

                <Card className="bg-black border-white/[0.08] p-6 flex flex-col gap-6">
                  
                  {/* Maintenance Mode */}
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-5">
                    <div className="flex flex-col gap-1 text-left max-w-md">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        Maintenance Mode Lockout
                        {systemSettings.maintenance_mode === "true" && (
                          <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] uppercase tracking-wider font-extrabold px-1.5 rounded flex items-center gap-0.5 animate-pulse">
                            <AlertTriangle className="w-2.5 h-2.5" /> Maintenance Active
                          </span>
                        )}
                      </span>
                      <p className="text-[10px] text-gray-500 leading-relaxed">
                        Toggling this will immediately lock all non-administrative users out of workspace dashboards, returning an HTTP 503 maintenance response panel.
                      </p>
                    </div>
                    <button
                      onClick={() => handleSaveSettings({
                        ...systemSettings,
                        maintenance_mode: systemSettings.maintenance_mode === "true" ? "false" : "true"
                      })}
                      className="text-gray-500 hover:text-white cursor-pointer transition-colors bg-transparent border-none outline-none"
                      disabled={actionLoading === "settings-save"}
                    >
                      {systemSettings.maintenance_mode === "true" ? (
                        <ToggleRight className="w-10 h-10 text-purple-500" />
                      ) : (
                        <ToggleLeft className="w-10 h-10 text-gray-700" />
                      )}
                    </button>
                  </div>

                  {/* Disable AI features */}
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-5">
                    <div className="flex flex-col gap-1 text-left max-w-md">
                      <span className="text-xs font-bold text-white">Disable AI Services Globally</span>
                      <p className="text-[10px] text-gray-500 leading-relaxed">
                        If OpenAI or Anthropic endpoints experience latency issues or downtime, toggle this flag to immediately turn off BRD/FRD compilers and chatbot actions.
                      </p>
                    </div>
                    <button
                      onClick={() => handleSaveSettings({
                        ...systemSettings,
                        global_ai_disabled: systemSettings.global_ai_disabled === "true" ? "false" : "true"
                      })}
                      className="text-gray-500 hover:text-white cursor-pointer transition-colors bg-transparent border-none outline-none"
                      disabled={actionLoading === "settings-save"}
                    >
                      {systemSettings.global_ai_disabled === "true" ? (
                        <ToggleRight className="w-10 h-10 text-purple-500" />
                      ) : (
                        <ToggleLeft className="w-10 h-10 text-gray-700" />
                      )}
                    </button>
                  </div>

                  {/* Waitlist Countdown Timer */}
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-5">
                    <div className="flex flex-col gap-1 text-left max-w-md">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        Launch Countdown Timer
                        {systemSettings.waitlist_countdown_enabled === "true" && (
                          <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] uppercase tracking-wider font-extrabold px-1.5 rounded flex items-center gap-0.5">
                            Active
                          </span>
                        )}
                      </span>
                      <p className="text-[10px] text-gray-500 leading-relaxed">
                        Display a countdown timer on the landing page until July 18, 2026 12:00 AM UTC. When enabled, visitors can join the waitlist and receive email notifications when the platform launches.
                      </p>
                    </div>
                    <button
                      onClick={() => handleSaveSettings({
                        ...systemSettings,
                        waitlist_countdown_enabled: systemSettings.waitlist_countdown_enabled === "true" ? "false" : "true"
                      })}
                      className="text-gray-500 hover:text-white cursor-pointer transition-colors bg-transparent border-none outline-none"
                      disabled={actionLoading === "settings-save"}
                    >
                      {systemSettings.waitlist_countdown_enabled === "true" ? (
                        <ToggleRight className="w-10 h-10 text-blue-500" />
                      ) : (
                        <ToggleLeft className="w-10 h-10 text-gray-700" />
                      )}
                    </button>
                  </div>

                  {/* Default Limits configuration */}
                  <div className="flex flex-col gap-4 pt-1">
                    <h4 className="text-[10px] uppercase font-bold tracking-wider text-gray-500 text-left">Default Free Plan Quota Limits</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1 text-left">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Max Member Seats</label>
                        <input
                          type="number"
                          value={systemSettings.free_tier_seats || ""}
                          onChange={(e) => setSystemSettings({ ...systemSettings, free_tier_seats: e.target.value })}
                          className="bg-gray-900 border border-white/[0.08] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500 w-full"
                        />
                      </div>

                      <div className="flex flex-col gap-1 text-left">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600">AI Credits Limit</label>
                        <input
                          type="number"
                          value={systemSettings.free_tier_credits || ""}
                          onChange={(e) => setSystemSettings({ ...systemSettings, free_tier_credits: e.target.value })}
                          className="bg-gray-900 border border-white/[0.08] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500 w-full"
                        />
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      onClick={() => handleSaveSettings(systemSettings)}
                      className="w-full text-xs font-bold py-2 mt-2"
                      disabled={actionLoading === "settings-save"}
                    >
                      {actionLoading === "settings-save" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "Save Quota Configurations"
                      )}
                    </Button>
                  </div>

                </Card>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Floating Bulk Action Bar for Workspaces */}
      {activeTab === "organizations" && selectedOrgIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-950 border border-purple-500/30 px-6 py-3.5 rounded-full shadow-[0_0_50px_-12px_rgba(168,85,247,0.4)] flex items-center gap-4 z-50 animate-bounceOnce">
          <span className="text-xs font-bold text-white pr-2 border-r border-white/10 shrink-0">
            {selectedOrgIds.length} Selected
          </span>
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkUpdateOrgs({ plan_tier: e.target.value });
                  e.target.value = "";
                }
              }}
              className="bg-black border border-white/[0.08] text-white text-[10px] h-8 px-2 rounded-md outline-none cursor-pointer"
            >
              <option value="">Bulk Set Plan</option>
              <option value="FREE">FREE</option>
              <option value="PRO">PRO</option>
              <option value="ENTERPRISE">ENTERPRISE</option>
            </select>

            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkUpdateOrgs({ 
                    plan_verified: e.target.value === "verify_true" ? true : e.target.value === "verify_false" ? false : undefined,
                    is_active: e.target.value === "active_true" ? true : e.target.value === "active_false" ? false : undefined
                  });
                  e.target.value = "";
                }
              }}
              className="bg-black border border-white/[0.08] text-white text-[10px] h-8 px-2 rounded-md outline-none cursor-pointer"
            >
              <option value="">Bulk Status</option>
              <option value="verify_true">Verify Accounts</option>
              <option value="verify_false">Mark Pending</option>
              <option value="active_true">Activate Accounts</option>
              <option value="active_false">Lock Accounts</option>
            </select>

            <Button
              onClick={() => {
                if (window.confirm(`⚠️ Bulk delete ${selectedOrgIds.length} workspaces? This action is permanent and cascades database-wide.`)) {
                  handleBulkUpdateOrgs({ delete: true });
                }
              }}
              className="bg-red-500/10 border border-red-500/20 hover:bg-red-600 hover:text-white text-red-400 text-[10px] font-extrabold h-8 rounded-md px-3 py-0 min-h-0 flex items-center justify-center cursor-pointer transition-colors"
              disabled={actionLoading === "bulk-org"}
            >
              Bulk Delete
            </Button>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar for Users */}
      {activeTab === "users" && selectedUserIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-950 border border-purple-500/30 px-6 py-3.5 rounded-full shadow-[0_0_50px_-12px_rgba(168,85,247,0.4)] flex items-center gap-4 z-50 animate-bounceOnce">
          <span className="text-xs font-bold text-white pr-2 border-r border-white/10 shrink-0">
            {selectedUserIds.length} Selected
          </span>
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkUpdateUsers({ role: e.target.value });
                  e.target.value = "";
                }
              }}
              className="bg-black border border-white/[0.08] text-white text-[10px] h-8 px-2 rounded-md outline-none cursor-pointer"
            >
              <option value="">Bulk Set Role</option>
              {Object.entries(ROLE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>

            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkUpdateUsers({ 
                    is_active: e.target.value === "active_true" ? true : e.target.value === "active_false" ? false : undefined,
                    is_staff: e.target.value === "staff_true" ? true : e.target.value === "staff_false" ? false : undefined
                  });
                  e.target.value = "";
                }
              }}
              className="bg-black border border-white/[0.08] text-white text-[10px] h-8 px-2 rounded-md outline-none cursor-pointer"
            >
              <option value="">Bulk Status</option>
              <option value="active_true">Activate Accounts</option>
              <option value="active_false">Deactivate Accounts</option>
              <option value="staff_true">Grant Staff Status</option>
              <option value="staff_false">Revoke Staff Status</option>
            </select>

            <Button
              onClick={() => {
                if (window.confirm(`⚠️ Bulk delete ${selectedUserIds.length} user accounts?`)) {
                  handleBulkUpdateUsers({ delete: true });
                }
              }}
              className="bg-red-500/10 border border-red-500/20 hover:bg-red-600 hover:text-white text-red-400 text-[10px] font-extrabold h-8 rounded-md px-3 py-0 min-h-0 flex items-center justify-center cursor-pointer transition-colors"
              disabled={actionLoading === "bulk-user"}
            >
              Bulk Delete
            </Button>
          </div>
        </div>
      )}

    </div>
  );
};
