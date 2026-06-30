import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../../services/api";
import { Card, Badge, Button, Input, Alert } from "../../components/common/UIComponents";
import { DataTable } from "../../components/common/DataTable";
import type { Column } from "../../components/common/DataTable";
import { useAuth } from "../auth/AuthContext";
import { 
  GitPullRequest, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Loader2,
  FolderGit,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";

interface Project {
  id: string;
  name: string;
}

interface ChangeRequest {
  id: string;
  project: string;
  project_name: string;
  title: string;
  description: string;
  reason: string;
  impact_analysis: string;
  status: "DRAFT" | "REVIEW" | "APPROVED" | "REJECTED";
  requested_by_username: string;
  reviewed_by_username: string | null;
  reviewed_at: string | null;
  created_at: string;
}

const crSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  reason: z.string().min(5, "Reason for change is required"),
  impact_analysis: z.string().min(5, "Impact analysis assessment is required"),
});

export const ChangeRequestsPage: React.FC = () => {
  const { user } = useAuth();
  
  // Project context from localStorage
  const [activeProject, setActiveProject] = useState<Project | null>(() => {
    try {
      const stored = localStorage.getItem("active_project");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // States
  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCr, setEditingCr] = useState<ChangeRequest | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canManage = user ? ["ADMIN", "BUSINESS_ANALYST", "PRODUCT_OWNER"].includes(user.role) : false;
  const canReview = user ? ["ADMIN", "PRODUCT_OWNER", "PROJECT_MANAGER"].includes(user.role) : false;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(crSchema),
    defaultValues: {
      title: "",
      description: "",
      reason: "",
      impact_analysis: "",
    },
  });

  const fetchChanges = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const res = await api.get<any, { data: ChangeRequest[] }>(`/risks/change-requests/?project=${activeProject.id}`);
      setChanges(res.data);
    } catch (err) {
      console.error("Failed to load change requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChanges();
  }, [activeProject]);

  // Listen to active project changes from top navbar
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
    setEditingCr(null);
    setFormError(null);
    reset({
      title: "",
      description: "",
      reason: "",
      impact_analysis: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (cr: ChangeRequest) => {
    setEditingCr(cr);
    setFormError(null);
    reset({
      title: cr.title,
      description: cr.description,
      reason: cr.reason,
      impact_analysis: cr.impact_analysis,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    if (!activeProject) return;
    setFormError(null);
    setSuccessMessage(null);

    const payload = {
      ...data,
      project: activeProject.id,
      status: editingCr ? editingCr.status : "DRAFT"
    };

    try {
      if (editingCr) {
        await api.put(`/risks/change-requests/${editingCr.id}/`, payload);
        setSuccessMessage("Change Request ticket updated.");
      } else {
        await api.post("/risks/change-requests/", payload);
        setSuccessMessage("Change Request ticket filed as Draft.");
      }
      setModalOpen(false);
      fetchChanges();
    } catch (err: any) {
      setFormError(err.message || "Failed to save change request.");
    }
  };

  const handleReview = async (id: string, decision: "APPROVED" | "REJECTED") => {
    setFormError(null);
    setSuccessMessage(null);
    try {
      await api.post(`/risks/change-requests/${id}/review/`, { status: decision });
      setSuccessMessage(`Change Request ticket ${decision.toLowerCase()} successfully.`);
      fetchChanges();
    } catch (err: any) {
      setFormError(err.message || "Failed to review change request.");
    }
  };

  const handleSubmitForReview = async (cr: ChangeRequest) => {
    setFormError(null);
    setSuccessMessage(null);
    try {
      await api.put(`/risks/change-requests/${cr.id}/`, {
        project: cr.project,
        title: cr.title,
        description: cr.description,
        reason: cr.reason,
        impact_analysis: cr.impact_analysis,
        status: "REVIEW"
      });
      setSuccessMessage("Change Request submitted to review pipeline.");
      fetchChanges();
    } catch (err: any) {
      setFormError("Failed to submit request.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this Change Request ticket?")) return;
    setSuccessMessage(null);
    try {
      await api.delete(`/risks/change-requests/${id}/`);
      setSuccessMessage("Change Request deleted.");
      fetchChanges();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (statusKey: string) => {
    switch (statusKey) {
      case "APPROVED":
        return <Badge variant="success" className="text-[8px] font-bold tracking-wider">Approved</Badge>;
      case "REJECTED":
        return <Badge variant="destructive" className="text-[8px] font-bold tracking-wider">Rejected</Badge>;
      case "REVIEW":
        return <Badge variant="default" className="text-[8px] font-bold tracking-wider">In Review</Badge>;
      default:
        return <Badge variant="secondary" className="text-[8px] font-bold tracking-wider">Draft</Badge>;
    }
  };

  // DataTable Columns configuration
  const columns: Column<ChangeRequest>[] = [
    {
      key: "title",
      label: "Title / Specifications Impact",
      sortable: true,
      render: (row) => (
        <div className="flex flex-col text-left max-w-xs">
          <span className="font-bold text-foreground leading-snug">{row.title}</span>
          <span className="text-[10px] text-muted-foreground font-semibold mt-0.5 line-clamp-1">
            Reason: {row.reason}
          </span>
        </div>
      ),
    },
    {
      key: "impact_analysis",
      label: "Impact Analysis",
      render: (row) => (
        <p className="text-xs text-muted-foreground line-clamp-2 max-w-xs font-semibold leading-relaxed">
          {row.impact_analysis}
        </p>
      ),
    },
    {
      key: "requested_by",
      label: "Requested By",
      render: (row) => (
        <span className="text-xs font-bold text-foreground">
          @{row.requested_by_username}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => (
        <div className="flex flex-col gap-1 items-start">
          {getStatusBadge(row.status)}
          {row.status === "APPROVED" && row.reviewed_by_username && (
            <span className="text-[9px] text-emerald-600 font-bold leading-none">
              By @{row.reviewed_by_username}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions / Review",
      render: (row) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {/* Draft submissions */}
          {row.status === "DRAFT" && canManage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSubmitForReview(row)}
              className="text-[9px] font-bold py-1 px-2.5 rounded h-6"
            >
              Submit
            </Button>
          )}

          {/* Manager / Admin review approvals */}
          {row.status === "REVIEW" && canReview && (
            <div className="flex items-center gap-1.5 bg-secondary/30 p-1 rounded-lg border border-border">
              <button
                onClick={() => handleReview(row.id, "APPROVED")}
                className="p-1 rounded text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                title="Approve Change"
              >
                <ThumbsUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleReview(row.id, "REJECTED")}
                className="p-1 rounded text-destructive hover:bg-red-50 cursor-pointer"
                title="Reject Change"
              >
                <ThumbsDown className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* CRUD controls */}
          {canManage && (row.status === "DRAFT" || row.status === "REVIEW") && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEditModal(row)}
                title="Edit Request"
                className="text-muted-foreground hover:text-foreground w-7 h-7 rounded"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(row.id)}
                title="Delete Request"
                className="text-muted-foreground hover:text-destructive w-7 h-7 rounded"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      ),
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
            Select a project context from the Projects list page before managing change requests.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-5 select-none text-foreground">
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-border pb-4.5 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Change Requests</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            File project change requests, assess timeline impact, and manage approval status flows.
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
            File Change Request
          </Button>
        )}
      </div>

      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      {formError && <Alert variant="destructive">{formError}</Alert>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-7 h-7 text-primary animate-spin mb-2" />
          <span className="text-xs text-muted-foreground font-semibold">Loading change requests...</span>
        </div>
      ) : changes.length === 0 ? (
        <Card className="flex flex-col items-center justify-center text-center p-12 py-16 max-w-lg mx-auto gap-4 mt-6">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 shrink-0">
            <GitPullRequest className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">No Change Requests Filed</h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              Change requests document scope shifts, reason justifications, and design compromises. Click 'File Change Request' to start.
            </p>
          </div>
          {canManage && (
            <Button variant="primary" size="sm" onClick={openCreateModal} className="text-xs font-bold mt-2">
              File Change Request
            </Button>
          )}
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={changes}
          searchPlaceholder="Search change requests..."
          searchKeys={["title", "description", "reason", "impact_analysis"]}
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
                {editingCr ? "Edit Change Request ticket" : "File Change Request"}
              </h2>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Detail proposed scope shifts, reasons, and impact assessments.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] pr-1">
              <Input
                label="Change Request Title"
                placeholder="e.g. Expand search parameters for dashboard"
                error={errors.title?.message}
                {...register("title")}
              />

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Description of Change
                </label>
                <textarea
                  placeholder="Provide specifications detail..."
                  rows={3}
                  className="w-full text-xs font-semibold border border-border bg-background rounded-lg p-2.5 outline-none text-foreground leading-relaxed resize-none focus:border-primary"
                  {...register("description")}
                />
                {errors.description && (
                  <span className="text-xs text-[#DC2626] font-medium mt-0.5">
                    {errors.description.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Reason for Change
                </label>
                <textarea
                  placeholder="Provide customer requirements or tech justifications..."
                  rows={2}
                  className="w-full text-xs font-semibold border border-border bg-background rounded-lg p-2.5 outline-none text-foreground leading-relaxed resize-none focus:border-primary"
                  {...register("reason")}
                />
                {errors.reason && (
                  <span className="text-xs text-[#DC2626] font-medium mt-0.5">
                    {errors.reason.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Impact Analysis (Scope, Timeline, Cost)
                </label>
                <textarea
                  placeholder="Detail sprint delays, resource demands, or system changes..."
                  rows={3}
                  className="w-full text-xs font-semibold border border-border bg-background rounded-lg p-2.5 outline-none text-foreground leading-relaxed resize-none focus:border-primary"
                  {...register("impact_analysis")}
                />
                {errors.impact_analysis && (
                  <span className="text-xs text-[#DC2626] font-medium mt-0.5">
                    {errors.impact_analysis.message}
                  </span>
                )}
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
                  File Request
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
