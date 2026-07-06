import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../services/api";
import { useProject } from "../projects/ProjectContext";
import { Card } from "../../components/common/UIComponents";
import {
  GitMerge,
  FolderGit,
  FileSpreadsheet,
  ClipboardList,
  ShieldAlert,
  FileText,
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronRight,
  Download,
  Loader2,
  AlertTriangle,
} from "lucide-react";

// ──────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────

interface Requirement {
  id: string;
  req_id: string;
  title: string;
  priority: string;
  status: string;
  req_type?: string;
}

interface Story {
  id: string;
  title: string;
  status: string;
  story_points?: number;
  requirement?: string;
}

interface Risk {
  id: string;
  title: string;
  severity?: string;
  probability?: string;
  impact?: string;
  requirement?: string;
}

interface BusinessDocument {
  id: string;
  title: string;
  doc_type: "BRD" | "FRD";
  status: string;
}

interface TraceRow {
  req: Requirement;
  stories: Story[];
  risks: Risk[];
  docs: BusinessDocument[];
}

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  APPROVED: "bg-green-500/15 text-green-400 border-green-500/20",
  SIGNED_OFF: "bg-green-600/20 text-green-300 border-green-600/25",
  DRAFT: "bg-gray-500/15 text-gray-400 border-gray-500/20",
  REVIEW: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  PENDING: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  HIGH: "bg-red-500/15 text-red-400 border-red-500/20",
  MEDIUM: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  LOW: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  CRITICAL: "bg-red-600/20 text-red-300 border-red-600/25",
  DONE: "bg-green-500/15 text-green-400 border-green-500/20",
  IN_PROGRESS: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  TODO: "bg-gray-500/15 text-gray-400 border-gray-500/20",
};

const priorityBadge = (p: string) =>
  STATUS_COLOR[p.toUpperCase()] || "bg-gray-500/15 text-gray-400 border-gray-500/20";

function exportCSV(rows: TraceRow[], projectName: string) {
  const header = ["Req ID", "Requirement", "Priority", "Status", "# Stories", "# Risks", "# Documents", "Approval"];
  const lines = rows.map((r) => [
    r.req.req_id,
    `"${r.req.title.replace(/"/g, '""')}"`,
    r.req.priority,
    r.req.status,
    r.stories.length,
    r.risks.length,
    r.docs.length,
    r.docs.some((d) => d.status === "SIGNED_OFF") ? "Signed Off" : r.docs.some((d) => d.status === "APPROVED") ? "Approved" : "Pending",
  ]);
  const csv = [header, ...lines].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `traceability-${projectName}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ──────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────

export const TraceabilityPage: React.FC = () => {
  const { activeProject } = useProject();

  const [rows, setRows] = useState<TraceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const load = useCallback(async () => {
    if (!activeProject) return;
    setLoading(true);
    setError(null);
    try {
      const pid = activeProject.id;
      const [reqRes, storyRes, riskRes, docRes] = await Promise.all([
        api.get<any, { data: Requirement[] }>(`/requirements/?project=${pid}`),
        api.get<any, { data: Story[] }>(`/stories/?project=${pid}`),
        api.get<any, { data: Risk[] }>(`/risks/?project=${pid}`),
        api.get<any, { data: BusinessDocument[] }>(`/documents/?project=${pid}`),
      ]);

      const reqs: Requirement[] = Array.isArray(reqRes.data) ? reqRes.data : [];
      const stories: Story[] = Array.isArray(storyRes.data) ? storyRes.data : [];
      const risks: Risk[] = Array.isArray(riskRes.data) ? riskRes.data : [];
      const docs: BusinessDocument[] = Array.isArray(docRes.data) ? docRes.data : [];

      // Build trace rows — link stories/risks to requirements by requirement field
      const built: TraceRow[] = reqs.map((req) => ({
        req,
        stories: stories.filter((s) => s.requirement === req.id),
        risks: risks.filter((r) => r.requirement === req.id),
        docs,  // documents cover the whole project, not individual reqs
      }));

      setRows(built);
    } catch (err: any) {
      setError("Failed to load traceability data. Ensure you have an active project selected.");
    } finally {
      setLoading(false);
    }
  }, [activeProject]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = rows.filter((r) => {
    if (filterPriority !== "ALL" && r.req.priority !== filterPriority) return false;
    if (filterStatus !== "ALL" && r.req.status !== filterStatus) return false;
    return true;
  });

  const approvalStatus = (row: TraceRow) => {
    if (row.docs.some((d) => d.status === "SIGNED_OFF")) return { label: "Signed Off", cls: STATUS_COLOR.SIGNED_OFF };
    if (row.docs.some((d) => d.status === "APPROVED")) return { label: "Approved", cls: STATUS_COLOR.APPROVED };
    return { label: "Pending", cls: STATUS_COLOR.PENDING };
  };

  // ── Empty / No Project ──────────────────────────────────────────────

  if (!activeProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <GitMerge className="w-6 h-6 text-purple-400" />
        </div>
        <h2 className="text-base font-bold text-white">No Active Project</h2>
        <p className="text-xs text-gray-500 max-w-sm">
          Select a project from the Projects page to view its traceability matrix.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <GitMerge className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <h1 className="text-sm font-bold text-white">Traceability Matrix</h1>
          </div>
          <div className="flex items-center gap-1.5 pl-9">
            <FolderGit className="w-3 h-3 text-purple-400" />
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">{activeProject.name}</span>
            <span className="text-gray-700 text-[10px]">·</span>
            <span className="text-[10px] text-gray-600 font-medium">{filtered.length} requirements</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filters */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="text-[10px] font-semibold rounded-lg border border-white/[0.08] bg-gray-900/60 text-gray-400 px-2.5 py-1.5 outline-none cursor-pointer hover:border-white/[0.16] transition-colors"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-[10px] font-semibold rounded-lg border border-white/[0.08] bg-gray-900/60 text-gray-400 px-2.5 py-1.5 outline-none cursor-pointer hover:border-white/[0.16] transition-colors"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="REVIEW">Review</option>
            <option value="APPROVED">Approved</option>
          </select>
          <button
            onClick={() => exportCSV(filtered, activeProject.name)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-gray-900/60 text-gray-400 hover:text-white hover:border-white/[0.16] text-[10px] font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3 h-3" />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-4 text-[10px] font-semibold text-gray-600">
        <div className="flex items-center gap-1.5"><FileSpreadsheet className="w-3 h-3 text-blue-400" /> Requirements</div>
        <div className="flex items-center gap-1.5"><ClipboardList className="w-3 h-3 text-violet-400" /> User Stories</div>
        <div className="flex items-center gap-1.5"><ShieldAlert className="w-3 h-3 text-red-400" /> Risks</div>
        <div className="flex items-center gap-1.5"><FileText className="w-3 h-3 text-amber-400" /> Documents</div>
        <div className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-green-400" /> Approval Status</div>
      </div>

      {/* ── State: Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-20 gap-2 text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs font-medium">Building traceability matrix…</span>
        </div>
      )}

      {/* ── State: Error ── */}
      {error && !loading && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-xs text-red-300 font-medium">{error}</p>
        </div>
      )}

      {/* ── State: Empty ── */}
      {!loading && !error && rows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-10 h-10 rounded-xl bg-gray-900 border border-white/[0.08] flex items-center justify-center">
            <GitMerge className="w-5 h-5 text-gray-600" />
          </div>
          <p className="text-xs font-semibold text-gray-500">No requirements found in this project.</p>
          <a href="/requirements" className="text-[11px] text-purple-400 hover:text-purple-300 font-bold underline underline-offset-2">
            Create your first requirement →
          </a>
        </div>
      )}

      {/* ── Matrix Table ── */}
      {!loading && filtered.length > 0 && (
        <Card className="overflow-hidden p-0">
          {/* Table Header */}
          <div className="grid grid-cols-[180px_1fr_80px_80px_80px_100px] gap-3 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.01] text-[9px] font-black uppercase tracking-widest text-gray-600 select-none">
            <span>Requirement</span>
            <span>Title</span>
            <span className="text-center flex items-center justify-center gap-1"><ClipboardList className="w-2.5 h-2.5" /> Stories</span>
            <span className="text-center flex items-center justify-center gap-1"><ShieldAlert className="w-2.5 h-2.5" /> Risks</span>
            <span className="text-center flex items-center justify-center gap-1"><FileText className="w-2.5 h-2.5" /> Docs</span>
            <span className="text-center">Approval</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((row) => {
              const isExpanded = expandedRow === row.req.id;
              const approval = approvalStatus(row);

              return (
                <div key={row.req.id}>
                  {/* Summary Row */}
                  <button
                    onClick={() => setExpandedRow(isExpanded ? null : row.req.id)}
                    className="w-full grid grid-cols-[180px_1fr_80px_80px_80px_100px] gap-3 px-4 py-3 text-left hover:bg-white/[0.025] transition-colors cursor-pointer items-center"
                  >
                    {/* Req ID */}
                    <div className="flex items-center gap-2 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 text-gray-600 shrink-0" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-gray-600 shrink-0" />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="font-mono text-[10px] font-bold text-purple-400 truncate">{row.req.req_id}</span>
                        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border inline-block mt-0.5 w-fit ${priorityBadge(row.req.priority)}`}>
                          {row.req.priority}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <span className="text-[11px] font-semibold text-gray-300 truncate">{row.req.title}</span>

                    {/* Counts */}
                    <div className="text-center">
                      <span className={`text-[11px] font-black ${row.stories.length > 0 ? "text-violet-400" : "text-gray-700"}`}>
                        {row.stories.length}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className={`text-[11px] font-black ${row.risks.length > 0 ? "text-red-400" : "text-gray-700"}`}>
                        {row.risks.length}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className={`text-[11px] font-black ${row.docs.length > 0 ? "text-amber-400" : "text-gray-700"}`}>
                        {row.docs.length}
                      </span>
                    </div>

                    {/* Approval */}
                    <div className="flex justify-center">
                      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${approval.cls}`}>
                        {approval.label}
                      </span>
                    </div>
                  </button>

                  {/* Expanded Detail Row */}
                  {isExpanded && (
                    <div className="px-10 py-3 bg-white/[0.015] border-t border-white/[0.04] grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Stories */}
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-violet-400 mb-2 flex items-center gap-1">
                          <ClipboardList className="w-2.5 h-2.5" /> User Stories
                        </p>
                        {row.stories.length === 0 ? (
                          <p className="text-[10px] text-gray-700 font-medium">No stories linked</p>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            {row.stories.map((s) => (
                              <div key={s.id} className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.status === "DONE" ? "bg-green-500" : s.status === "IN_PROGRESS" ? "bg-blue-500" : "bg-gray-600"}`} />
                                <span className="text-[10px] text-gray-400 font-medium truncate">{s.title}</span>
                                {s.story_points && (
                                  <span className="ml-auto text-[9px] font-bold text-violet-500 shrink-0">{s.story_points}sp</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Risks */}
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-red-400 mb-2 flex items-center gap-1">
                          <ShieldAlert className="w-2.5 h-2.5" /> Risks
                        </p>
                        {row.risks.length === 0 ? (
                          <p className="text-[10px] text-gray-700 font-medium">No risks linked</p>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            {row.risks.map((r) => (
                              <div key={r.id} className="flex items-center gap-2">
                                <AlertTriangle className="w-2.5 h-2.5 shrink-0 text-red-500" />
                                <span className="text-[10px] text-gray-400 font-medium truncate">{r.title}</span>
                                {(r.severity || r.impact) && (
                                  <span className={`ml-auto text-[8px] font-bold px-1 py-0.5 rounded border shrink-0 ${priorityBadge(r.severity || r.impact || "")}`}>
                                    {r.severity || r.impact}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Documents */}
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-2 flex items-center gap-1">
                          <FileText className="w-2.5 h-2.5" /> Documents
                        </p>
                        {row.docs.length === 0 ? (
                          <p className="text-[10px] text-gray-700 font-medium">No documents</p>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            {row.docs.map((d) => (
                              <div key={d.id} className="flex items-center gap-2">
                                {d.status === "SIGNED_OFF" || d.status === "APPROVED" ? (
                                  <CheckCircle className="w-2.5 h-2.5 text-green-500 shrink-0" />
                                ) : (
                                  <Circle className="w-2.5 h-2.5 text-gray-600 shrink-0" />
                                )}
                                <span className="text-[10px] text-gray-400 font-medium truncate">{d.title}</span>
                                <span className={`ml-auto text-[8px] font-bold px-1 py-0.5 rounded border shrink-0 ${STATUS_COLOR[d.status] || "bg-gray-500/15 text-gray-400 border-gray-500/20"}`}>
                                  {d.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary Footer */}
          <div className="px-4 py-2.5 border-t border-white/[0.06] bg-white/[0.01] flex items-center gap-6 text-[10px] text-gray-600 font-semibold">
            <span>{filtered.length} requirements</span>
            <span>{filtered.reduce((a, r) => a + r.stories.length, 0)} stories linked</span>
            <span>{filtered.reduce((a, r) => a + r.risks.length, 0)} risks linked</span>
            <span className="ml-auto">
              {filtered.filter((r) => r.docs.some((d) => d.status === "SIGNED_OFF" || d.status === "APPROVED")).length} approved
            </span>
          </div>
        </Card>
      )}
    </div>
  );
};
