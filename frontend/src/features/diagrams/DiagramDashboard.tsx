import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Card, Badge, Button, Input, Select, Alert } from "../../components/common/UIComponents";
import { 
  FolderGit, 
  Plus, 
  Trash2, 
  Workflow, 
  Zap, 
  Compass, 
  AlertTriangle, 
  BookOpen, 
  Activity, 
  ArrowRight,
  Grid
} from "lucide-react";

interface Diagram {
  id: string;
  name: string;
  description: string;
  diagram_type: string;
  status: "DRAFT" | "REVIEW" | "APPROVED" | "ARCHIVED";
  version: string;
  canvas_json: any;
  documentation: string;
  created_by_username: string;
  updated_at: string;
}

interface DiagramDashboardProps {
  projectId: string;
  projectName: string;
  onSelectDiagram: (id: string, type?: string) => void;
  onCreateDiagram: () => void;
}

const DIAGRAM_TYPES = [
  { value: "Business Process", label: "Business Process Diagram" },
  { value: "Use Case", label: "UML Use Case Diagram" },
  { value: "Sequence", label: "UML Sequence Diagram" },
  { value: "BPMN 2.0", label: "BPMN 2.0 Workflow" },
  { value: "ERD", label: "Entity Relationship Diagram (ERD)" },
  { value: "System Context", label: "System Context Diagram" },
  { value: "Customer Journey", label: "Customer Journey Map" },
  { value: "MERMAID", label: "AI Mermaid Diagram (Text-to-Diagram)" }
];

const SECTOR_TEMPLATES = [
  { value: "NONE", label: "Empty Canvas (Start from Scratch)" },
  { value: "E-Commerce", label: "E-Commerce Checkout & Fulfillment" },
  { value: "Banking", label: "Banking Funds Transfer Flow" },
  { value: "Healthcare", label: "Healthcare Patient Intake Workflow" },
  { value: "ERP", label: "ERP Procurement & Inventory System" },
  { value: "CRM", label: "CRM Sales Lead Pipeline Diagram" },
  { value: "HRMS", label: "HRMS Employee Onboarding BPMN" },
  { value: "Insurance", label: "Insurance Claims Settlement Process" },
  { value: "Education", label: "Student Enrollment Sequence Diagram" },
  { value: "Government", label: "Public Service Request Flow" },
  { value: "Inventory", label: "Inventory Order Reorder Loop" },
  { value: "Payment Gateway", label: "Payment Gateway API Integration Flow" },
  { value: "Loyalty Program", label: "Loyalty Reward Points Allocation" },
  { value: "Supply Chain", label: "Supply Chain Logistics Routing Map" },
  { value: "Hotel Management", label: "Hotel Room Booking State Machine" },
  { value: "Hospital Management", label: "Hospital ICU Ward Triage Process" }
];

export const DiagramDashboard: React.FC<DiagramDashboardProps> = ({
  projectId,
  projectName,
  onSelectDiagram,
  onCreateDiagram: _onCreateDiagram,
}) => {
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [requirementsCount, setRequirementsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Create Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState("BPMN 2.0");
  const [newTemplate, setNewTemplate] = useState("NONE");
  const [creating, setCreating] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const diagRes = await api.get<any, { data: Diagram[] }>(`/diagrams/?project=${projectId}`);
      setDiagrams(diagRes.data || []);
      
      const reqRes = await api.get<any, { data: any[] }>(`/requirements/?project=${projectId}`);
      setRequirementsCount(reqRes.data?.length || 0);
    } catch (err) {
      console.error("Failed to load diagrams dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [projectId]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this diagram model?")) return;
    try {
      await api.delete(`/diagrams/${id}/`);
      fetchDashboardData();
    } catch (err) {
      alert("Failed to delete diagram.");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);
    try {
      // In case template is selected, we fetch predefined structure from generator API
      let canvasJson = { nodes: [], edges: [] };
      let documentation = "";

      if (newTemplate !== "NONE") {
        const genRes = await api.post<any, { data: any }>("/diagrams/generate/", {
          project: projectId,
          diagram_type: newType,
          source_type: "FREE_TEXT",
          source_text: `Create a template for: ${newTemplate} system.`
        });
        if (genRes.data) {
          canvasJson = {
            nodes: genRes.data.nodes || [],
            edges: genRes.data.edges || [],
            // @ts-ignore
            ai_generated: true
          };
          documentation = genRes.data.documentation || "";
        }
      }

      const res = await api.post<any, { data: Diagram }>("/diagrams/", {
        project: projectId,
        name: newName,
        description: newDesc,
        diagram_type: newType,
        status: "DRAFT",
        version: "1.0",
        canvas_json: canvasJson,
        documentation: documentation
      });

      setCreateOpen(false);
      setNewName("");
      setNewDesc("");
      onSelectDiagram(res.data.id);
    } catch (err) {
      alert("Failed to create diagram model.");
    } finally {
      setCreating(false);
    }
  };

  // Compile statistics
  const totalModels = diagrams.length;
  const activeAiModels = diagrams.filter((d) => d.canvas_json?.ai_generated).length;
  const incompleteModels = diagrams.filter((d) => d.status === "DRAFT" || d.status === "REVIEW").length;
  
  // Coverage calculation
  const mappedReqs = new Set();
  diagrams.forEach((d) => {
    const nodes = d.canvas_json?.nodes || [];
    nodes.forEach((n: any) => {
      const rId = n.data?.requirementId || n.data?.requirement_id;
      if (rId) mappedReqs.add(rId);
    });
  });
  const projectCoveragePercent = requirementsCount > 0 
    ? Math.round((mappedReqs.size / requirementsCount) * 100)
    : 0;

  // Documentation Coverage: has description or custom documentation
  const documentedModels = diagrams.filter(d => d.description || d.documentation).length;
  const docCoveragePercent = totalModels > 0 ? Math.round((documentedModels / totalModels) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col gap-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5">
            <FolderGit className="w-3.5 h-3.5" />
            <span>{projectName}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Analysis Models & Business Diagrams
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Build and validate UML, BPMN, ERD, and agile user journey maps integrated with requirements.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onSelectDiagram("new-mermaid")} className="border-indigo-500/30 hover:border-indigo-500 text-indigo-400">
            <Zap className="w-3.5 h-3.5 mr-1.5" />
            New Mermaid (AI)
          </Button>
          <Button variant="outline" size="sm" onClick={() => onSelectDiagram("new-ai")} className="border-primary/20 hover:border-primary/40 text-primary">
            <Zap className="w-3.5 h-3.5 mr-1.5 text-primary" />
            AI Auto-Generate (Canvas)
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Diagram
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin mb-3"></div>
          <p className="text-xs font-semibold text-muted-foreground animate-pulse">Compiling diagrams dashboard statistics...</p>
        </div>
      ) : (
        <>
          {/* Dashboard Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="flex flex-col justify-between p-4 bg-slate-900/10 dark:bg-slate-950/20 relative overflow-hidden">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Total Diagrams</span>
                <h3 className="text-3xl font-extrabold text-foreground mt-1.5">{totalModels}</h3>
              </div>
              <div className="text-[10px] font-semibold text-muted-foreground mt-3 flex items-center gap-1">
                <Workflow className="w-3.5 h-3.5 text-indigo-500" />
                <span>Models cataloged</span>
              </div>
            </Card>

            <Card className="flex flex-col justify-between p-4 bg-slate-900/10 dark:bg-slate-950/20">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Project Coverage</span>
                <h3 className="text-3xl font-extrabold text-foreground mt-1.5">{projectCoveragePercent}%</h3>
              </div>
              <div className="text-[10px] font-semibold text-muted-foreground mt-3 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-primary" />
                <span>{mappedReqs.size}/{requirementsCount} Reqs mapped</span>
              </div>
            </Card>

            <Card className="flex flex-col justify-between p-4 bg-slate-900/10 dark:bg-slate-950/20">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">AI Generated</span>
                <h3 className="text-3xl font-extrabold text-foreground mt-1.5">{activeAiModels}</h3>
              </div>
              <div className="text-[10px] font-semibold text-muted-foreground mt-3 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                <span>AI-powered models</span>
              </div>
            </Card>

            <Card className="flex flex-col justify-between p-4 bg-slate-900/10 dark:bg-slate-950/20">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Incomplete Models</span>
                <h3 className="text-3xl font-extrabold text-foreground mt-1.5">{incompleteModels}</h3>
              </div>
              <div className="text-[10px] font-semibold text-muted-foreground mt-3 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span>Pending review/drafts</span>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Diagrams Catalog */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <h2 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-1.5">
                <Grid className="w-4 h-4 text-primary" />
                Diagrams Catalog
              </h2>

              {diagrams.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl min-h-[30vh]">
                  <p className="text-xs font-semibold text-muted-foreground">No diagrams created yet.</p>
                  <Button variant="ghost" size="sm" onClick={() => setCreateOpen(true)} className="mt-3 text-xs">
                    Create your first model
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {diagrams.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => onSelectDiagram(d.id, d.diagram_type)}
                      className="bg-card border border-border hover:border-primary/30 rounded-xl p-4 flex flex-col justify-between min-h-[140px] shadow-sm hover:shadow-md cursor-pointer transition-all hover:scale-[1.005]"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <Badge variant={
                            d.status === "APPROVED" ? "success" : d.status === "REVIEW" ? "warning" : "default"
                          }>
                            {d.status}
                          </Badge>
                          <span className="text-[10px] font-bold text-muted-foreground">v{d.version}</span>
                        </div>
                        <h4 className="font-bold text-sm text-foreground mt-2 leading-tight truncate">{d.name}</h4>
                        <p className="text-[11px] text-muted-foreground/80 mt-1 line-clamp-2 leading-relaxed">
                          {d.description || "No description provided."}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-border/40 pt-3 mt-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
                          <Activity className="w-3.5 h-3.5 text-primary" />
                          <span className="capitalize">{d.diagram_type}</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(d.id, e); }}
                          className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                          title="Delete Diagram"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Col: Quality Audits & Templates */}
            <div className="flex flex-col gap-6">
              {/* Coverage Progress Card */}
              <Card className="flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Model Integrity Scores</h3>
                
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>Requirement Traceability</span>
                      <span className="text-primary">{projectCoveragePercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${projectCoveragePercent}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>Documentation Coverage</span>
                      <span className="text-emerald-500 dark:text-emerald-400">{docCoveragePercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${docCoveragePercent}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground leading-relaxed mt-1 font-semibold flex items-start gap-1">
                  <BookOpen className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>BABOK compliance is measured based on mapping and description coverage across project requirements.</span>
                </div>
              </Card>

              {/* Quick AI Generator Pitch */}
              <Card className="bg-gradient-to-br from-indigo-900/10 via-purple-900/5 to-slate-900/10 dark:from-indigo-950/20 dark:via-purple-950/10 dark:to-card border-indigo-500/20 p-5 flex flex-col gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Zap className="w-4 h-4 fill-primary/20" />
                </div>
                <h4 className="font-extrabold text-sm text-foreground">AI Canvas Generator</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Provide standard meeting summaries, functional requirements, or user stories, and let the AI draft UML use cases or BPMN swimlane models instantly.
                </p>
                <Button 
                  onClick={() => onSelectDiagram("new-ai")} 
                  size="sm" 
                  className="mt-2 w-full flex items-center justify-center gap-1 group bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Launch AI Generator
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Creation Modal */}
      {createOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 shadow-2xl text-left">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="font-bold text-sm text-foreground">Create New Diagram Model</h3>
              <button onClick={() => setCreateOpen(false)} className="text-muted-foreground hover:text-foreground">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <Input
                label="Diagram Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Order Fulfillment Workflow"
                required
              />

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Summarize the scope of this model..."
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg bg-card border border-border text-foreground outline-none focus:border-primary min-h-[60px]"
                />
              </div>

              <Select
                label="Diagram Type"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                options={DIAGRAM_TYPES}
              />

              <Select
                label="Initialize with Template"
                value={newTemplate}
                onChange={(e) => setNewTemplate(e.target.value)}
                options={SECTOR_TEMPLATES}
              />

              {newTemplate !== "NONE" && (
                <Alert variant="info" title="AI Template Initialization">
                  Creating this model will run a quick background auto-layout to pre-populate elements for a {newTemplate} scenario.
                </Alert>
              )}

              <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
                <Button variant="ghost" size="sm" type="button" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" type="submit" isLoading={creating}>
                  Create Model
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
