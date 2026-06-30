import React, { useState } from "react";
import { Button, Badge } from "../../../components/common/UIComponents";
import { 
  Sparkles, 
  FileDown, 
  CheckCircle2, 
  Share2, 
  Save, 
  ArrowRight
} from "lucide-react";

export const DocumentEditor: React.FC = () => {
  const [docContent, setDocContent] = useState({
    title: "BRD-102: Apex Payment Gateway Integration",
    scope: "Integrate third-party gateways (Stripe, PayPal) to support multi-currency checkouts.",
    flow: "1. User initiates checkout.\n2. System requests token from payment provider.\n3. Gateway returns transaction result.",
    reqs: "- REQ-1: System must support payment retries up to 3 times on transaction failures.\n- REQ-2: Transaction logs must be encrypted in transit.",
  });

  const [aiSuggestions, setAiSuggestions] = useState([
    {
      id: "ai-1",
      targetField: "reqs",
      summary: "Add transaction idempotency requirement",
      suggestion: "- REQ-3: System must validate idempotency keys for checkout requests to prevent double-charging.",
      confidence: "High Match",
    },
    {
      id: "ai-2",
      targetField: "scope",
      summary: "Specify regional support parameters",
      suggestion: "Include fallback gateways for EMEA and APAC regions to ensure high availability.",
      confidence: "Recommended",
    }
  ]);

  const [activePane, setActivePane] = useState<"editor" | "split" | "preview">("split");

  const handleApplyAi = (id: string, field: "scope" | "reqs") => {
    const item = aiSuggestions.find((s) => s.id === id);
    if (!item) return;

    setDocContent((prev) => ({
      ...prev,
      [field]: prev[field] + "\n" + item.suggestion,
    }));

    setAiSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden text-foreground">
      {/* Editor Context bar */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30 select-none">
        <div className="flex items-center gap-2">
          <Badge variant="default">v1.2</Badge>
          <span className="text-xs text-muted-foreground font-semibold">
            Last edited 5m ago by David
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button 
            variant={activePane === "editor" ? "primary" : "ghost"} 
            size="sm" 
            onClick={() => setActivePane("editor")}
            className="text-xs font-bold py-1 px-2.5"
          >
            Editor Only
          </Button>
          <Button 
            variant={activePane === "split" ? "primary" : "ghost"} 
            size="sm" 
            onClick={() => setActivePane("split")}
            className="text-xs font-bold py-1 px-2.5"
          >
            Split View (AI)
          </Button>
          <Button 
            variant={activePane === "preview" ? "primary" : "ghost"} 
            size="sm" 
            onClick={() => setActivePane("preview")}
            className="text-xs font-bold py-1 px-2.5"
          >
            Preview
          </Button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 flex overflow-hidden min-h-[350px]">
        {/* Left Side: Notion-Style Editor */}
        <div className={`flex-1 p-6 overflow-y-auto flex flex-col gap-5 ${
          activePane === "preview" ? "bg-secondary/10" : "bg-card"
        }`}>
          {activePane === "preview" ? (
            <div className="max-w-2xl mx-auto flex flex-col gap-6 prose prose-slate">
              <h1 className="text-xl font-bold text-foreground border-b border-border pb-2">
                {docContent.title}
              </h1>
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Scope</h3>
                <p className="text-sm leading-relaxed">{docContent.scope}</p>
              </div>
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Checkout Flow</h3>
                <pre className="p-3 bg-secondary text-xs rounded-lg border border-border whitespace-pre-wrap font-sans text-foreground">
                  {docContent.flow}
                </pre>
              </div>
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Functional Requirements</h3>
                <pre className="p-3 bg-secondary text-xs rounded-lg border border-border whitespace-pre-wrap font-sans text-foreground">
                  {docContent.reqs}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={docContent.title}
                onChange={(e) => setDocContent({ ...docContent, title: e.target.value })}
                className="w-full text-lg font-bold bg-transparent border-b border-transparent focus:border-border outline-none pb-1.5 focus:ring-0 text-foreground"
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  1. Scope & Objective
                </label>
                <textarea
                  value={docContent.scope}
                  onChange={(e) => setDocContent({ ...docContent, scope: e.target.value })}
                  className="w-full text-sm bg-transparent border-0 focus:ring-0 outline-none resize-none min-h-[60px] text-foreground leading-relaxed placeholder:text-muted-foreground/40"
                  placeholder="Describe project scope..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  2. User Flow Steps
                </label>
                <textarea
                  value={docContent.flow}
                  onChange={(e) => setDocContent({ ...docContent, flow: e.target.value })}
                  className="w-full text-sm bg-transparent border-0 focus:ring-0 outline-none resize-none min-h-[90px] font-mono text-foreground leading-relaxed"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  3. Functional Requirements
                </label>
                <textarea
                  value={docContent.reqs}
                  onChange={(e) => setDocContent({ ...docContent, reqs: e.target.value })}
                  className="w-full text-sm bg-transparent border-0 focus:ring-0 outline-none resize-none min-h-[100px] text-foreground leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Side: AI Split View Suggestions */}
        {activePane === "split" && (
          <div className="w-[340px] border-l border-border bg-secondary/25 p-5 overflow-y-auto flex flex-col gap-4">
            <div className="flex items-center gap-1.5 pb-2 border-b border-border">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Contextual AI Suggestions
              </span>
            </div>

            {aiSuggestions.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground font-semibold">
                No active recommendations. The editor matches best practices.
              </div>
            ) : (
              aiSuggestions.map((sug) => (
                <div 
                  key={sug.id}
                  className="p-3.5 bg-card border border-border rounded-xl shadow-sm flex flex-col gap-2.5 transition-all hover:border-primary/30"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="default" className="text-[9px] font-bold uppercase tracking-wider">
                      {sug.confidence}
                    </Badge>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground">
                      Target: {sug.targetField}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-foreground leading-tight">
                    {sug.summary}
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed bg-secondary/40 p-2 rounded-lg border border-border/60">
                    {sug.suggestion}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleApplyAi(sug.id, sug.targetField as any)}
                    className="w-full text-[11px] font-bold text-primary border border-border/80 hover:bg-primary/5 mt-0.5 justify-between py-1"
                  >
                    <span>Insert into document</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Persistent Sticky Action Bar */}
      <div className="p-3 border-t border-border bg-secondary/50 flex items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-xs font-bold text-[#64748B] hover:text-foreground">
            <Save className="w-3.5 h-3.5 mr-1" />
            Save Draft
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs font-bold">
            <FileDown className="w-3.5 h-3.5 mr-1" />
            Export DOCX
          </Button>
          <Button variant="outline" size="sm" className="text-xs font-bold">
            <Share2 className="w-3.5 h-3.5 mr-1" />
            Share
          </Button>
          <Button variant="primary" size="sm" className="text-xs font-bold px-4">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Approve & Sign-off
          </Button>
        </div>
      </div>
    </div>
  );
};
