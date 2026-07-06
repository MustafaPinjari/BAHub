import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../../services/api";
import { Card, Badge, Button, Input, Select, Alert } from "../../components/common/UIComponents";
import { DataTable } from "../../components/common/DataTable";
import type { Column } from "../../components/common/DataTable";
import { useAuth } from "../auth/AuthContext";
import { useProject } from "../projects/ProjectContext";
import { 
  GitFork, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Loader2, 
  FolderGit 
} from "lucide-react";


interface Gap {
  id: string;
  project: string;
  project_name: string;
  title: string;
  current_state: string;
  future_state: string;
  gap_description: string;
  action_plan: string;
  status: "IDENTIFIED" | "IN_PROGRESS" | "RESOLVED";
  created_at: string;
}

const gapSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  current_state: z.string().min(5, "Current state description is required"),
  future_state: z.string().min(5, "Future state description is required"),
  gap_description: z.string().min(5, "Gap explanation is required"),
  action_plan: z.string().min(5, "Action plan checklist is required"),
  status: z.enum(["IDENTIFIED", "IN_PROGRESS", "RESOLVED"]).default("IDENTIFIED"),
});

export const GapAnalysisPage: React.FC = () => {
  const { user } = useAuth();
  const { activeProject } = useProject();

  // States
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGap, setEditingGap] = useState<Gap | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canManage = user ? ["ADMIN", "BUSINESS_ANALYST", "PRODUCT_OWNER"].includes(user.role) : false;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(gapSchema),
    defaultValues: {
      title: "",
      current_state: "",
      future_state: "",
      gap_description: "",
      action_plan: "",
      status: "IDENTIFIED",
    },
  });

  const fetchGaps = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const res = await api.get<any, { data: Gap[] }>(`/strategic/gap/?project=${activeProject.id}`);
      setGaps(res.data);
    } catch (err) {
      console.error("Failed to load gaps:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGaps();
  }, [activeProject]);

  const openCreateModal = () => {
    setEditingGap(null);
    setFormError(null);
    reset({
      title: "",
      current_state: "",
      future_state: "",
      gap_description: "",
      action_plan: "",
      status: "IDENTIFIED",
    });
    setModalOpen(true);
  };

  const openEditModal = (gap: Gap) => {
    setEditingGap(gap);
    setFormError(null);
    reset({
      title: gap.title,
      current_state: gap.current_state,
      future_state: gap.future_state,
      gap_description: gap.gap_description,
      action_plan: gap.action_plan,
      status: gap.status,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    if (!activeProject) return;
    setFormError(null);
    setSuccessMessage(null);

    const payload = {
      ...data,
      project: activeProject.id
    };

    try {
      if (editingGap) {
        await api.put(`/strategic/gap/${editingGap.id}/`, payload);
        setSuccessMessage("Gap Analysis record updated successfully.");
      } else {
        await api.post("/strategic/gap/", payload);
        setSuccessMessage("Gap Analysis logged successfully.");
      }
      setModalOpen(false);
      fetchGaps();
    } catch (err: any) {
      setFormError(err.message || "Failed to save gap analysis.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this gap analysis profile permanently?")) return;
    setSuccessMessage(null);
    try {
      await api.delete(`/strategic/gap/${id}/`);
      setSuccessMessage("Gap record removed successfully.");
      fetchGaps();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (statusKey: string) => {
    switch (statusKey) {
      case "RESOLVED":
        return <Badge variant="success" className="text-[8px] font-bold tracking-wider">RESOLVED</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="default" className="text-[8px] font-bold tracking-wider">IN PROGRESS</Badge>;
      default:
        return <Badge variant="secondary" className="text-[8px] font-bold tracking-wider">IDENTIFIED</Badge>;
    }
  };

  // DataTable Columns Configuration
  const columns: Column<Gap>[] = [
    {
      key: "title",
      label: "Gap Title / Current State",
      sortable: true,
      render: (row) => (
        <div className="flex flex-col text-left max-w-xs">
          <span className="font-bold text-foreground leading-snug">{row.title}</span>
          <span className="text-[10px] text-muted-foreground font-semibold mt-0.5 line-clamp-1">
            Current: {row.current_state}
          </span>
        </div>
      ),
    },
    {
      key: "future_state",
      label: "Target Future State",
      render: (row) => (
        <p className="text-xs text-muted-foreground line-clamp-2 max-w-xs font-semibold leading-relaxed">
          {row.future_state}
        </p>
      ),
    },
    {
      key: "gap_description",
      label: "Gap Assessment",
      render: (row) => (
        <p className="text-xs text-muted-foreground line-clamp-2 max-w-xs font-semibold leading-relaxed">
          {row.gap_description}
        </p>
      ),
    },
    {
      key: "action_plan",
      label: "Action Plan Bridge",
      render: (row) => (
        <p className="text-xs text-muted-foreground line-clamp-2 max-w-xs font-semibold leading-relaxed">
          {row.action_plan}
        </p>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => {
        if (!canManage) return <span className="text-muted-foreground/30">—</span>;
        return (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openEditModal(row)}
              title="Edit Record"
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

  // 1. Placeholder screen if no active project context is selected
  if (!activeProject) {
    return (
      <Card className="flex flex-col items-center justify-center text-center p-12 py-16 max-w-lg mx-auto gap-4 mt-12 select-none text-foreground font-semibold">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 shrink-0">
          <FolderGit className="w-6 h-6 animate-pulse" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-bold uppercase tracking-wider">No Active Project selected</h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
            Select a project context from the Projects list page before managing Gap analysis.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-5 select-none text-foreground">
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-border pb-5 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Gap Analysis</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Identify operational gaps between current realities and future target requirements of {activeProject.name}.
          </p>
        </div>

        {canManage && (
          <Button
            variant="primary"
            size="sm"
            onClick={openCreateModal}
            className="text-xs font-bold py-1.5 px-3 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Log Strategic Gap
          </Button>
        )}
      </div>

      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-7 h-7 text-primary animate-spin mb-2" />
          <span className="text-xs text-muted-foreground font-semibold">Loading gap records...</span>
        </div>
      ) : gaps.length === 0 ? (
        <Card className="flex flex-col items-center justify-center text-center p-12 py-16 max-w-lg mx-auto gap-4 mt-6">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 shrink-0">
            <GitFork className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">No Gaps Identified</h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              Use Gap Analysis to bridge legacy manual flows to advanced automations. Click 'Log Strategic Gap' to document one.
            </p>
          </div>
          {canManage && (
            <Button variant="primary" size="sm" onClick={openCreateModal} className="text-xs font-bold mt-2">
              Log Strategic Gap
            </Button>
          )}
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={gaps}
          searchPlaceholder="Search gap database..."
          searchKeys={["title", "current_state", "future_state", "gap_description", "action_plan"]}
        />
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
                {editingGap ? "Edit Gap Analysis" : "Log Strategic Gap"}
              </h2>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Define current state vs. future targets and draw bridging steps.
              </p>
            </div>

            {formError && <Alert variant="destructive">{formError}</Alert>}

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] pr-1">
              <Input
                label="Gap Analysis Title"
                placeholder="e.g. Stripe checkout processing bottleneck"
                error={errors.title?.message}
                {...register("title")}
              />

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Current State (As-Is)
                </label>
                <textarea
                  placeholder="Describe the current operational process or limitation..."
                  rows={2.5}
                  className="w-full text-xs font-semibold border border-border bg-background rounded-lg p-2.5 outline-none text-foreground leading-relaxed resize-none focus:border-primary"
                  {...register("current_state")}
                />
                {errors.current_state && (
                  <span className="text-xs text-[#DC2626] font-medium mt-0.5">
                    {errors.current_state.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Target Future State (To-Be)
                </label>
                <textarea
                  placeholder="Describe the desired objective after implementation..."
                  rows={2.5}
                  className="w-full text-xs font-semibold border border-border bg-background rounded-lg p-2.5 outline-none text-foreground leading-relaxed resize-none focus:border-primary"
                  {...register("future_state")}
                />
                {errors.future_state && (
                  <span className="text-xs text-[#DC2626] font-medium mt-0.5">
                    {errors.future_state.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Gap Assessment Description
                </label>
                <textarea
                  placeholder="What specific components or technologies are missing?"
                  rows={2.5}
                  className="w-full text-xs font-semibold border border-border bg-background rounded-lg p-2.5 outline-none text-foreground leading-relaxed resize-none focus:border-primary"
                  {...register("gap_description")}
                />
                {errors.gap_description && (
                  <span className="text-xs text-[#DC2626] font-medium mt-0.5">
                    {errors.gap_description.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Action Plan Bridge
                </label>
                <textarea
                  placeholder="Detail the steps, scripts, or APIs required to resolve this gap..."
                  rows={3}
                  className="w-full text-xs font-semibold border border-border bg-background rounded-lg p-2.5 outline-none text-foreground leading-relaxed resize-none focus:border-primary"
                  {...register("action_plan")}
                />
                {errors.action_plan && (
                  <span className="text-xs text-[#DC2626] font-medium mt-0.5">
                    {errors.action_plan.message}
                  </span>
                )}
              </div>

              <Select
                label="Resolution Status"
                options={[
                  { value: "IDENTIFIED", label: "Identified" },
                  { value: "IN_PROGRESS", label: "In Progress" },
                  { value: "RESOLVED", label: "Resolved" },
                ]}
                error={errors.status?.message}
                {...register("status")}
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
                  Save Gap
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
