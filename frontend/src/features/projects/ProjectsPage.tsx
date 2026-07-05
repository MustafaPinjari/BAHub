import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../../services/api";
import { Card, Badge, Button, Input, Select, Alert } from "../../components/common/UIComponents";
import { DataTable } from "../../components/common/DataTable";
import type { Column } from "../../components/common/DataTable";
import { useAuth } from "../auth/AuthContext";
import { useProject } from "./ProjectContext";
import { 
  FolderGit, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Users,
  Loader2,
  CheckCircle2,
  FolderOpen
} from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface ProjectMember {
  id: string;
  project: string;
  user: string;
  user_detail: UserProfile;
  role: string;
}

interface Project {
  id: string;
  organization: string;
  name: string;
  description: string;
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED";
  start_date: string | null;
  end_date: string | null;
  members_detail: ProjectMember[];
  created_at: string;
}

const projectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters"),
  description: z.string().default(""),
  status: z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"]).default("ACTIVE"),
  start_date: z.string().nullable().or(z.literal("")),
  end_date: z.string().nullable().or(z.literal("")),
});

export const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const { setActiveProject } = useProject();
  
  // States
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProjectForMembers, setSelectedProjectForMembers] = useState<Project | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem("active_project");
      return stored ? JSON.parse(stored).id : null;
    } catch {
      return null;
    }
  });

  // Project membership assignment states
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedProjectRole, setSelectedProjectRole] = useState("CONTRIBUTOR");
  const [membersSaving, setMembersSaving] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canManageProjects = user ? ["ADMIN", "BUSINESS_ANALYST", "PRODUCT_OWNER"].includes(user.role) : false;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "ACTIVE",
      start_date: "",
      end_date: "",
    },
  });

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get<any, { data: Project[] }>("/projects/");
      setProjects(res.data);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await api.get<any, { data: UserProfile[] }>("/auth/members/");
      setMembers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchMembers();
  }, []);

  const handleSetActiveProject = (project: Project) => {
    setActiveProject(project);
    setActiveProjectId(project.id);
    setSuccessMessage(`Switched active context to "${project.name}"`);
  };

  const openCreateModal = () => {
    setEditingProject(null);
    setFormError(null);
    reset({
      name: "",
      description: "",
      status: "ACTIVE",
      start_date: "",
      end_date: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormError(null);
    reset({
      name: project.name,
      description: project.description,
      status: project.status,
      start_date: project.start_date || "",
      end_date: project.end_date || "",
    });
    setModalOpen(true);
  };

  const openMembersModal = (project: Project) => {
    setSelectedProjectForMembers(project);
    setSelectedUserId("");
    setSelectedProjectRole("CONTRIBUTOR");
    setFormError(null);
    setMembersModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    setFormError(null);
    setSuccessMessage(null);

    const payload = {
      ...data,
      start_date: data.start_date === "" ? null : data.start_date,
      end_date: data.end_date === "" ? null : data.end_date,
    };

    try {
      if (editingProject) {
        await api.put(`/projects/${editingProject.id}/`, payload);
        setSuccessMessage("Project updated successfully.");
      } else {
        await api.post("/projects/", payload);
        setSuccessMessage("Project created successfully.");
      }
      setModalOpen(false);
      fetchProjects();
    } catch (err: any) {
      if (err.errors) {
        const key = Object.keys(err.errors)[0];
        const val = err.errors[key];
        setFormError(`${key}: ${Array.isArray(val) ? val.join(" ") : val}`);
      } else {
        setFormError(err.message || "Failed to save project.");
      }
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm("Are you sure you want to delete this project? All associated requirement backlogs and data will be archived.")) return;
    setSuccessMessage(null);
    try {
      await api.delete(`/projects/${projectId}/`);
      setSuccessMessage("Project deleted successfully.");
      // Clear active project context if deleted
      const stored = localStorage.getItem("active_project");
      if (stored && JSON.parse(stored).id === projectId) {
        localStorage.removeItem("active_project");
        setActiveProjectId(null);
        window.dispatchEvent(new Event("activeProjectChanged"));
      }
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectForMembers || !selectedUserId) return;
    setFormError(null);
    setMembersSaving(true);

    try {
      await api.post("/projects/memberships/", {
        project: selectedProjectForMembers.id,
        user: selectedUserId,
        role: selectedProjectRole,
      });
      setSuccessMessage("Project member added successfully.");
      setSelectedUserId("");
      fetchProjects();
      // Reload details for display
      const updatedProjRes = await api.get<any, { data: Project }>(`/projects/${selectedProjectForMembers.id}/`);
      setSelectedProjectForMembers(updatedProjRes.data);
    } catch (err: any) {
      setFormError(err.message || "Failed to add member to project.");
    } finally {
      setMembersSaving(false);
    }
  };

  const handleRemoveMember = async (membershipId: string) => {
    if (!selectedProjectForMembers) return;
    if (!window.confirm("Remove this collaborator from the project?")) return;
    setFormError(null);
    try {
      await api.delete(`/projects/memberships/${membershipId}/`);
      setSuccessMessage("Member removed successfully.");
      fetchProjects();
      const updatedProjRes = await api.get<any, { data: Project }>(`/projects/${selectedProjectForMembers.id}/`);
      setSelectedProjectForMembers(updatedProjRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Status mapping colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="success">Active</Badge>;
      case "COMPLETED":
        return <Badge variant="default">Completed</Badge>;
      case "ARCHIVED":
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // DataTable column mapping
  const columns: Column<Project>[] = [
    {
      key: "name",
      label: "Project",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
            <FolderGit className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-foreground leading-tight">{row.name}</span>
            <span className="text-[10px] text-muted-foreground font-semibold mt-0.5 leading-none">
              Started: {row.start_date || "—"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "description",
      label: "Description",
      sortable: true,
      render: (row) => (
        <span className="text-muted-foreground line-clamp-1 truncate max-w-xs block font-semibold">
          {row.description || "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: "members",
      label: "Collaborators",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-bold text-foreground">
            {row.members_detail ? row.members_detail.length : 0} members
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => {
        const isActive = activeProjectId === row.id;
        return (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant={isActive ? "primary" : "outline"}
              size="sm"
              onClick={() => handleSetActiveProject(row)}
              className="text-[10px] font-bold py-1 px-2.5 rounded flex items-center gap-1 shrink-0 h-7"
            >
              {isActive ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  Active
                </>
              ) : (
                <>
                  <FolderOpen className="w-3 h-3" />
                  Select
                </>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openMembersModal(row)}
              title="Manage Collaborators"
              className="text-muted-foreground hover:text-foreground w-7 h-7 rounded"
            >
              <Users className="w-3.5 h-3.5" />
            </Button>

            {canManageProjects && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditModal(row)}
                  title="Edit Project"
                  className="text-muted-foreground hover:text-foreground w-7 h-7 rounded"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteProject(row.id)}
                  title="Archive Project"
                  className="text-muted-foreground hover:text-destructive w-7 h-7 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-5 select-none text-foreground">
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-border pb-5 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Workspace Projects</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Switch between project contexts to filter specifications, BAs, and stakeholder feedback lists.
          </p>
        </div>
        {canManageProjects && (
          <Button
            variant="primary"
            size="sm"
            onClick={openCreateModal}
            className="text-xs font-bold py-1.5 px-3 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            New Project
          </Button>
        )}
      </div>

      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-7 h-7 text-primary animate-spin mb-2" />
          <span className="text-xs text-muted-foreground font-semibold">Loading organization projects...</span>
        </div>
      ) : projects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center text-center p-12 py-16 max-w-lg mx-auto gap-4 mt-6">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 shrink-0">
            <FolderGit className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">No Projects Configured</h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              Projects aggregate your requirement catalogs, change requests, and stakeholder matrix maps. Create your first project to start.
            </p>
          </div>
          {canManageProjects && (
            <Button variant="primary" size="sm" onClick={openCreateModal} className="text-xs font-bold mt-2">
              Create Project Profile
            </Button>
          )}
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={projects}
          searchPlaceholder="Search projects..."
          searchKeys={["name", "description"]}
        />
      )}

      {/* CREATE/EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 flex flex-col gap-5 bg-card border border-border relative select-none">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col gap-1 border-b border-border pb-3">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                {editingProject ? "Edit Project Details" : "Create Project Environment"}
              </h2>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Provide metrics to launch a new workspace project container.
              </p>
            </div>

            {formError && <Alert variant="destructive">{formError}</Alert>}

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <Input
                label="Project Name"
                placeholder="e.g. Core SaaS Redesign"
                error={errors.name?.message}
                {...register("name")}
              />

              <Input
                label="Description"
                placeholder="Redesigning standard components to fit professional themes..."
                error={errors.description?.message}
                {...register("description")}
              />

              <Select
                label="Project Status"
                options={[
                  { value: "ACTIVE", label: "Active" },
                  { value: "COMPLETED", label: "Completed" },
                  { value: "ARCHIVED", label: "Archived" },
                ]}
                error={errors.status?.message}
                {...register("status")}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  error={errors.start_date?.message}
                  {...register("start_date")}
                />
                <Input
                  label="End Date"
                  type="date"
                  error={errors.end_date?.message}
                  {...register("end_date")}
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-4 mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                  className="text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  className="text-xs font-bold"
                >
                  Save Project
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MANAGE MEMBERS MODAL */}
      {membersModalOpen && selectedProjectForMembers && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 flex flex-col gap-5 bg-card border border-border relative select-none">
            <button
              onClick={() => setMembersModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col gap-1 border-b border-border pb-3">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Manage Collaborators
              </h2>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Add, assign roles, and revoke member accesses for **{selectedProjectForMembers.name}**.
              </p>
            </div>

            {formError && <Alert variant="destructive">{formError}</Alert>}

            {/* Add member form */}
            {canManageProjects && (
              <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-3 items-end border-b border-border pb-5 mt-1">
                <div className="flex-1 min-w-0">
                  <Select
                    label="Add Collaborator"
                    options={[
                      { value: "", label: "Select member..." },
                      ...members
                        .filter(m => !selectedProjectForMembers.members_detail.some(pm => pm.user === m.id))
                        .map((m) => ({
                          value: m.id,
                          label: `${m.first_name} ${m.last_name} (@${m.username})`,
                        })),
                    ]}
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-44">
                  <Select
                    label="Project Role"
                    options={[
                      { value: "PROJECT_MANAGER", label: "Project Manager" },
                      { value: "CONTRIBUTOR", label: "Contributor" },
                      { value: "VIEWER", label: "Viewer" },
                    ]}
                    value={selectedProjectRole}
                    onChange={(e) => setSelectedProjectRole(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={membersSaving}
                  disabled={!selectedUserId}
                  className="text-xs font-bold h-9 w-full sm:w-auto px-4"
                >
                  Add
                </Button>
              </form>
            )}

            {/* List active project members */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Active Project Members ({selectedProjectForMembers.members_detail.length})
              </span>
              <div className="max-h-48 overflow-y-auto border border-border bg-background rounded-lg p-2 flex flex-col gap-1.5">
                {selectedProjectForMembers.members_detail.length === 0 ? (
                  <span className="text-xs text-muted-foreground p-3 text-center">No members assigned yet.</span>
                ) : (
                  selectedProjectForMembers.members_detail.map((pm) => (
                    <div 
                      key={pm.id} 
                      className="flex items-center justify-between p-2 rounded-md hover:bg-secondary/40 text-xs font-semibold border border-transparent hover:border-border transition-all"
                    >
                      <div className="flex flex-col text-left">
                        <span className="text-foreground">{pm.user_detail.first_name} {pm.user_detail.last_name}</span>
                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wide leading-none mt-0.5">
                          @{pm.user_detail.username} | {pm.user_detail.role.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="default" className="text-[9px] font-bold uppercase tracking-wider">
                          {pm.role.replace("_", " ")}
                        </Badge>
                        {canManageProjects && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(pm.id)}
                            className="text-muted-foreground hover:text-destructive cursor-pointer p-1"
                            title="Remove Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center justify-end border-t border-border pt-4 mt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setMembersModalOpen(false)}
                className="text-xs font-bold"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
