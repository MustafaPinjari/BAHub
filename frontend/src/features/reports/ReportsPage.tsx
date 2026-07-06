import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Card, Badge, Alert } from "../../components/common/UIComponents";
import { useProject } from "../projects/ProjectContext";
import { 
  FileText, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  FolderGit
} from "lucide-react";


interface ReportData {
  requirements: {
    total: number;
    by_status: Record<string, number>;
    by_category: Record<string, number>;
  };
  stories: {
    total: number;
    by_status: Record<string, number>;
    total_points: number;
  };
  risks: {
    total: number;
    by_probability: Record<string, number>;
    by_impact: Record<string, number>;
    by_status: Record<string, number>;
  };
  changes: {
    total: number;
    by_status: Record<string, number>;
  };
  meetings: {
    total: number;
    action_items_total: number;
    action_items_open: number;
    action_items_completed: number;
  };
}

export const ReportsPage: React.FC = () => {
  const { activeProject } = useProject();

  // States
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    if (!activeProject) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<any, { data: ReportData }>(`/projects/${activeProject.id}/report/`);
      setReport(res.data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to compile project reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeProject]);

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
            Select a project context from the Projects list page before generating strategic metric reports.
          </p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 select-none">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
        <span className="text-xs text-muted-foreground font-semibold">Compiling project dashboard metrics...</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-xl mx-auto mt-10">
        <Alert variant="destructive">{error || "No report metrics compiled."}</Alert>
      </div>
    );
  }

  // Pre-calculate percentages for beautiful custom bar rendering
  const getPercentage = (value: number, total: number) => {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 select-none text-foreground text-left">
      {/* Header Context */}
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Project Reports</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Strategic metrics compilation for {activeProject.name}.
        </p>
      </div>

      {/* 4 Summary Cards at the top */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Requirements summary */}
        <Card className="p-4 flex items-center gap-4 bg-card border border-border">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-foreground leading-none">{report.requirements.total}</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              Requirements
            </span>
          </div>
        </Card>

        {/* User Stories summary */}
        <Card className="p-4 flex items-center gap-4 bg-card border border-border">
          <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 border border-indigo-500/20 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-foreground leading-none">
              {report.stories.total_points}
            </span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              Agile Story Points ({report.stories.total} US)
            </span>
          </div>
        </Card>

        {/* Open Tasks summary */}
        <Card className="p-4 flex items-center gap-4 bg-card border border-border">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-500/20 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-foreground leading-none">
              {report.meetings.action_items_completed}/{report.meetings.action_items_total}
            </span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              Tasks Completed ({report.meetings.total} Meetings)
            </span>
          </div>
        </Card>

        {/* Change Request / Risks Summary */}
        <Card className="p-4 flex items-center gap-4 bg-card border border-border">
          <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500 border border-rose-500/20 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-foreground leading-none">
              {report.risks.total}
            </span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              Logged Risks ({report.changes.total} CRs)
            </span>
          </div>
        </Card>
      </div>

      {/* Main Details Board */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Requirements status & category distributions */}
        <Card className="p-5 flex flex-col gap-4 border border-border bg-card">
          <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-2">
            Requirements Pipeline
          </h3>
          
          <div className="flex flex-col gap-3">
            <span className="text-[11px] font-bold text-foreground uppercase">Status Breakdown</span>
            {["DRAFT", "REVIEW", "APPROVED", "REJECTED"].map(statusKey => {
              const count = report.requirements.by_status[statusKey] || 0;
              const pct = getPercentage(count, report.requirements.total);
              return (
                <div key={statusKey} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">{statusKey.replace("_", " ")}</span>
                    <span className="text-foreground">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        statusKey === "APPROVED" ? "bg-emerald-500" :
                        statusKey === "REJECTED" ? "bg-rose-500" :
                        statusKey === "REVIEW" ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <span className="text-[11px] font-bold text-foreground uppercase">Category Distribution</span>
            <div className="flex flex-wrap gap-2">
              {Object.keys(report.requirements.by_category).length === 0 ? (
                <span className="text-xs text-muted-foreground/60 italic">No category tags applied.</span>
              ) : (
                Object.entries(report.requirements.by_category).map(([cat, val]) => (
                  <Badge key={cat} variant="secondary" className="text-[9px] font-bold py-1 px-2.5 bg-secondary text-foreground border border-border">
                    {cat}: {val}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </Card>

        {/* User Stories Sprint Pipeline status */}
        <Card className="p-5 flex flex-col gap-4 border border-border bg-card">
          <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-2">
            Agile User Stories Pipeline
          </h3>

          <div className="flex flex-col gap-3">
            <span className="text-[11px] font-bold text-foreground uppercase font-sans">Sprint Workflow Status</span>
            {["TODO", "IN_PROGRESS", "TESTING", "DONE"].map(statusKey => {
              const count = report.stories.by_status[statusKey] || 0;
              const pct = getPercentage(count, report.stories.total);
              return (
                <div key={statusKey} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">{statusKey.replace("_", " ")}</span>
                    <span className="text-foreground">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        statusKey === "DONE" ? "bg-emerald-500" :
                        statusKey === "TESTING" ? "bg-indigo-500" :
                        statusKey === "IN_PROGRESS" ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Risks Heatmap counts */}
        <Card className="p-5 flex flex-col gap-4 border border-border bg-card">
          <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-2">
            Risks Matrix Summary
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">Probability Metrics</span>
              {["HIGH", "MEDIUM", "LOW"].map(p => (
                <div key={p} className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-foreground text-[11px]">{p}</span>
                  <Badge variant={p === "HIGH" ? "destructive" : p === "MEDIUM" ? "default" : "secondary"} className="text-[9px] font-bold py-0.5 px-2">
                    {report.risks.by_probability[p] || 0}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">Impact Metrics</span>
              {["HIGH", "MEDIUM", "LOW"].map(i => (
                <div key={i} className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted-foreground text-[11px]">{i}</span>
                  <Badge variant={i === "HIGH" ? "destructive" : i === "MEDIUM" ? "default" : "secondary"} className="text-[9px] font-bold py-0.5 px-2">
                    {report.risks.by_impact[i] || 0}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Change Request Pipeline status summary */}
        <Card className="p-5 flex flex-col gap-4 border border-border bg-card">
          <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-2">
            Scope Change Control (CRs)
          </h3>

          <div className="flex flex-col gap-3">
            {["DRAFT", "REVIEW", "APPROVED", "REJECTED"].map(statusKey => {
              const count = report.changes.by_status[statusKey] || 0;
              const pct = getPercentage(count, report.changes.total);
              return (
                <div key={statusKey} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">{statusKey.replace("_", " ")}</span>
                    <span className="text-foreground">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        statusKey === "APPROVED" ? "bg-emerald-500" :
                        statusKey === "REJECTED" ? "bg-rose-500" :
                        statusKey === "REVIEW" ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

      </div>
    </div>
  );
};
