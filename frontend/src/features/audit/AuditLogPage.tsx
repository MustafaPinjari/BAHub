import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { useProject } from "../projects/ProjectContext";
import { Card, Badge, Button, Select, Alert } from "../../components/common/UIComponents";
import { History, ArrowRight, User, Terminal, Calendar, ChevronDown, ChevronUp } from "lucide-react";

interface AuditChange {
  old: string | null;
  new: string | null;
}

interface AuditLogItem {
  id: string;
  project_name: string;
  user_username: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT";
  resource_type: string;
  resource_id: string;
  resource_name: string | null;
  changes: Record<string, AuditChange> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface PaginationMeta {
  count: number;
  next: string | null;
  previous: string | null;
  current_page: number;
  total_pages: number;
}

export const AuditLogPage: React.FC = () => {
  const { activeProject } = useProject();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [actionFilter, setActionFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState(activeProject?.id || "");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Re-sync project filter if active project changes
  useEffect(() => {
    if (activeProject) {
      setProjectFilter(activeProject.id);
    } else {
      setProjectFilter("");
    }
    setPage(1);
  }, [activeProject]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = { page };
      if (actionFilter) params.action = actionFilter;
      if (resourceFilter) params.resource_type = resourceFilter;
      if (projectFilter) params.project = projectFilter;

      const response = await api.get("/audit/logs/", { params });
      
      // DRF with StandardResultsSetPagination returns wrapped payload: { success: true, data: [...], meta: {...} }
      if (response.data && response.data.success) {
        setLogs(response.data.data);
        setMeta(response.data.meta);
      } else {
        setLogs([]);
        setMeta(null);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to load audit logs. Please ensure you are authenticated.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, resourceFilter, projectFilter, page]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE":
        return <Badge variant="success">CREATE</Badge>;
      case "UPDATE":
        return <Badge variant="default">UPDATE</Badge>;
      case "DELETE":
        return <Badge variant="destructive">DELETE</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  const toggleExpandLog = (id: string) => {
    if (expandedLogId === id) {
      setExpandedLogId(null);
    } else {
      setExpandedLogId(id);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto w-full text-foreground select-none">
      {/* Header */}
      <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Audit logs</h1>
            <p className="text-xs text-muted-foreground">
              Trace workspace modifications, resource creations, updates, and soft deletes.
            </p>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card/60 backdrop-blur-sm border-border">
        <Select
          label="Filter by Action"
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          options={[
            { value: "", label: "All Actions" },
            { value: "CREATE", label: "CREATE" },
            { value: "UPDATE", label: "UPDATE" },
            { value: "DELETE", label: "DELETE" }
          ]}
        />
        <Select
          label="Filter by Resource"
          value={resourceFilter}
          onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }}
          options={[
            { value: "", label: "All Resources" },
            { value: "Requirement", label: "Requirement" },
            { value: "UserStory", label: "User Story" },
            { value: "Risk", label: "Risk" },
            { value: "Stakeholder", label: "Stakeholder" },
            { value: "Project", label: "Project" },
            { value: "Meeting", label: "Meeting" }
          ]}
        />
        <div className="flex flex-col gap-1 text-left">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none mb-0.5">
            Scope Context
          </label>
          <div className="py-2.5 px-3 text-xs bg-secondary/40 border border-border rounded-lg font-semibold text-muted-foreground flex items-center justify-between">
            <span>{activeProject ? `Project: ${activeProject.name}` : "Organization-wide"}</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-[9px] px-1.5 uppercase font-bold"
              onClick={() => { setProjectFilter(""); setPage(1); }}
              disabled={!projectFilter}
            >
              Show All
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {error && <Alert variant="destructive">{error}</Alert>}

      {/* List Container */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Terminal className="w-8 h-8 animate-pulse" />
            <span className="text-xs font-semibold">Loading audit entries...</span>
          </div>
        ) : logs.length === 0 ? (
          <Card className="flex flex-col items-center justify-center text-center py-16 gap-2 border-dashed border-border/80">
            <History className="w-8 h-8 text-muted-foreground/50" />
            <h3 className="text-sm font-bold text-foreground">No audit entries found</h3>
            <p className="text-xs text-muted-foreground max-w-xs">
              No matching activity records exist for the selected filters in this project scope.
            </p>
          </Card>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const changesList = log.changes ? Object.entries(log.changes) : [];

            return (
              <Card key={log.id} className="p-4 flex flex-col gap-3 transition-all duration-150 border-border/80 hover:border-primary/20">
                {/* Collapsed Header */}
                <div 
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer"
                  onClick={() => toggleExpandLog(log.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getActionBadge(log.action)}</div>
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          {log.user_username}
                        </span>
                        <span className="text-xs text-muted-foreground">mutated</span>
                        <span className="text-xs font-bold text-primary bg-primary/5 border border-primary/10 px-1.5 py-0.5 rounded">
                          {log.resource_type}
                        </span>
                        {log.resource_name && (
                          <span className="text-xs font-bold text-foreground">
                            &ldquo;{log.resource_name}&rdquo;
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1.5 font-semibold">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(log.created_at)}
                        </span>
                        <span>•</span>
                        <span>IP: {log.ip_address || "system"}</span>
                        {log.project_name && (
                          <>
                            <span>•</span>
                            <span>Project: {log.project_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {changesList.length > 0 && (
                    <button className="text-muted-foreground/60 hover:text-foreground shrink-0 self-end md:self-center transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {/* Expanded Changes Diff */}
                {isExpanded && changesList.length > 0 && (
                  <div className="mt-1 pt-3 border-t border-border flex flex-col gap-2.5 animate-fadeIn">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-left">
                      Field mutations deltas
                    </div>
                    <div className="w-full overflow-hidden border border-border rounded-lg bg-secondary/20">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-secondary/40 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <th className="p-2 w-1/4">Field</th>
                            <th className="p-2 w-3/8">Old Value</th>
                            <th className="p-2 w-3/8">New Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {changesList.map(([field, delta]) => (
                            <tr key={field} className="border-b border-border/65 last:border-none font-semibold">
                              <td className="p-2 font-mono text-[10px] text-indigo-500 font-bold">{field}</td>
                              <td className="p-2 text-red-500 bg-red-500/5 line-through whitespace-pre-wrap break-all max-w-[200px]">
                                {delta.old !== null ? delta.old : <span className="opacity-45 italic">(none)</span>}
                              </td>
                              <td className="p-2 text-emerald-600 bg-emerald-500/5 whitespace-pre-wrap break-all max-w-[200px]">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {delta.old !== null && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />}
                                  <span>{delta.new !== null ? delta.new : <span className="opacity-45 italic">(none)</span>}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
          <span className="text-xs text-muted-foreground font-semibold">
            Showing Page <strong className="text-foreground">{meta.current_page}</strong> of{" "}
            <strong className="text-foreground">{meta.total_pages}</strong> ({meta.count} total records)
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!meta.previous || loading}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
              disabled={!meta.next || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
