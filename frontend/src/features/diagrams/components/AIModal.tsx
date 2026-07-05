import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { Button, Select, Alert, Card } from "../../../components/common/UIComponents";
import { 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  Cpu,
  Info
} from "lucide-react";

interface AIModalProps {
  projectId: string;
  diagramId: string | null;
  canvasJson: any;
  documentation: string;
  onClose: () => void;
  onGenerateSuccess: (generatedData: { nodes: any[]; edges: any[]; documentation: string }) => void;
}

const CONTEXT_TYPES = [
  { value: "FREE_TEXT", label: "Free Text / User Prompt" },
  { value: "REQUIREMENT", label: "Project Requirement Log" },
  { value: "STORY", label: "Agile User Story Specification" },
  { value: "MEETING", label: "Meeting Minutes Summary" },
  { value: "RISK", label: "Project Risk Detail" },
  { value: "GAP", label: "Strategic Gap Analysis" }
];

const DIAGRAM_TYPES = [
  { value: "Business Process", label: "Business Process Diagram" },
  { value: "Use Case", label: "UML Use Case Diagram" },
  { value: "Sequence", label: "UML Sequence Diagram" },
  { value: "BPMN 2.0", label: "BPMN 2.0 Workflow" },
  { value: "ERD", label: "Entity Relationship Diagram (ERD)" },
  { value: "System Context", label: "System Context Diagram" },
  { value: "Customer Journey", label: "Customer Journey Map" }
];

export const AIModal: React.FC<AIModalProps> = ({
  projectId,
  diagramId,
  canvasJson,
  documentation,
  onClose,
  onGenerateSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<"generate" | "validate">("generate");

  // AI Gen States
  const [contextType, setContextType] = useState("FREE_TEXT");
  const [diagramType, setDiagramType] = useState("BPMN 2.0");
  const [sourceId, setSourceId] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [generating, setGenerating] = useState(false);

  // Entities list loader
  const [entityList, setEntityList] = useState<any[]>([]);

  // Validation States
  const [validating, setValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<any>(null);

  // Load contextual list on selection change
  useEffect(() => {
    const loadEntities = async () => {
      setSourceId("");
      if (contextType === "FREE_TEXT") return;

      let url = "";
      if (contextType === "REQUIREMENT") url = `/requirements/?project=${projectId}`;
      else if (contextType === "STORY") url = `/stories/?project=${projectId}`;
      else if (contextType === "RISK") url = `/risks/?project=${projectId}`;
      else if (contextType === "MEETING") url = `/meetings/?project=${projectId}`;
      else if (contextType === "GAP") url = `/strategic/gap-analyses/?project=${projectId}`;

      try {
        const res = await api.get<any, { data: any[] }>(url);
        // Map lists
        const mapped = (res.data || []).map((item: any) => ({
          value: item.id,
          label: item.title || item.req_id || item.story_id || item.name || "Unnamed Item"
        }));
        setEntityList(mapped);
      } catch (err) {
        console.warn("Failed to load context choices:", err);
      }
    };
    loadEntities();
  }, [contextType, projectId]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const res = await api.post<any, { data: any }>("/diagrams/generate/", {
        project: projectId,
        diagram_type: diagramType,
        source_type: contextType,
        source_id: sourceId || undefined,
        source_text: sourceText
      });

      if (res.data) {
        onGenerateSuccess({
          nodes: res.data.nodes || [],
          edges: res.data.edges || [],
          documentation: res.data.documentation || ""
        });
        alert("Diagram generated and loaded successfully!");
        onClose();
      }
    } catch (err) {
      alert("Failed to auto-generate diagram.");
    } finally {
      setGenerating(false);
    }
  };

  const handleValidate = async () => {
    if (!diagramId) {
      // Offline local evaluation if not saved yet
      alert("Please save the diagram once before running compliance audits.");
      console.debug("Unsaved canvas state:", canvasJson, documentation);
      return;
    }
    setValidating(true);
    try {
      const res = await api.post<any, { data: any }>(`/diagrams/${diagramId}/validate/`);
      setValidationResults(res.data);
    } catch (err) {
      alert("Validation check failed.");
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4 shadow-2xl text-left max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-border/40">
          <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary fill-primary/15" />
            <span>AI Modeling Assistant</span>
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-secondary/40 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("generate")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "generate" 
                ? "bg-card text-foreground shadow-sm border border-border" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            ✨ Auto-Generate Diagram
          </button>
          <button
            onClick={() => setActiveTab("validate")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "validate" 
                ? "bg-card text-foreground shadow-sm border border-border" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            📋 Compliance Audit & Scores
          </button>
        </div>

        {/* Tab contents */}
        {activeTab === "generate" ? (
          <form onSubmit={handleGenerate} className="flex flex-col gap-4">
            <Select
              label="Diagram Output Type"
              value={diagramType}
              onChange={(e) => setDiagramType(e.target.value)}
              options={DIAGRAM_TYPES}
            />

            <Select
              label="Source Context Source"
              value={contextType}
              onChange={(e) => setContextType(e.target.value)}
              options={CONTEXT_TYPES}
            />

            {contextType !== "FREE_TEXT" && (
              <Select
                label="Select Context Item"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                options={[{ value: "", label: "Select mapping..." }, ...entityList]}
                required
              />
            )}

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                Instruction Details / Raw Context Text
              </label>
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder={
                  contextType === "FREE_TEXT" 
                    ? "Provide details like: 'Create a flow for a client registering at a clinic with receptionist validations and doctor queues...'"
                    : "Add any specific instructions for the AI generation..."
                }
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg bg-card border border-border text-foreground outline-none focus:border-primary min-h-[90px] leading-relaxed"
                required={contextType === "FREE_TEXT"}
              />
            </div>

            <Alert variant="info" title="AI Modeling Guidelines">
              The AI will construct nodes, coordinates, links, and write Purpose and Scope documentation adhering to BABOK and UML guidelines.
            </Alert>

            <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
              <Button variant="ghost" size="sm" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button size="sm" type="submit" isLoading={generating}>
                Generate Model Elements
              </Button>
            </div>
          </form>
        ) : (
          // Validation panel
          <div className="flex flex-col gap-4 text-left">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="font-extrabold text-xs text-foreground">Compliance check</h4>
                <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">
                  Analyze diagrams structure, isolated blocks, duplicates, and requirements coverage.
                </p>
              </div>
              <Button size="sm" onClick={handleValidate} isLoading={validating}>
                Run Audit Check
              </Button>
            </div>

            {validationResults ? (
              <div className="flex flex-col gap-4">
                {/* Scores */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-3 bg-secondary/20 flex flex-col justify-between items-center text-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Completeness Score</span>
                    <h3 className={`text-2xl font-extrabold mt-1.5 ${
                      validationResults.completeness_score > 75 
                        ? "text-emerald-500" 
                        : validationResults.completeness_score > 40 
                        ? "text-amber-500" 
                        : "text-rose-500"
                    }`}>
                      {validationResults.completeness_score}%
                    </h3>
                  </Card>

                  <Card className="p-3 bg-secondary/20 flex flex-col justify-between items-center text-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">IEEE 1016 Score</span>
                    <h3 className={`text-2xl font-extrabold mt-1.5 ${
                      validationResults.compliance_score > 75 
                        ? "text-emerald-500" 
                        : validationResults.compliance_score > 40 
                        ? "text-amber-500" 
                        : "text-rose-500"
                    }`}>
                      {validationResults.compliance_score}%
                    </h3>
                  </Card>
                </div>

                {/* Validation Warnings List */}
                <div className="flex flex-col gap-2 max-h-[30vh] overflow-y-auto">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">Detected Issues ({validationResults.issues.length})</span>
                  
                  {validationResults.issues.length === 0 ? (
                    <Alert variant="success" title="All Checks Passed">
                      No structural errors or styling violations identified on the canvas. Excellent model!
                    </Alert>
                  ) : (
                    validationResults.issues.map((issue: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-2 border rounded-lg flex items-start gap-2 text-xs font-semibold ${
                          issue.severity === "ERROR" 
                            ? "bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400" 
                            : issue.severity === "WARNING"
                            ? "bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400"
                            : "bg-primary/5 border-primary/20 text-primary"
                        }`}
                      >
                        {issue.severity === "ERROR" ? (
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                        ) : (
                          <Info className="w-4 h-4 shrink-0" />
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold uppercase text-[9px]">{issue.category}</span>
                            <span className="text-[8px] opacity-75 font-bold uppercase">{issue.severity}</span>
                          </div>
                          <p className="text-[10px] mt-0.5 opacity-90 leading-relaxed font-semibold">{issue.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Recommendations */}
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">Architect Recommendations</span>
                  <div className="p-3 bg-secondary/15 border border-border/40 rounded-xl flex flex-col gap-1.5 max-h-[20vh] overflow-y-auto">
                    {validationResults.recommendations.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground italic font-semibold">No recommendations. Diagram model is fully compliant.</p>
                    ) : (
                      validationResults.recommendations.map((rec: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[10px] font-semibold text-foreground">
                          <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-secondary/10 border border-border border-dashed rounded-xl">
                <Cpu className="w-8 h-8 text-muted-foreground/60 mb-2" />
                <p className="text-[10px] text-muted-foreground italic font-semibold">Click 'Run Audit Check' to invoke the validation engines.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default AIModal;
