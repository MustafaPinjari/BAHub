import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Badge, Button } from "../../components/common/UIComponents";
import { DataTable } from "../../components/common/DataTable";
import type { Column } from "../../components/common/DataTable";
import { DocumentEditor } from "./components/DocumentEditor";
import { DashboardSkeleton } from "../../components/common/SkeletonLoader";
import { api } from "../../services/api";
import { logger } from "../../utils/logger";
import { useAuth } from "../auth/AuthContext";
import { useProject } from "../projects/ProjectContext";
import {
  Clock,
  FolderGit,
  ChevronsUpDown,
  Paperclip,
  Plus,
  Trash2,
  AlertCircle,
  Shield,
  Activity,
  FileText,
  CheckCircle2,
  Users,
  UserCheck,
  Building
} from "lucide-react";

export const DashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const { activeProject } = useProject();
  const navigate = useNavigate();

  // Dynamic States
  const [backlogData, setBacklogData] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch all dashboard data for active project in parallel
  const fetchDashboardData = async () => {
    if (!activeProject?.id) return;
    setLoading(true);
    try {
      const [reqsRes, docsRes, attachRes, actRes] = await Promise.all([
        api.get<any, { data: any[] }>(`/requirements/?project=${activeProject.id}`),
        api.get<any, { data: any[] }>(`/documents/?project=${activeProject.id}`),
        api.get<any, { data: any[] }>(`/projects/attachments/?project=${activeProject.id}`),
        api.get<any, { data: any[] }>(`/projects/activities/?project=${activeProject.id}`)
      ]);

      setBacklogData(reqsRes.data || []);
      setDocuments(docsRes.data || []);
      setAttachments(attachRes.data || []);
      setActivities(actRes.data || []);
    } catch (e) {
      logger.error("Failed to load dashboard statistics", { error: e });
    } finally {
      setLoading(false);
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
      fetchDashboardData();
    } catch (err) {
      logger.error("Failed to upload attachment file", { error: err });
    } finally {
      setUploading(false);
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
      logger.error("Failed to delete attachment", { error: err });
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

  // Calculate metrics
  const totalReqs = backlogData.length;
  const approvedReqs = backlogData.filter((r: any) => r.status === "APPROVED" || r.status === "SIGNED_OFF").length;
  const draftReqs = backlogData.filter((r: any) => r.status === "DRAFT").length;
  const complianceRate = totalReqs > 0 ? ((approvedReqs / totalReqs) * 100).toFixed(0) : "100";
  const pendingDocsCount = documents.filter((doc: any) => doc.status === "REVIEW").length;
  const brdCount = documents.filter((d: any) => d.doc_type === "BRD").length;
  const frdCount = documents.filter((d: any) => d.doc_type === "FRD").length;

  const isAdmin = user?.role === "ADMIN";

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
          ROLE-BASED WELCOME HEADER CARD
          ========================================== */}
      {loading ? (
        <DashboardSkeleton />
      ) : isAdmin ? (
        // Admin Welcome Card
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-secondary/30 p-8 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-6 select-none shadow-2xl">
          {/* Subtle Ambient Light */}
          <div className="absolute top-[-100px] right-[-100px] w-64 h-64 rounded-full bg-primary/10 blur-[80px] pointer-events-none" />
          <div className="flex flex-col text-left gap-1.5 z-10">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-primary/15 text-primary border border-primary/25 font-bold uppercase tracking-wider text-[9px] px-2 py-0.5">
                Administrator Portal
              </Badge>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white mt-1">Welcome, {user?.first_name || user?.username}!</h1>
            <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
              Manage organization compliance, authorize spec sign-offs, and audit system activities. Currently viewing stats for <strong>{user?.organization_name || "Apex Business Solutions"}</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 z-10">
            <Button size="sm" variant="outline" onClick={() => navigate("/settings")} className="text-[10px] bg-slate-900/50 hover:bg-slate-900 border-white/10 hover:border-white/20 text-white font-bold">
              Organization Directory
            </Button>
            <Button size="sm" onClick={() => navigate("/audit")} className="text-[10px] font-bold">
              Export Audit Trail
            </Button>
          </div>
        </div>
      ) : (
        // Business Analyst Welcome Card
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-secondary/30 p-8 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-6 select-none shadow-2xl">
          {/* Subtle Ambient Light */}
          <div className="absolute top-[-100px] right-[-100px] w-64 h-64 rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none" />
          <div className="flex flex-col text-left gap-1.5 z-10">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold uppercase tracking-wider text-[9px] px-2 py-0.5">
                Business Analyst Portal
              </Badge>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white mt-1">Welcome, {user?.first_name || user?.username}!</h1>
            <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
              Author and compile requirements, refine specifications, and manage related project assets. Your live synchronization channel is active.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 z-10">
            <Button size="sm" variant="outline" onClick={() => navigate("/brd")} className="text-[10px] bg-slate-900/50 hover:bg-slate-900 border-white/10 hover:border-white/20 text-white font-bold">
              Generate Spec Docs
            </Button>
            <Button size="sm" onClick={() => navigate("/requirements")} className="text-[10px] font-bold">
              Add Requirement
            </Button>
          </div>
        </div>
      )}

      {/* ==========================================
          ROLE-BASED METRICS GRID
          ========================================== */}
      {isAdmin ? (
        // Admin Statistics
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 select-none">
          <Card className="flex flex-col p-5 gap-2.5 text-left border-white/[0.06] bg-secondary/30 hover:scale-[1.01] hover:border-indigo-500/30 transition-all duration-200 cursor-default relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-indigo-500/[0.01] blur-xl pointer-events-none group-hover:bg-indigo-500/[0.03] transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Compliance Rate</span>
              <div className="w-7 h-7 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <Shield className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-2xl font-black text-foreground leading-none">{complianceRate}%</span>
            <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden mt-1 border border-white/[0.04]">
              <div className="bg-indigo-500 h-full rounded-full transition-all duration-300" style={{ width: `${complianceRate}%` }} />
            </div>
            <span className="text-[9px] text-muted-foreground font-semibold">Approved requirements count</span>
          </Card>
          
          <Card className="flex flex-col p-5 gap-2.5 text-left border-white/[0.06] bg-secondary/30 hover:scale-[1.01] hover:border-amber-500/30 transition-all duration-200 cursor-default relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-amber-500/[0.01] blur-xl pointer-events-none group-hover:bg-amber-500/[0.03] transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pending Sign-Off</span>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border ${pendingDocsCount > 0 ? 'bg-amber-500/15 border-amber-500/25 text-amber-400' : 'bg-amber-500/10 border-amber-500/15 text-amber-500/70'}`}>
                <UserCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-2xl font-black text-foreground leading-none">{pendingDocsCount}</span>
            <span className="text-[9px] text-muted-foreground font-semibold">Documents awaiting approval</span>
          </Card>

          <Card className="flex flex-col p-5 gap-2.5 text-left border-white/[0.06] bg-secondary/30 hover:scale-[1.01] hover:border-purple-500/30 transition-all duration-200 cursor-default relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-purple-500/[0.01] blur-xl pointer-events-none group-hover:bg-purple-500/[0.03] transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Teams</span>
              <div className="w-7 h-7 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-2xl font-black text-foreground leading-none">2</span>
            <span className="text-[9px] text-muted-foreground font-semibold">Assigned workspace units</span>
          </Card>

          <Card className="flex flex-col p-5 gap-2.5 text-left border-white/[0.06] bg-secondary/30 hover:scale-[1.01] hover:border-rose-500/30 transition-all duration-200 cursor-default relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-rose-500/[0.01] blur-xl pointer-events-none group-hover:bg-rose-500/[0.03] transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Project Files</span>
              <div className="w-7 h-7 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Paperclip className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-2xl font-black text-foreground leading-none">{attachments.length}</span>
            <span className="text-[9px] text-muted-foreground font-semibold">Total workspace resource links</span>
          </Card>
        </div>
      ) : (
        // Analyst Statistics
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 select-none">
          <Card className="flex flex-col p-5 gap-2.5 text-left border-white/[0.06] bg-secondary/30 hover:scale-[1.01] hover:border-emerald-500/30 transition-all duration-200 cursor-default relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-emerald-500/[0.01] blur-xl pointer-events-none group-hover:bg-emerald-500/[0.03] transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Backlog Coverage</span>
              <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-2xl font-black text-foreground leading-none">
              {approvedReqs}/{totalReqs}
            </span>
            <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden mt-1 border border-white/[0.04]">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${totalReqs > 0 ? (approvedReqs / totalReqs) * 100 : 0}%` }} />
            </div>
            <span className="text-[9px] text-muted-foreground font-semibold">Approved vs Total requirements</span>
          </Card>

          <Card className="flex flex-col p-5 gap-2.5 text-left border-white/[0.06] bg-secondary/30 hover:scale-[1.01] hover:border-primary/30 transition-all duration-200 cursor-default relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-primary/[0.01] blur-xl pointer-events-none group-hover:bg-primary/[0.03] transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Specs Generated</span>
              <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <FileText className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-2xl font-black text-foreground leading-none">{documents.length}</span>
            <span className="text-[9px] text-muted-foreground font-semibold">{brdCount} BRD • {frdCount} FRD compiled</span>
          </Card>

          <Card className="flex flex-col p-5 gap-2.5 text-left border-white/[0.06] bg-secondary/30 hover:scale-[1.01] hover:border-amber-500/30 transition-all duration-200 cursor-default relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-amber-500/[0.01] blur-xl pointer-events-none group-hover:bg-amber-500/[0.03] transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Draft Items</span>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border ${draftReqs > 0 ? 'bg-amber-500/15 border-amber-500/25 text-amber-400' : 'bg-amber-500/10 border-amber-500/15 text-amber-500/70'}`}>
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-2xl font-black text-foreground leading-none">{draftReqs}</span>
            <span className="text-[9px] text-muted-foreground font-semibold">{draftReqs > 0 ? "Awaiting review & submission" : "All specifications approved!"}</span>
          </Card>

          <Card className="flex flex-col p-5 gap-2.5 text-left border-white/[0.06] bg-secondary/30 hover:scale-[1.01] hover:border-purple-500/30 transition-all duration-200 cursor-default relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-purple-500/[0.01] blur-xl pointer-events-none group-hover:bg-purple-500/[0.03] transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Actions</span>
              <div className="w-7 h-7 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Activity className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-2xl font-black text-foreground leading-none">{activities.length}</span>
            <span className="text-[9px] text-muted-foreground font-semibold">Logged changes & activities</span>
          </Card>
        </div>
      )}

      {/* ==========================================
          THREE-COLUMN/LAYER GRID SYSTEM
          ========================================== */}
      {isAdmin ? (
        // ==========================================
        // ADMIN DASHBOARD CONTENT SPLIT
        // ==========================================
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left Side: Compliance and Review Hub (75% width) */}
          <div className="w-full lg:w-[75%] flex flex-col gap-6">
            
            {/* Spec Approvals Quick-Control Console */}
            <Card className="flex flex-col p-5 gap-5 text-left select-none">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="flex flex-col gap-0.5">
                  <h3 className="font-bold text-sm text-foreground">Pending Sign-off Console</h3>
                  <span className="text-[10px] text-muted-foreground font-semibold">Authorize and certify compiled specifications for engineering handover.</span>
                </div>
                <Badge variant="warning">{pendingApprovals.length} Documents</Badge>
              </div>

              {pendingApprovals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 border border-dashed border-border rounded-xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  <p className="text-xs font-semibold text-foreground">All specifications are currently aligned and authorized!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {pendingApprovals.map((doc: any) => (
                    <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border border-border rounded-xl bg-card hover:bg-secondary/40 transition-colors gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shrink-0 mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-xs text-foreground leading-snug">{doc.title}</span>
                          <span className="text-[9px] text-muted-foreground font-bold uppercase mt-1">
                            Type: {doc.doc_type || "BRD"} • Version: {doc.version || "1.0"} • Project Context: {activeProject.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Button size="sm" variant="outline" className="text-[10px] py-1 font-bold">Reject</Button>
                        <Button size="sm" className="text-[10px] py-1 font-bold flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          <span>Approve & Sign</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* System Audit logs (Full width backlog spreadsheet equivalent) */}
            <div className="flex flex-col gap-2.5">
              <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-left">
                System Audit Trail & History
              </h2>
              <DataTable
                columns={[
                  {
                    key: "user",
                    label: "Operated By",
                    sortable: true,
                    render: (row) => (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center text-[9px] font-bold text-muted-foreground uppercase shrink-0">
                          {row.user_detail?.username?.charAt(0) || "U"}
                        </div>
                        <span className="font-bold text-foreground">{row.user_detail?.first_name || row.user_detail?.username || "System"}</span>
                      </div>
                    )
                  },
                  {
                    key: "action",
                    label: "Action Performed",
                    sortable: true,
                    render: (row) => <span className="font-medium text-foreground">{row.action}</span>
                  },
                  {
                    key: "time",
                    label: "Timestamp",
                    sortable: true,
                    render: (row) => <span className="font-semibold text-muted-foreground uppercase text-[10px]">{row.created_at_human || "Just now"}</span>
                  }
                ]}
                data={activities}
                searchPlaceholder="Search audit logs..."
                searchKeys={["action", "user_detail.username", "user_detail.first_name"]}
              />
            </div>
          </div>

          {/* Right Side: Context Panel (25% width) */}
          <div className="w-full lg:w-[25%] lg:sticky lg:top-5 flex flex-col gap-5 select-none">
            
            {/* Organization Metadata Widget */}
            <Card className="flex flex-col gap-5 p-5 text-left">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-500" />
                <span>Organization Identity</span>
              </h3>
              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground">Workspace Name</span>
                  <span className="font-semibold text-foreground">{user?.organization_name || "Apex Business Solutions"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground">Registered Email</span>
                  <span className="font-semibold text-foreground">apex-workspace@bahub.local</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground">System Location</span>
                  <span className="font-semibold text-foreground">Tech City, USA</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground">Timezone</span>
                  <span className="font-semibold text-foreground">Coordinated Universal Time (UTC)</span>
                </div>
              </div>
            </Card>

            {/* Files & references */}
            <Card className="flex flex-col gap-4 p-5 text-left">
              <div className="flex items-center justify-between border-b border-border pb-1.5">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  System Reference Assets
                </h3>
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
                        <Paperclip className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="text-foreground truncate max-w-[120px] hover:text-primary transition-colors">{file.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] text-muted-foreground font-bold">{file.size_str || "0.0 KB"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : (
        // ==========================================
        // BUSINESS ANALYST DASHBOARD CONTENT SPLIT
        // ==========================================
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Left Side: Primary Work Area (75% width) */}
          <div className="w-full lg:w-[75%] flex flex-col gap-6">
            
            {/* Notion-Style Split View Workspace */}
            <div className="flex flex-col gap-2">
              <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-left">
                Document Workspace
              </h2>
              <DocumentEditor activeProject={activeProject} onSave={fetchDashboardData} />
            </div>

            {/* Spreadsheet-Style Backlog Table */}
            <div className="flex flex-col gap-2.5">
              <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-left">
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
            <Card className="flex flex-col gap-4 p-5 text-left">
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
            <Card className="flex flex-col gap-4 p-5 text-left">
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
            <Card className="flex flex-col gap-4 p-5 text-left">
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
      )}
    </div>
  );
};
