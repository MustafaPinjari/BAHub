import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Card, Button, Input, Badge } from "../../components/common/UIComponents";
import { 
  Building, 
  Users, 
  ShieldCheck, 
  Trash2, 
  Loader2, 
  Search, 
  Activity
} from "lucide-react";

interface OrganizationInfo {
  id: string;
  name: string;
  description: string;
  plan_tier: "FREE" | "PRO" | "ENTERPRISE";
  plan_verified: boolean;
  is_active: boolean;
  member_count: number;
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

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  BUSINESS_ANALYST: "Business Analyst",
  PRODUCT_OWNER: "Product Owner",
  DEVELOPER: "Developer",
  QA_TESTER: "QA Tester",
  STAKEHOLDER: "Stakeholder",
};

export const SuperAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"organizations" | "users">("organizations");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [orgs, setOrgs] = useState<OrganizationInfo[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  
  // Filters and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlanFilter, setSelectedPlanFilter] = useState("ALL");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<any, { data: { organizations: OrganizationInfo[]; users: UserInfo[] } }>(
        "/auth/superadmin/dashboard/"
      );
      setOrgs(res.data.organizations || []);
      setUsers(res.data.users || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load platform superadmin statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateOrganization = async (orgId: string, planTier: string, planVerified: boolean, isActive: boolean) => {
    try {
      setActionLoading(`org-${orgId}`);
      setError(null);
      setSuccess(null);
      const res = await api.post<any, any>("/auth/superadmin/dashboard/", {
        action: "update_organization",
        organization_id: orgId,
        plan_tier: planTier,
        plan_verified: planVerified,
        is_active: isActive
      });
      setSuccess(res.message || "Organization updated successfully.");
      await fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update organization.");
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

  // Compute metrics summary
  const totalOrgs = orgs.length;
  const totalUsers = users.length;
  const activeUsersCount = users.filter(u => u.is_active).length;
  const planCounts = orgs.reduce((acc, current) => {
    acc[current.plan_tier] = (acc[current.plan_tier] || 0) + 1;
    return acc;
  }, { FREE: 0, PRO: 0, ENTERPRISE: 0 } as Record<string, number>);

  // Filter lists
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

  return (
    <div className="flex-1 overflow-y-auto bg-black text-white p-8">
      {/* Background glow effects */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-purple-600/5 blur-[120px] top-0 right-0 pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-600/5 blur-[120px] bottom-0 left-0 pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col gap-8 relative z-10">
        
        {/* Hero title */}
        <div className="flex flex-col gap-2 border-b border-white/[0.08] pb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-purple-400 tracking-[0.2em] uppercase">BAHub Platform Control</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Superadmin Control Panel</h1>
          <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
            Manage multi-tenant organizations, override subscription plan tiers, configure user roles, and monitor account operations across the entire BAHub application state.
          </p>
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

        {/* Platform metrics summary panel */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin animate-pulse" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            {/* Content Tabs & Search layout */}
            <div className="flex flex-col gap-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/[0.08] gap-4">
                
                {/* Tabs switcher */}
                <div className="flex gap-6">
                  <button
                    onClick={() => { setActiveTab("organizations"); setSearchQuery(""); }}
                    className={`pb-4 text-xs font-bold tracking-wider uppercase cursor-pointer transition-all duration-150 relative ${
                      activeTab === "organizations" ? "text-purple-400" : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    Organizations
                    {activeTab === "organizations" && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
                    )}
                  </button>
                  <button
                    onClick={() => { setActiveTab("users"); setSearchQuery(""); }}
                    className={`pb-4 text-xs font-bold tracking-wider uppercase cursor-pointer transition-all duration-150 relative ${
                      activeTab === "users" ? "text-purple-400" : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    Users & Roles
                    {activeTab === "users" && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
                    )}
                  </button>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-wrap items-center gap-3 pb-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-600" />
                    <Input
                      placeholder={activeTab === "organizations" ? "Search workspace name..." : "Search user details..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 bg-white/[0.01] border-white/[0.06] text-xs h-9 w-full rounded-md"
                    />
                  </div>

                  {activeTab === "organizations" ? (
                    <select
                      value={selectedPlanFilter}
                      onChange={(e) => setSelectedPlanFilter(e.target.value)}
                      className="bg-black border border-white/[0.08] text-white text-xs h-9 px-3 rounded-md outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value="ALL">All Plans</option>
                      <option value="FREE">Free Plan</option>
                      <option value="PRO">Pro Plan</option>
                      <option value="ENTERPRISE">Enterprise Plan</option>
                    </select>
                  ) : (
                    <select
                      value={selectedRoleFilter}
                      onChange={(e) => setSelectedRoleFilter(e.target.value)}
                      className="bg-black border border-white/[0.08] text-white text-xs h-9 px-3 rounded-md outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value="ALL">All Roles</option>
                      <option value="ADMIN">Admins</option>
                      <option value="BUSINESS_ANALYST">Business Analysts</option>
                      <option value="PRODUCT_OWNER">Product Owners</option>
                      <option value="DEVELOPER">Developers</option>
                      <option value="QA_TESTER">QA Testers</option>
                      <option value="STAKEHOLDER">Stakeholders</option>
                    </select>
                  )}
                </div>
              </div>

              {/* TAB CONTENT: Organizations */}
              {activeTab === "organizations" && (
                <Card className="bg-black border-white/[0.08] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.08] text-[9px] uppercase font-bold tracking-wider text-gray-500">
                          <th className="py-4 px-6">Workspace Name</th>
                          <th className="py-4 px-4">Plan Tier</th>
                          <th className="py-4 px-4">Verification</th>
                          <th className="py-4 px-4">Status</th>
                          <th className="py-4 px-4 text-center">Members</th>
                          <th className="py-4 px-4">Created Date</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrgs.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-10 text-center text-xs text-gray-600">
                              No organizations match current query filters.
                            </td>
                          </tr>
                        ) : (
                          filteredOrgs.map((org) => {
                            const isPending = `org-${org.id}` === actionLoading;
                            return (
                              <tr key={org.id} className="border-b border-white/[0.04] text-xs hover:bg-white/[0.01] transition-colors">
                                <td className="py-4 px-6 font-semibold text-white">
                                  <div className="flex flex-col">
                                    <span>{org.name}</span>
                                    <span className="text-[10px] text-gray-500 font-normal mt-0.5">{org.description || "No description set."}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-4">
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
                                </td>
                                <td className="py-4 px-4">
                                  <button
                                    onClick={() => handleUpdateOrganization(org.id, org.plan_tier, !org.plan_verified, org.is_active)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border cursor-pointer transition-colors ${
                                      org.plan_verified
                                        ? "bg-green-500/10 border-green-500/20 text-green-400"
                                        : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                    }`}
                                    disabled={isPending}
                                  >
                                    {org.plan_verified ? "Verified" : "Pending"}
                                  </button>
                                </td>
                                <td className="py-4 px-4">
                                  <button
                                    onClick={() => handleUpdateOrganization(org.id, org.plan_tier, org.plan_verified, !org.is_active)}
                                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border cursor-pointer transition-colors ${
                                      org.is_active
                                        ? "bg-green-500/10 border-green-500/20 text-green-400"
                                        : "bg-red-500/10 border-red-500/20 text-red-400"
                                    }`}
                                    disabled={isPending}
                                  >
                                    {org.is_active ? "Active" : "Inactive"}
                                  </button>
                                </td>
                                <td className="py-4 px-4 text-center font-semibold text-gray-300">
                                  {org.member_count}
                                </td>
                                <td className="py-4 px-4 text-gray-500 font-mono text-[10px]">
                                  {org.created_at || "N/A"}
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <div className="flex justify-end gap-2">
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
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {activeTab === "users" && (
                <Card className="bg-black border-white/[0.08] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.08] text-[9px] uppercase font-bold tracking-wider text-gray-500">
                          <th className="py-4 px-6">User details</th>
                          <th className="py-4 px-4">Workspace</th>
                          <th className="py-4 px-4">Platform Role</th>
                          <th className="py-4 px-4">Status</th>
                          <th className="py-4 px-4">Staff Flag</th>
                          <th className="py-4 px-4">Created Date</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-10 text-center text-xs text-gray-600">
                              No users match current query filters.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((user) => {
                            const isPending = `user-${user.id}` === actionLoading;
                            return (
                              <tr key={user.id} className="border-b border-white/[0.04] text-xs hover:bg-white/[0.01] transition-colors">
                                <td className="py-4 px-6">
                                  <div className="flex flex-col text-left">
                                    <span className="font-semibold text-white flex items-center gap-1.5">
                                      {user.username}
                                      {user.is_superuser && (
                                        <Badge className="bg-purple-500/10 border-purple-500/20 text-purple-400 text-[8px] uppercase tracking-wider font-extrabold px-1 py-0 rounded">
                                          Superuser
                                        </Badge>
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
                                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border cursor-pointer transition-colors ${
                                      user.is_staff
                                        ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                                        : "bg-gray-800 border-white/5 text-gray-500"
                                    }`}
                                    disabled={isPending || user.is_superuser}
                                  >
                                    {user.is_staff ? "Yes (Staff)" : "No"}
                                  </button>
                                </td>
                                <td className="py-4 px-4 text-gray-500 font-mono text-[10px]">
                                  {user.created_at || "N/A"}
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <div className="flex justify-end gap-2">
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
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

            </div>
          </>
        )}

      </div>
    </div>
  );
};
