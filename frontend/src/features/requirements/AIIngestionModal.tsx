import React, { useState } from "react";
import { api } from "../../services/api";
import { Button, Textarea, Card, Badge } from "../../components/common/UIComponents";
import { Loader2, Wand2, Check, X } from "lucide-react";
import { useProject } from "../projects/ProjectContext";
import { logger } from "../../utils/logger";

interface AIIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedRequirement {
  title: string;
  description: string;
  priority: string;
  type: string;
}

export const AIIngestionModal: React.FC<AIIngestionModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { activeProject } = useProject();
  const [step, setStep] = useState<"input" | "loading" | "review">("input");
  const [rawText, setRawText] = useState("");
  const [requirements, setRequirements] = useState<ParsedRequirement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleExtract = async () => {
    if (!rawText.trim()) return;
    setStep("loading");
    setError(null);
    try {
      const res = await api.post<any, { data: { requirements: ParsedRequirement[] } }>("/ingest/extract_requirements/", {
        text: rawText
      });
      setRequirements(res.data.requirements || []);
      setStep("review");
    } catch (err: any) {
      setError(err.message || "Failed to extract requirements. Ensure you have enough AI credits.");
      setStep("input");
      logger.error("Extraction error", err);
    }
  };

  const handleSave = async () => {
    if (!activeProject || requirements.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const mapped = requirements.map(r => ({
        title: r.title,
        description: r.description,
        priority: (r.priority || "MEDIUM").toUpperCase(),
        req_type: (r.type || "FUNCTIONAL").toUpperCase().includes("NON") ? "NON_FUNCTIONAL" : "FUNCTIONAL",
        status: "DRAFT",
        version: "1.0"
      }));

      await api.post("/requirements/bulk_create/", {
        project_id: activeProject.id,
        requirements: mapped
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to save requirements.");
      setSaving(false);
    }
  };

  const removeReq = (idx: number) => {
    setRequirements(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-3xl flex flex-col shadow-2xl border-border bg-card overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">AI Omni-Channel Ingestion</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Paste transcripts to extract requirements</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-xs font-bold border border-destructive/20">
              {error}
            </div>
          )}

          {step === "input" && (
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">Unstructured Data Source</label>
              <Textarea
                placeholder="Paste your Zoom transcript, raw notes, or legacy BRD text here..."
                className="min-h-[250px] font-mono text-xs resize-none"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground font-semibold">
                Tip: The AI will identify Functional, Non-Functional, and Business requirements automatically.
              </p>
            </div>
          )}

          {step === "loading" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-xl bg-indigo-500/30 animate-pulse"></div>
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500 relative z-10" />
              </div>
              <div className="text-center flex flex-col gap-1">
                <h3 className="text-sm font-bold text-foreground">Analyzing Transcript...</h3>
                <p className="text-xs text-muted-foreground">Extracting actors, actions, and constraints.</p>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-end">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">Extracted Requirements ({requirements.length})</label>
              </div>
              
              {requirements.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground font-semibold">
                  No requirements found in the text.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {requirements.map((req, idx) => (
                    <div key={idx} className="p-3 border border-border rounded-lg bg-secondary/10 relative group text-left">
                      <button 
                        onClick={() => removeReq(idx)}
                        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <h4 className="font-bold text-sm mb-1 pr-6">{req.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2 whitespace-pre-wrap">{req.description}</p>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-[10px] py-0">{req.priority}</Badge>
                        <Badge variant="secondary" className="text-[10px] py-0">{req.type}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={step === "loading" || saving}>
            Cancel
          </Button>
          
          {step === "input" && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleExtract}
              disabled={!rawText.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Wand2 className="w-3.5 h-3.5 mr-1.5" />
              Extract Requirements
            </Button>
          )}

          {step === "review" && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleSave}
              disabled={requirements.length === 0 || saving}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
              Import to Backlog
            </Button>
          )}
        </div>

      </Card>
    </div>
  );
};
