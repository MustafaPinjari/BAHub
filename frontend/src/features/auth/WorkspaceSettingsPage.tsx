import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Card, Badge, Button, Input, Alert } from "../../components/common/UIComponents";
import { useAuth } from "./AuthContext";
import { 
  Building, 
  Plus, 
  Trash2,
  Loader2,
  Lock,
  CreditCard,
  Mail,
  Copy
} from "lucide-react";

interface Organization {
  id: string;
  name: string;
  description: string;
  timezone: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string;
}

interface Permission {
  id: string;
  name: string;
  codename: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  permissions_detail: Permission[];
}

interface UserProfile {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface UserRoleMapping {
  id: string;
  user: string;
  role: string;
  role_detail: Role;
}

export const WorkspaceSettingsPage: React.FC = () => {
  const { user } = useAuth();
  
  // Tabs: "org" | "roles" | "users" | "usage"
  const [activeTab, setActiveTab] = useState<"org" | "roles" | "users" | "usage">("org");
  
  // States
  const [org, setOrg] = useState<Organization | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [mappings, setMappings] = useState<UserRoleMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Usage & Subscription states
  const [sub, setSub] = useState<any | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("BUSINESS_ANALYST");
  const [inviting, setInviting] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Custom role creation state
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [roleSaving, setRoleSaving] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  const loadOrgDetails = async () => {
    if (!user?.organization) return;
    setLoading(true);
    try {
      const res = await api.get<any, { data: Organization }>(`/organizations/${user.organization}/`);
      setOrg(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPermissionRegistry = async () => {
    try {
      const res = await api.get<any, { data: Permission[] }>("/permissions/registry/");
      setPermissions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadOrgRoles = async () => {
    try {
      const res = await api.get<any, { data: Role[] }>("/permissions/roles/");
      setRoles(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMembers = async () => {
    try {
      const res = await api.get<any, { data: UserProfile[] }>("/auth/members/");
      setMembers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadRoleMappings = async () => {
    try {
      const res = await api.get<any, { data: UserRoleMapping[] }>("/permissions/user-roles/");
      setMappings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSubscription = async () => {
    try {
      const res = await api.get<any, { data: any }>("/billing/subscription/");
      setSub(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadInvoices = async () => {
    try {
      const res = await api.get<any, { data: any[] }>("/billing/invoices/");
      setInvoices(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadInvitations = async () => {
    try {
      const res = await api.get<any, { data: any[] }>("/organizations/invitations/");
      setInvitations(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAll = async () => {
    await loadOrgDetails();
    await loadPermissionRegistry();
    await loadOrgRoles();
    await loadMembers();
    await loadRoleMappings();
    await loadSubscription();
    await loadInvoices();
    await loadInvitations();
  };

  useEffect(() => {
    loadAll();
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      setSuccessMsg("Subscription plan upgraded successfully!");
      // Clean query params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    setFormError(null);
    setSuccessMsg(null);
    try {
      await api.post("/organizations/invitations/", {
        email: inviteEmail,
        role: inviteRole,
      });
      setSuccessMsg(`Invitation sent to ${inviteEmail} successfully.`);
      setInviteEmail("");
      setInviteRole("BUSINESS_ANALYST");
      loadInvitations();
    } catch (err: any) {
      setFormError(err.message || "Failed to create invitation.");
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!window.confirm("Cancel this invitation?")) return;
    setSuccessMsg(null);
    try {
      await api.delete(`/organizations/invitations/${inviteId}/`);
      setSuccessMsg("Invitation cancelled successfully.");
      loadInvitations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpgradePlan = async (plan: "PRO" | "ENTERPRISE") => {
    setLoading(true);
    setFormError(null);
    setSuccessMsg(null);
    try {
      const res = await api.post<any, { data: { checkout_url: string } }>("/billing/checkout/", { plan });
      if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to initialize plan checkout.");
    } finally {
      setLoading(false);
    }
  };

  const handleOrgSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;
    setFormError(null);
    setSuccessMsg(null);
    try {
      await api.put(`/organizations/${org.id}/`, org);
      setSuccessMsg("Workspace settings updated successfully.");
    } catch (err: any) {
      setFormError("Failed to update workspace organization info.");
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName) return;
    setFormError(null);
    setSuccessMsg(null);
    setRoleSaving(true);
    try {
      await api.post("/permissions/roles/", {
        name: newRoleName,
        description: newRoleDesc,
        permissions: selectedPermissions,
      });
      setSuccessMsg("Role created successfully.");
      setNewRoleName("");
      setNewRoleDesc("");
      setSelectedPermissions([]);
      loadOrgRoles();
    } catch (err: any) {
      setFormError(err.message || "Failed to create custom role.");
    } finally {
      setRoleSaving(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!window.confirm("Are you sure you want to delete this custom role?")) return;
    setSuccessMsg(null);
    try {
      await api.delete(`/permissions/roles/${roleId}/`);
      setSuccessMsg("Role deleted successfully.");
      loadOrgRoles();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignUserRole = async (userId: string, roleId: string) => {
    setFormError(null);
    setSuccessMsg(null);
    
    // If selecting empty string, we unassign current role mapping if exists
    const existing = mappings.find((m) => m.user === userId);
    try {
      if (existing) {
        await api.delete(`/permissions/user-roles/${existing.id}/`);
      }
      if (roleId !== "") {
        await api.post("/permissions/user-roles/", {
          user: userId,
          role: roleId,
        });
      }
      setSuccessMsg("Role mapping updated successfully.");
      loadRoleMappings();
    } catch (err: any) {
      setFormError("Failed to update user role assignments.");
    }
  };

  const handlePermissionToggle = (permId: string) => {
    const current = [...selectedPermissions];
    const idx = current.indexOf(permId);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(permId);
    }
    setSelectedPermissions(current);
  };

  const getUserRoleLabel = (userId: string) => {
    const map = mappings.find((m) => m.user === userId);
    return map ? map.role_detail.name : "Default Fallback";
  };

  const getUserRoleId = (userId: string) => {
    const map = mappings.find((m) => m.user === userId);
    return map ? map.role : "";
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-5 select-none text-foreground">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Workspace settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage organization profiles and configure role-based access control policies.
        </p>
      </div>

      {/* Underline Tabs */}
      <div className="flex border-b border-border text-xs font-semibold gap-1 select-none">
        <button
          onClick={() => setActiveTab("org")}
          className={`px-4 py-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "org"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Organization Profile
        </button>
        <button
          onClick={() => setActiveTab("roles")}
          className={`px-4 py-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "roles"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Roles & Permissions
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "users"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          User Role Assignments
        </button>
        <button
          onClick={() => setActiveTab("usage")}
          className={`px-4 py-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "usage"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Usage & Subscription
        </button>
      </div>

      {successMsg && <Alert variant="success">{successMsg}</Alert>}
      {formError && <Alert variant="destructive">{formError}</Alert>}

      {/* TAB CONTENT 1: ORGANIZATION PROFILE */}
      {activeTab === "org" && (
        <Card className="p-5 flex flex-col gap-5">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-left">
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
                {org?.name || "Loading organization..."}
              </h2>
              <span className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5">
                Location: {org?.address || "Global"} | Timezone: {org?.timezone || "UTC"}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
              <span className="text-xs text-muted-foreground">Loading details...</span>
            </div>
          ) : org ? (
            <form onSubmit={handleOrgSave} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Organization Name"
                  value={org.name}
                  disabled={!isAdmin}
                  onChange={(e) => setOrg({ ...org, name: e.target.value })}
                />
                <Input
                  label="Timezone"
                  value={org.timezone}
                  disabled={!isAdmin}
                  onChange={(e) => setOrg({ ...org, timezone: e.target.value })}
                />
                <Input
                  label="Contact Email"
                  value={org.email || ""}
                  disabled={!isAdmin}
                  onChange={(e) => setOrg({ ...org, email: e.target.value })}
                />
                <Input
                  label="Contact Phone"
                  value={org.phone || ""}
                  disabled={!isAdmin}
                  onChange={(e) => setOrg({ ...org, phone: e.target.value })}
                />
                <Input
                  label="Website URL"
                  value={org.website || ""}
                  disabled={!isAdmin}
                  onChange={(e) => setOrg({ ...org, website: e.target.value })}
                />
                <Input
                  label="Physical Address"
                  value={org.address}
                  disabled={!isAdmin}
                  onChange={(e) => setOrg({ ...org, address: e.target.value })}
                />
              </div>

              {isAdmin && (
                <Button type="submit" variant="primary" className="self-end font-bold">
                  Save Changes
                </Button>
              )}
            </form>
          ) : null}
        </Card>
      )}

      {/* TAB CONTENT 2: ROLES & PERMISSIONS */}
      {activeTab === "roles" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Create Custom Role Column */}
          <Card className="md:col-span-1 p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">
              Create Custom Role
            </h3>
            {!isAdmin ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center text-xs text-muted-foreground">
                <Lock className="w-5 h-5 text-muted-foreground/60" />
                <span>Admin permissions required.</span>
              </div>
            ) : (
              <form onSubmit={handleCreateRole} className="flex flex-col gap-4">
                <Input
                  label="Role Name"
                  placeholder="e.g. Read-Only Reviewer"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                />
                <Input
                  label="Description"
                  placeholder="Can view checkouts but cannot write..."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                />

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Allocated Permissions
                  </label>
                  <div className="max-h-52 overflow-y-auto border border-border bg-background rounded-lg p-2 flex flex-col gap-1.5">
                    {permissions.map((p) => {
                      const isChecked = selectedPermissions.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex items-center gap-2 p-1 hover:bg-secondary rounded cursor-pointer text-xs font-semibold"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handlePermissionToggle(p.id)}
                            className="rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                          />
                          <div className="flex flex-col">
                            <span className="text-foreground leading-tight">{p.name}</span>
                            <span className="text-[9px] text-muted-foreground leading-none font-bold uppercase">{p.codename}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <Button type="submit" variant="primary" className="w-full font-bold" isLoading={roleSaving}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Save Custom Role
                </Button>
              </form>
            )}
          </Card>

          {/* Active Roles Column */}
          <Card className="md:col-span-2 p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">
              Organization Custom Roles
            </h3>

            {roles.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground">
                No custom tenant roles defined. Create one to begin.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {roles.map((r) => (
                  <div 
                    key={r.id} 
                    className="p-4 border border-border bg-secondary/35 rounded-xl flex items-start justify-between gap-4 hover:border-primary/20 transition-all"
                  >
                    <div className="flex flex-col gap-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground">{r.name}</span>
                        <Badge variant="default" className="text-[9px]">Custom Role</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                        {r.description || "No description provided."}
                      </p>
                      {/* Permissions Tags */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {r.permissions_detail.map((pd) => (
                          <span 
                            key={pd.id}
                            className="text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded"
                          >
                            {pd.codename.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRole(r.id)}
                        className="text-muted-foreground hover:text-destructive shrink-0 w-7 h-7 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB CONTENT 3: USER ROLE ASSIGNMENTS */}
      {activeTab === "users" && (
        <Card className="p-5 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">
            User Workspace Permissions Allocation
          </h3>

          <div className="w-full overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="p-3.5">Workspace Member</th>
                  <th className="p-3.5">Static Base Role</th>
                  <th className="p-3.5">Assigned Custom Role</th>
                  <th className="p-3.5 w-60">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs text-foreground font-semibold">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-3.5 truncate">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{member.first_name} {member.last_name}</span>
                        <span className="text-[10px] text-muted-foreground">@{member.username} | {member.email}</span>
                      </div>
                    </td>
                    <td className="p-3.5 truncate">
                      <Badge variant="secondary" className="text-[9px] uppercase font-bold tracking-wider">
                        {member.role.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="p-3.5 truncate">
                      <Badge variant="default" className="text-[9px] uppercase font-bold tracking-wider">
                        {getUserRoleLabel(member.id)}
                      </Badge>
                    </td>
                    <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                      {!isAdmin ? (
                        <span className="text-[10px] text-muted-foreground/60 font-bold uppercase">Locked</span>
                      ) : (
                        <select
                          value={getUserRoleId(member.id)}
                          onChange={(e) => handleAssignUserRole(member.id, e.target.value)}
                          className="w-full text-xs font-bold bg-background border border-border rounded-md px-2 py-1 outline-none text-foreground cursor-pointer"
                        >
                          <option value="">Default Fallback Role</option>
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB CONTENT 4: USAGE & SUBSCRIPTION */}
      {activeTab === "usage" && (
        <div className="flex flex-col gap-6">
          {/* Subscription Tier Info Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 p-5 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Subscription</h3>
                <div className="flex items-center gap-2 mt-2">
                  <CreditCard className="w-5 h-5 text-purple-400" />
                  <span className="text-base font-black text-white">
                    {sub?.plan_tier ? `${sub.plan_tier} Plan` : "FREE Plan"}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mt-1">
                  Status: <Badge variant={sub?.is_active ? "success" : "destructive"}>{sub?.is_active ? "Active" : "Inactive"}</Badge>
                </p>
              </div>

              {isAdmin && (
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-white/[0.06]">
                  <span className="text-[9px] font-bold text-gray-600 uppercase">Change Subscription:</span>
                  <div className="flex gap-2">
                    {sub?.plan_tier !== "PRO" && (
                      <Button size="sm" variant="minimal" onClick={() => handleUpgradePlan("PRO")} className="flex-1 text-xs">
                        Upgrade Pro ($49)
                      </Button>
                    )}
                    {sub?.plan_tier !== "ENTERPRISE" && (
                      <Button size="sm" variant="minimal" onClick={() => handleUpgradePlan("ENTERPRISE")} className="flex-1 text-xs border-purple-500/20 text-purple-400 hover:bg-purple-500/10">
                        Enterprise ($299)
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* Seat limits progress */}
            <Card className="md:col-span-1 p-5 flex flex-col gap-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                <span>Seats Utilization</span>
                <span className="text-[10px] text-purple-400 font-bold">{members.length} / {sub?.seats_limit || 5}</span>
              </h3>
              <div className="w-full bg-white/[0.04] rounded-full h-1.5 mt-2">
                <div
                  className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (members.length / (sub?.seats_limit || 5)) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                Invited and active users inside your workspace organization. Upgrade your plan to increase limits.
              </p>
            </Card>

            {/* AI credits progress */}
            <Card className="md:col-span-1 p-5 flex flex-col gap-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                <span>AI Assistant Credits</span>
                <span className="text-[10px] text-purple-400 font-bold">{sub?.ai_credits_used || 0} / {sub?.ai_credits_limit || 100}</span>
              </h3>
              <div className="w-full bg-white/[0.04] rounded-full h-1.5 mt-2">
                <div
                  className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, ((sub?.ai_credits_used || 0) / (sub?.ai_credits_limit || 100)) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                Credits reset monthly. Used when querying AI chat assistance, SWOT audits, and auto-compiles.
              </p>
            </Card>
          </div>

          {/* Invitation Logs and Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 p-5 flex flex-col gap-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/[0.06] pb-2 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-purple-400" /> Invite Collaborator
              </h3>
              {!isAdmin ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center text-xs text-gray-500">
                  <Lock className="w-5 h-5 text-gray-700" />
                  <span>Admin permission required to invite users.</span>
                </div>
              ) : (
                <form onSubmit={handleCreateInvite} className="flex flex-col gap-4">
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="user@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Select Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="bg-gray-900 border border-white/[0.08] text-gray-200 text-xs rounded-md p-2 outline-none cursor-pointer focus:border-purple-500"
                    >
                      <option value="BUSINESS_ANALYST">Business Analyst</option>
                      <option value="PRODUCT_OWNER">Product Owner</option>
                      <option value="DEVELOPER">Developer</option>
                      <option value="QA_TESTER">QA Tester</option>
                      <option value="STAKEHOLDER">Stakeholder</option>
                    </select>
                  </div>
                  <Button type="submit" variant="primary" className="w-full text-xs font-bold mt-2" isLoading={inviting}>
                    Send Invite Code
                  </Button>
                </form>
              )}
            </Card>

            <Card className="md:col-span-2 p-5 flex flex-col gap-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/[0.06] pb-2">
                Active Invitations Log
              </h3>
              {invitations.length === 0 ? (
                <div className="text-center py-10 text-xs text-gray-600 font-medium">
                  No active pending invitations found.
                </div>
              ) : (
                <div className="w-full overflow-x-auto rounded-xl border border-white/[0.06] bg-gray-950/40">
                  <table className="w-full text-left border-collapse table-fixed text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[9px] font-bold uppercase tracking-wider text-gray-500">
                        <th className="p-3">Email Address</th>
                        <th className="p-3">Allocated Role</th>
                        <th className="p-3 w-40">Registration Link</th>
                        <th className="p-3 w-20 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04] text-gray-300 font-semibold">
                      {invitations.map((inv) => {
                        const inviteLink = `${window.location.origin}/register?invite=${inv.token}`;
                        const isCopied = copiedToken === inv.id;
                        return (
                          <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-3 truncate font-bold text-white">{inv.email}</td>
                            <td className="p-3 truncate">
                              <Badge variant="secondary" className="text-[9px] uppercase">
                                {inv.role.replace("_", " ")}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(inviteLink);
                                  setCopiedToken(inv.id);
                                  setTimeout(() => setCopiedToken(null), 2000);
                                }}
                                className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 border-none bg-transparent cursor-pointer font-bold outline-none"
                              >
                                {isCopied ? <span className="text-green-500">Copied!</span> : <>Copy Link <Copy className="w-2.5 h-2.5" /></>}
                              </button>
                            </td>
                            <td className="p-3 text-right">
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelInvite(inv.id)}
                                  className="text-gray-700 hover:text-red-400 transition-colors border-none bg-transparent cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* Billing Invoice History Table */}
          <Card className="p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/[0.06] pb-2">
              Monthly Billing Invoice History
            </h3>
            {invoices.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-600 font-medium">
                No invoices found. Free subscription tier billing history is empty.
              </div>
            ) : (
              <div className="w-full overflow-x-auto rounded-xl border border-white/[0.06] bg-gray-950/40">
                <table className="w-full text-left border-collapse table-fixed text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[9px] font-bold uppercase tracking-wider text-gray-500">
                      <th className="p-3">Invoice ID</th>
                      <th className="p-3">Billing Date</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Paid Amount</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-gray-300 font-semibold">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 font-mono font-bold text-white">{inv.id}</td>
                        <td className="p-3 text-gray-400 font-medium">{inv.date}</td>
                        <td className="p-3 text-gray-300 truncate">{inv.description}</td>
                        <td className="p-3 text-white font-bold">{inv.amount}</td>
                        <td className="p-3">
                          <Badge variant="success">Paid</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
