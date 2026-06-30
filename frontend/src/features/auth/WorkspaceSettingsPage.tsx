import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Card, Badge, Button, Input, Alert } from "../../components/common/UIComponents";
import { useAuth } from "./AuthContext";
import { 
  Building, 
  Plus, 
  Trash2,
  Loader2,
  Lock
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
  
  // Tabs: "org" | "roles" | "users"
  const [activeTab, setActiveTab] = useState<"org" | "roles" | "users">("org");
  
  // States
  const [org, setOrg] = useState<Organization | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [mappings, setMappings] = useState<UserRoleMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  const loadAll = async () => {
    await loadOrgDetails();
    await loadPermissionRegistry();
    await loadOrgRoles();
    await loadMembers();
    await loadRoleMappings();
  };

  useEffect(() => {
    loadAll();
  }, [user]);

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
    </div>
  );
};
