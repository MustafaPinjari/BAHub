import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../../services/api";
import { Card, Badge, Button, Input, Select, Alert, Textarea } from "../../components/common/UIComponents";
import { DataTable } from "../../components/common/DataTable";
import type { Column } from "../../components/common/DataTable";
import { useAuth } from "../auth/AuthContext";
import { useProject } from "../projects/ProjectContext";
import { 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Loader2,
  FolderGit
} from "lucide-react";


interface Risk {
  id: string;
  project: string;
  project_name: string;
  title: string;
  description: string;
  probability: "HIGH" | "MEDIUM" | "LOW";
  impact: "HIGH" | "MEDIUM" | "LOW";
  mitigation: string;
  status: "IDENTIFIED" | "MITIGATED" | "OCCURRED" | "CLOSED";
  created_at: string;
}

const riskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  probability: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  impact: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  mitigation: z.string().min(5, "Mitigation plan is required"),
  status: z.enum(["IDENTIFIED", "MITIGATED", "OCCURRED", "CLOSED"]).default("IDENTIFIED"),
});

export const RisksPage: React.FC = () => {
  const { user } = useAuth();
  const { activeProject } = useProject();

  // States
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canManage = user ? ["ADMIN", "BUSINESS_ANALYST", "PRODUCT_OWNER"].includes(user.role) : false;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(riskSchema),
    defaultValues: {
      title: "",
      description: "",
      probability: "MEDIUM",
      impact: "MEDIUM",
      mitigation: "",
      status: "IDENTIFIED",
    },
  });

  const fetchRisks = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const res = await api.get<any, { data: Risk[] }>(`/risks/?project=${activeProject.id}`);
      setRisks(res.data);
    } catch (err) {
      console.error("Failed to load risks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisks();
  }, [activeProject]);

  const openCreateModal = () => {
    setEditingRisk(null);
    setFormError(null);
    reset({
      title: "",
      description: "",
      probability: "MEDIUM",
      impact: "MEDIUM",
      mitigation: "",
      status: "IDENTIFIED",
    });
    setModalOpen(true);
  };

  const openEditModal = (risk: Risk) => {
    setEditingRisk(risk);
    setFormError(null);
    reset({
      title: risk.title,
      description: risk.description,
      probability: risk.probability,
      impact: risk.impact,
      mitigation: risk.mitigation,
      status: risk.status,
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
      if (editingRisk) {
        await api.put(`/risks/${editingRisk.id}/`, payload);
        setSuccessMessage("Risk record updated successfully.");
      } else {
        await api.post("/risks/", payload);
        setSuccessMessage("Risk logged successfully in project registers.");
      }
      setModalOpen(false);
      fetchRisks();
    } catch (err: any) {
      setFormError(err.message || "Failed to save risk details.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this risk from registers permanently?")) return;
    setSuccessMessage(null);
    try {
      await api.delete(`/risks/${id}/`);
      setSuccessMessage("Risk removed successfully.");
      fetchRisks();
    } catch (err) {
      console.error(err);
    }
  };

  const getLevelBadge = (level: "HIGH" | "MEDIUM" | "LOW") => {
    switch (level) {
      case "HIGH":
        return <Badge variant="destructive" className="text-[8px] font-bold uppercase tracking-wider">High</Badge>;
      case "MEDIUM":
        return <Badge variant="default" className="text-[8px] font-bold uppercase tracking-wider">Medium</Badge>;
      default:
        return <Badge variant="secondary" className="text-[8px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">Low</Badge>;
    }
  };

  const getStatusBadge = (statusKey: string) => {
    switch (statusKey) {
      case "MITIGATED":
      case "CLOSED":
        return <Badge variant="success" className="text-[8px] font-bold tracking-wider">{statusKey}</Badge>;
      case "OCCURRED":
        return <Badge variant="destructive" className="text-[8px] font-bold tracking-wider">{statusKey}</Badge>;
      default:
        return <Badge variant="secondary" className="text-[8px] font-bold tracking-wider">{statusKey}</Badge>;
    }
  };

  // DataTable Columns Configuration
  const columns: Column<Risk>[] = [
    {
      key: "title",
      label: "Risk Title",
      sortable: true,
      render: (row) => (
        <div className="flex flex-col text-left max-w-xs">
          <span className="font-bold text-foreground leading-snug">{row.title}</span>
          <span className="text-[10px] text-muted-foreground font-semibold mt-0.5 line-clamp-1">
            {row.description}
          </span>
        </div>
      ),
    },
    {
      key: "probability",
      label: "Probability",
      sortable: true,
      render: (row) => getLevelBadge(row.probability),
    },
    {
      key: "impact",
      label: "Impact",
      sortable: true,
      render: (row) => getLevelBadge(row.impact),
    },
    {
      key: "mitigation",
      label: "Mitigation Plan",
      render: (row) => (
        <p className="text-xs text-muted-foreground line-clamp-2 max-w-xs font-semibold leading-relaxed">
          {row.mitigation}
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
            Select a project context from the Projects list page before managing risks logs.
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
          <h1 className="text-xl font-bold tracking-tight text-foreground">Risks Log</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Identify potential threats, categorize probability/impact, and record mitigation strategies.
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
            Log Risk
          </Button>
        )}
      </div>

      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-7 h-7 text-primary animate-spin mb-2" />
          <span className="text-xs text-muted-foreground font-semibold">Loading risks register...</span>
        </div>
      ) : risks.length === 0 ? (
        <Card className="flex flex-col items-center justify-center text-center p-12 py-16 max-w-lg mx-auto gap-4 mt-6">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 shrink-0">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">No Project Risks Logged</h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              Keep track of technical bottlenecks, data schema integrations, and operational blockers. Click 'Log Risk' to begin.
            </p>
          </div>
          {canManage && (
            <Button variant="primary" size="sm" onClick={openCreateModal} className="text-xs font-bold mt-2">
              Log Risk
            </Button>
          )}
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={risks}
          searchPlaceholder="Search risks catalog..."
          searchKeys={["title", "description", "mitigation"]}
        />
      )}

      {/* CREATE/EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg p-8 flex flex-col gap-6 bg-gray-950 border border-white/[0.08] rounded-3xl relative select-none shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col gap-1 border-b border-white/[0.06] pb-3 text-left">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                {editingRisk ? "Edit Risk profile" : "Log New Project Risk"}
              </h2>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Provide threat assessments and plan fallback countermeasures.
              </p>
            </div>

            {formError && <Alert variant="destructive">{formError}</Alert>}

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] pr-1">
              <Input
                label="Risk Title"
                placeholder="e.g. Stripe API Integration Delay"
                error={errors.title?.message}
                className="border-white/[0.06] focus:border-purple-500/40 bg-black/40"
                {...register("title")}
              />

              <Textarea
                label="Risk Description"
                placeholder="Describe the threat context..."
                rows={3}
                error={errors.description?.message}
                className="resize-none font-semibold leading-relaxed border-white/[0.06] focus:border-purple-500/40 bg-black/40"
                {...register("description")}
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Probability"
                  options={[
                    { value: "HIGH", label: "High" },
                    { value: "MEDIUM", label: "Medium" },
                    { value: "LOW", label: "Low" },
                  ]}
                  error={errors.probability?.message}
                  className="border-white/[0.06] focus:border-purple-500/40 bg-black/40"
                  {...register("probability")}
                />
                <Select
                  label="Impact Level"
                  options={[
                    { value: "HIGH", label: "High" },
                    { value: "MEDIUM", label: "Medium" },
                    { value: "LOW", label: "Low" },
                  ]}
                  error={errors.impact?.message}
                  className="border-white/[0.06] focus:border-purple-500/40 bg-black/40"
                  {...register("impact")}
                />
              </div>

              <Textarea
                label="Mitigation Plan"
                placeholder="Describe strategy to prevent or mitigate this risk..."
                rows={3}
                error={errors.mitigation?.message}
                className="resize-none font-semibold leading-relaxed border-white/[0.06] focus:border-purple-500/40 bg-black/40"
                {...register("mitigation")}
              />

              <Select
                label="Risk Status"
                options={[
                  { value: "IDENTIFIED", label: "Identified" },
                  { value: "MITIGATED", label: "Mitigated" },
                  { value: "OCCURRED", label: "Occurred" },
                  { value: "CLOSED", label: "Closed" },
                ]}
                error={errors.status?.message}
                className="border-white/[0.06] focus:border-purple-500/40 bg-black/40"
                {...register("status")}
              />

              <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] pt-4 mt-2">
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
                  Save Risk
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
