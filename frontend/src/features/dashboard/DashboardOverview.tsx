import React, { useState, useEffect } from "react";
import { Card, Badge, Button } from "../../components/common/UIComponents";
import { DataTable } from "../../components/common/DataTable";
import type { Column } from "../../components/common/DataTable";
import { DocumentEditor } from "./components/DocumentEditor";
import { api } from "../../services/api";
import {
  Clock,
  FolderGit,
  ChevronsUpDown,
  Paperclip,
  Plus,
  Trash2,
  AlertCircle
} from "lucide-react";

export const DashboardOverview: React.FC = () => {
  // Project context from localStorage
  const [activeProject, setActiveProject] = useState<any>(() => {
    try {
      const stored = localStorage.getItem("active_project");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Dynamic States
  const [backlogData, setBacklogData] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const handleActiveProjectChange = () => {
      try {
        const stored = localStorage.getItem("active_project");
        setActiveProject(stored ? JSON.parse(stored) : null);
      } catch {
        setActiveProject(null);
      }
    };
    window.addEventListener("activeProjectChanged", handleActiveProjectChange);
    return () => {
      window.removeEventListener("activeProjectChanged", handleActiveProjectChange);
    };
  }, []);

  // Fetch all dashboard data for active project
  const fetchDashboardData = async () => {
    if (!activeProject?.id) return;
    try {
      // 1. Requirements
      const reqsRes = await api.get<any, { data: any[] }>(`/requirements/?project=${activeProject.id}`);
      setBacklogData(reqsRes.data || []);

      // 2. Documents
      const docsRes = await api.get<any, { data: any[] }>(`/documents/?project=${activeProject.id}`);
      setDocuments(docsRes.data || []);

      // 3. Attachments
      const attachRes = await api.get<any, { data: any[] }>(`/projects/attachments/?project=${activeProject.id}`);
      setAttachments(attachRes.data || []);

      // 4. Activities
      const actRes = await api.get<any, { data: any[] }>(`/projects/activities/?project=${activeProject.id}`);
      setActivities(actRes.data || []);
    } catch (e) {
      console.error("Failed to load dashboard statistics:", e);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeProject?.id]);

  // Handle file upload action
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeProject?.id) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("project", activeProject.id);
    formData.append("name", file.name);
    formData.append("file", file);

    try {
      await api.post("/projects/attachments/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      // Refresh attachments & activities logs
      fetchDashboardData();
    } catch (err) {
      console.error("Failed to upload attachment file:", err);
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  // Handle file delete action
  const handleFileDelete = async (attachmentId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    try {
      await api.delete(`/projects/attachments/${attachmentId}/`);
      fetchDashboardData();
    } catch (err) {
      console.error("Failed to delete attachment:", err);
    }
  };

  // Requirement Backlog Columns definition
  const columns: Column<any>[] = [
    {
      key: "req_id",
      label: "ID",
      sortable: true,
      render: (row) => <span className="font-bold text-primary">{row.req_id}</span>,
    },
    {
      key: "title",
      label: "Requirement Title",
      sortable: true,
      render: (row) => <span className="font-semibold text-foreground">{row.title}</span>,
    },
    {
      key: "req_type",
      label: "Category",
      sortable: true,
      render: (row) => (
        <span className="capitalize font-medium">
          {row.req_type ? row.req_type.replace("_", " ").toLowerCase() : "general"}
        </span>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      sortable: true,
      render: (row) => {
        const p = (row.priority || "MEDIUM").toUpperCase();
        const variant = p === "HIGH" ? "destructive" : p === "MEDIUM" ? "warning" : "secondary";
        return <Badge variant={variant}>{p}</Badge>;
      },
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => {
        const s = (row.status || "DRAFT").toUpperCase();
        const variant = s === "APPROVED" || s === "SIGNED_OFF" ? "success" : s === "REVIEW" || s === "IN_REVIEW" ? "warning" : "default";
        return <Badge variant={variant}>{s.replace("_", " ")}</Badge>;
      },
    },
  ];

  if (!activeProject) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center flex flex-col items-center gap-4 bg-card border border-border p-8 rounded-xl shadow-sm">
        <AlertCircle className="w-12 h-12 text-primary" />
        <h2 className="font-bold text-lg text-foreground">No Project Selected</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Please select or create a project workspace from the top sidebar dropdown to view the dashboard overview.
        </p>
      </div>
    );
  }

  // Filter documents mapping to the Approvals pipeline status
  const pendingApprovals = documents.filter((doc: any) => doc.status === "REVIEW" || doc.status === "DRAFT");

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 select-none text-foreground">
      {/* ==========================================
          TOP LAYER: CURRENT CONTEXT BAR
          ========================================== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 px-4 bg-card rounded-xl border border-border gap-4 select-none">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
            <FolderGit className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-foreground">{activeProject.name}</span>
              <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground/60 cursor-pointer" />
            </div>
            <span className="text-[10px] text-muted-foreground font-semibold">
              Current Context • Requirements Workspace
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto text-xs font-semibold">
          <div className="flex items-center gap-1 bg-secondary border border-border px-2.5 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Sprint Active</span>
          </div>
          <span className="text-muted-foreground/40">|</span>
          <span className="text-muted-foreground">
            Project Scope: <span className="text-foreground font-bold">{activeProject.status || "Active"}</span>
          </span>
        </div>
      </div>

      {/* ==========================================
          THREE-COLUMN/LAYER GRID SYSTEM
          ========================================== */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Side: Primary Work Area (75% width) */}
        <div className="w-full lg:w-[75%] flex flex-col gap-6">
          
          {/* Notion-Style Split View Workspace */}
          <div className="flex flex-col gap-2">
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Document Workspace
            </h2>
            <DocumentEditor />
          </div>

          {/* Spreadsheet-Style Backlog Table */}
          <div className="flex flex-col gap-2.5">
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Requirements Backlog Spreadsheet
            </h2>
            <DataTable
              columns={columns}
              data={backlogData}
              searchPlaceholder="Filter requirements..."
              searchKeys={["req_id", "title", "req_type"]}
            />
          </div>
        </div>

        {/* Right Side: Context Panel (25% width) */}
        <div className="w-full lg:w-[25%] lg:sticky lg:top-5 flex flex-col gap-5 select-none">
          
          {/* Context Layer 1: Approval Actions */}
          <Card className="flex flex-col gap-4 p-4.5">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1.5">
              Approvals Pipeline
            </h3>
            {pendingApprovals.length === 0 ? (
              <p className="text-xs text-muted-foreground/75 py-2 font-medium">No approvals pending</p>
            ) : (
              <div className="flex flex-col gap-3">
                {pendingApprovals.map((item: any) => (
                  <div key={item.id} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground truncate max-w-[130px]">{item.title}</span>
                      <Badge variant={item.status === "REVIEW" ? "warning" : "secondary"} className="text-[9px] font-bold shrink-0">
                        {item.status === "REVIEW" ? "Pending Sign-off" : "Pending Review"}
                      </Badge>
                    </div>
                    <span className="text-[10px] font-bold text-primary uppercase">{item.doc_type || "DOC"}-{item.version || "1.0"}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Context Layer 2: Attachments / References */}
          <Card className="flex flex-col gap-4 p-4.5">
            <div className="flex items-center justify-between border-b border-border pb-1.5">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Related Documents
              </h3>
              <input
                type="file"
                id="dashboard-file-uploader"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                size="sm"
                variant="minimal"
                onClick={() => document.getElementById("dashboard-file-uploader")?.click()}
                className="text-[9px] py-0.5 px-1.5 border-dashed border-primary/20 text-primary hover:bg-primary/5 flex items-center gap-1 cursor-pointer"
                disabled={uploading}
              >
                <Plus className="w-2.5 h-2.5" />
                <span>Upload</span>
              </Button>
            </div>

            {attachments.length === 0 ? (
              <p className="text-xs text-muted-foreground/75 py-2 font-medium">No files uploaded yet</p>
            ) : (
              <div className="flex flex-col gap-2 text-xs font-semibold">
                {attachments.map((file: any) => (
                  <div key={file.id} className="group flex items-center justify-between p-1.5 rounded-lg hover:bg-secondary/60 transition-colors">
                    <div
                      onClick={() => window.open(file.file_url || file.file, "_blank")}
                      className="flex items-center gap-2 overflow-hidden cursor-pointer flex-1"
                      title="Download file"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-foreground truncate max-w-[120px] hover:text-primary transition-colors">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] text-muted-foreground font-bold">{file.size_str || "0.0 KB"}</span>
                      <button
                        onClick={() => handleFileDelete(file.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-all cursor-pointer"
                        title="Delete attachment"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Context Layer 3: Activity Log & History */}
          <Card className="flex flex-col gap-4 p-4.5">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1.5">
              Workspace Activity
            </h3>
            {activities.length === 0 ? (
              <p className="text-xs text-muted-foreground/75 py-2 font-medium">No recent activities log</p>
            ) : (
              <div className="flex flex-col gap-3.5 max-h-[220px] overflow-y-auto pr-1">
                {activities.map((act: any) => (
                  <div key={act.id} className="flex items-start gap-2.5 text-[11px] leading-normal">
                    <div className="w-5 h-5 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 text-[9px] font-bold text-muted-foreground uppercase">
                      {act.user_detail?.username?.charAt(0) || "U"}
                    </div>
                    <div className="flex flex-col text-left">
                      <p className="text-foreground">
                        <span className="font-bold">{act.user_detail?.first_name || act.user_detail?.username || "Someone"}</span> {act.action}
                      </p>
                      <span className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5">{act.created_at_human || "just now"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
};
