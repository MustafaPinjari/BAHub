import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../../services/api";
import { Card, Badge, Button, Input, Select, Alert } from "../../components/common/UIComponents";
import { DataTable } from "../../components/common/DataTable";
import type { Column } from "../../components/common/DataTable";
import { useAuth } from "../auth/AuthContext";
import { 
  UserCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Mail, 
  Phone,
  Grid,
  List,
  Loader2,
  FolderGit
} from "lucide-react";

interface Project {
  id: string;
  name: string;
}

interface Stakeholder {
  id: string;
  organization: string;
  project: string | null;
  project_detail: Project | null;
  name: string;
  title: string;
  department: string;
  email: string | null;
  phone: string | null;
  power: "HIGH" | "LOW";
  interest: "HIGH" | "LOW";
  influence: number; // 1-5
  impact: number;    // 1-5
  notes: string;
  created_at: string;
}

const stakeholderSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  title: z.string().min(2, "Title/Role must be at least 2 characters"),
  department: z.string().default(""),
  project: z.string().nullable().or(z.literal("")),
  email: z.string().email("Invalid email address").nullable().or(z.literal("")),
  phone: z.string().nullable().or(z.literal("")),
  power: z.enum(["HIGH", "LOW"]).default("LOW"),
  interest: z.enum(["HIGH", "LOW"]).default("LOW"),
  influence: z.coerce.number().min(1).max(5).default(3),
  impact: z.coerce.number().min(1).max(5).default(3),
  notes: z.string().default(""),
});

export const StakeholdersPage: React.FC = () => {
  const { user } = useAuth();
  
  // Views: "list" | "matrix"
  const [viewMode, setViewMode] = useState<"list" | "matrix">("list");

  // States
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStakeholder, setEditingStakeholder] = useState<Stakeholder | null>(null);
  
  // Project isolation context
  const [activeProject, setActiveProject] = useState<Project | null>(() => {
    try {
      const stored = localStorage.getItem("active_project");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  
  const [filterByProject, setFilterByProject] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canManage = user ? ["ADMIN", "BUSINESS_ANALYST", "PRODUCT_OWNER"].includes(user.role) : false;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(stakeholderSchema),
    defaultValues: {
      name: "",
      title: "",
      department: "",
      project: "",
      email: "",
      phone: "",
      power: "LOW",
      interest: "LOW",
      influence: 3,
      impact: 3,
      notes: "",
    },
  });

  const fetchStakeholders = async () => {
    setLoading(true);
    try {
      // Build filter URL if filterByProject is enabled and an active project is set
      let url = "/stakeholders/";
      if (filterByProject && activeProject) {
        url += `?project=${activeProject.id}`;
      }
      const res = await api.get<any, { data: Stakeholder[] }>(url);
      setStakeholders(res.data);
    } catch (err) {
      console.error("Failed to load stakeholders:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get<any, { data: Project[] }>("/projects/");
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStakeholders();
    fetchProjects();
  }, [filterByProject, activeProject]);

  // Listen to top-navbar active project switches
  useEffect(() => {
    const handleProjectChange = () => {
      try {
        const stored = localStorage.getItem("active_project");
        setActiveProject(stored ? JSON.parse(stored) : null);
      } catch {
        setActiveProject(null);
      }
    };
    window.addEventListener("activeProjectChanged", handleProjectChange);
    return () => {
      window.removeEventListener("activeProjectChanged", handleProjectChange);
    };
  }, []);

  const openCreateModal = () => {
    setEditingStakeholder(null);
    setFormError(null);
    reset({
      name: "",
      title: "",
      department: "",
      project: activeProject ? activeProject.id : "",
      email: "",
      phone: "",
      power: "LOW",
      interest: "LOW",
      influence: 3,
      impact: 3,
      notes: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (stakeholder: Stakeholder) => {
    setEditingStakeholder(stakeholder);
    setFormError(null);
    reset({
      name: stakeholder.name,
      title: stakeholder.title,
      department: stakeholder.department,
      project: stakeholder.project || "",
      email: stakeholder.email || "",
      phone: stakeholder.phone || "",
      power: stakeholder.power,
      interest: stakeholder.interest,
      influence: stakeholder.influence,
      impact: stakeholder.impact,
      notes: stakeholder.notes || "",
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    setFormError(null);
    setSuccessMessage(null);

    const payload = {
      ...data,
      project: data.project === "" ? null : data.project,
      email: data.email === "" ? null : data.email,
      phone: data.phone === "" ? null : data.phone,
    };

    try {
      if (editingStakeholder) {
        await api.put(`/stakeholders/${editingStakeholder.id}/`, payload);
        setSuccessMessage("Stakeholder details updated successfully.");
      } else {
        await api.post("/stakeholders/", payload);
        setSuccessMessage("Stakeholder registered successfully.");
      }
      setModalOpen(false);
      fetchStakeholders();
    } catch (err: any) {
      if (err.errors) {
        const key = Object.keys(err.errors)[0];
        const val = err.errors[key];
        setFormError(`${key}: ${Array.isArray(val) ? val.join(" ") : val}`);
      } else {
        setFormError(err.message || "Failed to save stakeholder details.");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this stakeholder from records?")) return;
    setSuccessMessage(null);
    try {
      await api.delete(`/stakeholders/${id}/`);
      setSuccessMessage("Stakeholder record removed successfully.");
      fetchStakeholders();
    } catch (err) {
      console.error(err);
    }
  };

  // Matrix Filter logic
  const getQuadrantList = (power: "HIGH" | "LOW", interest: "HIGH" | "LOW") => {
    return stakeholders.filter((s) => s.power === power && s.interest === interest);
  };

  // DataTable column mapping
  const columns: Column<Stakeholder>[] = [
    {
      key: "name",
      label: "Stakeholder",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-foreground leading-tight">{row.name}</span>
            <span className="text-[10px] text-muted-foreground font-semibold mt-0.5 leading-none">
              {row.title} {row.department ? `(${row.department})` : ""}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      label: "Contact",
      render: (row) => (
        <div className="flex flex-col gap-1 text-[11px] text-muted-foreground font-semibold">
          {row.email && (
            <div className="flex items-center gap-1">
              <Mail className="w-3 h-3 text-muted-foreground/60" />
              <span>{row.email}</span>
            </div>
          )}
          {row.phone && (
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-muted-foreground/60" />
              <span>{row.phone}</span>
            </div>
          )}
          {!row.email && !row.phone && <span className="text-muted-foreground/40">—</span>}
        </div>
      ),
    },
    {
      key: "matrix",
      label: "Power / Interest",
      render: (row) => (
        <div className="flex gap-1">
          <Badge variant={row.power === "HIGH" ? "success" : "secondary"} className="text-[8px] font-bold tracking-wider">
            P: {row.power}
          </Badge>
          <Badge variant={row.interest === "HIGH" ? "success" : "secondary"} className="text-[8px] font-bold tracking-wider">
            I: {row.interest}
          </Badge>
        </div>
      ),
    },
    {
      key: "scoring",
      label: "Influence / Impact",
      render: (row) => (
        <span className="text-xs font-bold text-foreground">
          {row.influence}/5 Influence | {row.impact}/5 Impact
        </span>
      ),
    },
    {
      key: "project",
      label: "Project Scope",
      sortable: true,
      render: (row) => {
        if (!row.project_detail) return <Badge variant="secondary">Global</Badge>;
        return (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-semibold">
            <FolderGit className="w-3 h-3 text-primary shrink-0" />
            <span className="truncate max-w-28 text-foreground">{row.project_detail.name}</span>
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => {
        if (!canManage) return <span className="text-muted-foreground/40">—</span>;
        return (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openEditModal(row)}
              title="Edit Profile"
              className="text-muted-foreground hover:text-foreground w-7 h-7 rounded"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(row.id)}
              title="Delete Record"
              className="text-muted-foreground hover:text-destructive w-7 h-7 rounded"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
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
          <h1 className="text-xl font-bold tracking-tight text-foreground">Stakeholder Registry</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Document contact records, assign role scopes, and map Power/Interest matrices.
          </p>
        </div>
        
        {/* View Switcher and Action Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Active project filters option */}
          {activeProject && (
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold cursor-pointer pr-2 border-r border-border h-7">
              <input
                type="checkbox"
                checked={filterByProject}
                onChange={() => setFilterByProject(!filterByProject)}
                className="rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
              />
              <span>Filter by {activeProject.name}</span>
            </label>
          )}

          <div className="flex items-center border border-border bg-card rounded-lg p-0.5 shrink-0">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md cursor-pointer transition-all ${
                viewMode === "list" 
                  ? "bg-secondary text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("matrix")}
              className={`p-1.5 rounded-md cursor-pointer transition-all ${
                viewMode === "matrix" 
                  ? "bg-secondary text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Power/Interest Grid"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>

          {canManage && (
            <Button
              variant="primary"
              size="sm"
              onClick={openCreateModal}
              className="text-xs font-bold py-1.5 px-3"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Stakeholder
            </Button>
          )}
        </div>
      </div>

      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-7 h-7 text-primary animate-spin mb-2" />
          <span className="text-xs text-muted-foreground font-semibold">Loading stakeholders...</span>
        </div>
      ) : stakeholders.length === 0 ? (
        <Card className="flex flex-col items-center justify-center text-center p-12 py-16 max-w-lg mx-auto gap-4 mt-6">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 shrink-0">
            <UserCheck className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">No Stakeholders Registered</h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              Stakeholder records help you catalog end-users, project sponsors, and business leaders. Create your first entry to begin.
            </p>
          </div>
          {canManage && (
            <Button variant="primary" size="sm" onClick={openCreateModal} className="text-xs font-bold mt-2">
              Add Stakeholder
            </Button>
          )}
        </Card>
      ) : viewMode === "list" ? (
        <DataTable
          columns={columns}
          data={stakeholders}
          searchPlaceholder="Search stakeholders..."
          searchKeys={["name", "title", "department"]}
        />
      ) : (
        /* INTERACTIVE 2x2 POWER/INTEREST GRID MATRIX */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 h-auto text-left select-none text-foreground font-semibold">
          {/* Cell 1: High Power, High Interest (Manage Closely) */}
          <Card className="p-5 flex flex-col gap-3 min-h-60 border-l-4 border-l-emerald-500 bg-card">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                High Power, High Interest
              </span>
              <Badge variant="success">Manage Closely</Badge>
            </div>
            <div className="flex flex-wrap gap-2 overflow-y-auto">
              {getQuadrantList("HIGH", "HIGH").length === 0 ? (
                <span className="text-[11px] text-muted-foreground/60 italic p-2">Empty Quadrant</span>
              ) : (
                getQuadrantList("HIGH", "HIGH").map((s) => (
                  <div
                    key={s.id}
                    onClick={() => openEditModal(s)}
                    className="p-2 border border-border bg-secondary/35 rounded-lg hover:border-emerald-400 cursor-pointer flex flex-col gap-0.5 text-xs text-left max-w-[200px]"
                    title={`Click to view: ${s.notes || 'No notes'}`}
                  >
                    <span className="font-bold text-foreground truncate">{s.name}</span>
                    <span className="text-[9px] text-muted-foreground truncate leading-none uppercase font-bold mt-0.5">{s.title}</span>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Cell 2: High Power, Low Interest (Keep Satisfied) */}
          <Card className="p-5 flex flex-col gap-3 min-h-60 border-l-4 border-l-blue-500 bg-card">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                High Power, Low Interest
              </span>
              <Badge variant="default">Keep Satisfied</Badge>
            </div>
            <div className="flex flex-wrap gap-2 overflow-y-auto">
              {getQuadrantList("HIGH", "LOW").length === 0 ? (
                <span className="text-[11px] text-muted-foreground/60 italic p-2">Empty Quadrant</span>
              ) : (
                getQuadrantList("HIGH", "LOW").map((s) => (
                  <div
                    key={s.id}
                    onClick={() => openEditModal(s)}
                    className="p-2 border border-border bg-secondary/35 rounded-lg hover:border-blue-400 cursor-pointer flex flex-col gap-0.5 text-xs text-left max-w-[200px]"
                    title={`Click to view: ${s.notes || 'No notes'}`}
                  >
                    <span className="font-bold text-foreground truncate">{s.name}</span>
                    <span className="text-[9px] text-muted-foreground truncate leading-none uppercase font-bold mt-0.5">{s.title}</span>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Cell 3: Low Power, High Interest (Keep Informed) */}
          <Card className="p-5 flex flex-col gap-3 min-h-60 border-l-4 border-l-amber-500 bg-card">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                Low Power, High Interest
              </span>
              <Badge variant="secondary">Keep Informed</Badge>
            </div>
            <div className="flex flex-wrap gap-2 overflow-y-auto">
              {getQuadrantList("LOW", "HIGH").length === 0 ? (
                <span className="text-[11px] text-muted-foreground/60 italic p-2">Empty Quadrant</span>
              ) : (
                getQuadrantList("LOW", "HIGH").map((s) => (
                  <div
                    key={s.id}
                    onClick={() => openEditModal(s)}
                    className="p-2 border border-border bg-secondary/35 rounded-lg hover:border-amber-400 cursor-pointer flex flex-col gap-0.5 text-xs text-left max-w-[200px]"
                    title={`Click to view: ${s.notes || 'No notes'}`}
                  >
                    <span className="font-bold text-foreground truncate">{s.name}</span>
                    <span className="text-[9px] text-muted-foreground truncate leading-none uppercase font-bold mt-0.5">{s.title}</span>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Cell 4: Low Power, Low Interest (Monitor) */}
          <Card className="p-5 flex flex-col gap-3 min-h-60 border-l-4 border-l-slate-400 bg-card">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Low Power, Low Interest
              </span>
              <Badge variant="secondary">Monitor</Badge>
            </div>
            <div className="flex flex-wrap gap-2 overflow-y-auto">
              {getQuadrantList("LOW", "LOW").length === 0 ? (
                <span className="text-[11px] text-muted-foreground/60 italic p-2">Empty Quadrant</span>
              ) : (
                getQuadrantList("LOW", "LOW").map((s) => (
                  <div
                    key={s.id}
                    onClick={() => openEditModal(s)}
                    className="p-2 border border-border bg-secondary/35 rounded-lg hover:border-slate-400 cursor-pointer flex flex-col gap-0.5 text-xs text-left max-w-[200px]"
                    title={`Click to view: ${s.notes || 'No notes'}`}
                  >
                    <span className="font-bold text-foreground truncate">{s.name}</span>
                    <span className="text-[9px] text-muted-foreground truncate leading-none uppercase font-bold mt-0.5">{s.title}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 flex flex-col gap-5 bg-card border border-border relative select-none">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col gap-1 border-b border-border pb-3">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                {editingStakeholder ? "Edit Stakeholder Profile" : "Register New Stakeholder"}
              </h2>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Provide details to categorize business sponsors and project SMEs.
              </p>
            </div>

            {formError && <Alert variant="destructive">{formError}</Alert>}

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] pr-1">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  error={errors.name?.message}
                  {...register("name")}
                />
                <Input
                  label="Role/Title"
                  placeholder="Sponsor / SME"
                  error={errors.title?.message}
                  {...register("title")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Department"
                  placeholder="e.g. Sales, Finance"
                  error={errors.department?.message}
                  {...register("department")}
                />
                <Select
                  label="Project Association"
                  options={[
                    { value: "", label: "Global (Organization Scope)" },
                    ...projects.map((p) => ({
                      value: p.id,
                      label: p.name,
                    })),
                  ]}
                  error={errors.project?.message}
                  {...register("project")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Email"
                  placeholder="john.doe@company.com"
                  error={errors.email?.message}
                  {...register("email")}
                />
                <Input
                  label="Phone"
                  placeholder="+1 555-0100"
                  error={errors.phone?.message}
                  {...register("phone")}
                />
              </div>

              {/* Power / Interest Selection */}
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Stakeholder Power"
                  options={[
                    { value: "HIGH", label: "High" },
                    { value: "LOW", label: "Low" },
                  ]}
                  error={errors.power?.message}
                  {...register("power")}
                />
                <Select
                  label="Stakeholder Interest"
                  options={[
                    { value: "HIGH", label: "High" },
                    { value: "LOW", label: "Low" },
                  ]}
                  error={errors.interest?.message}
                  {...register("interest")}
                />
              </div>

              {/* Influence / Impact Ratings */}
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Influence Rating (1-5)"
                  options={[
                    { value: "1", label: "1 (Very Low)" },
                    { value: "2", label: "2 (Low)" },
                    { value: "3", label: "3 (Medium)" },
                    { value: "4", label: "4 (High)" },
                    { value: "5", label: "5 (Very High)" },
                  ]}
                  error={errors.influence?.message}
                  {...register("influence")}
                />
                <Select
                  label="Impact Rating (1-5)"
                  options={[
                    { value: "1", label: "1 (Very Low)" },
                    { value: "2", label: "2 (Low)" },
                    { value: "3", label: "3 (Medium)" },
                    { value: "4", label: "4 (High)" },
                    { value: "5", label: "5 (Very High)" },
                  ]}
                  error={errors.impact?.message}
                  {...register("impact")}
                />
              </div>

              <Input
                label="Notes / Engagement Guidelines"
                placeholder="Preferred channel: Slack. Needs weekly reports on project timeline..."
                error={errors.notes?.message}
                {...register("notes")}
              />

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
                  Save Record
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
