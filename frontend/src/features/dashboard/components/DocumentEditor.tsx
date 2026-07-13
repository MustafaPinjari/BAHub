import React, { useState, useEffect } from "react";
import { Button, Badge } from "../../../components/common/UIComponents";
import { api } from "../../../services/api";
import { useAuth } from "../../auth/AuthContext";
import { 
  Sparkles, 
  FileDown, 
  CheckCircle2, 
  Save, 
  ArrowRight,
  Loader2
} from "lucide-react";

interface DocumentEditorProps {
  activeProject: {
    id: string;
    name: string;
    description?: string;
  } | null;
  onSave?: () => void;
}

interface BusinessDocument {
  id: string;
  project: string;
  doc_type: "BRD" | "FRD";
  title: string;
  version: string;
  status: "DRAFT" | "REVIEW" | "APPROVED" | "SIGNED_OFF";
  content: string;
  created_by_username?: string;
  updated_at?: string;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({ activeProject, onSave }) => {
  const { user } = useAuth();
  const canSignOff = user ? ["ADMIN", "PRODUCT_OWNER", "PROJECT_MANAGER"].includes(user.role) : false;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<BusinessDocument | null>(null);

  const [docContent, setDocContent] = useState({
    title: "",
    scope: "",
    flow: "",
    reqs: "",
  });

  const [version, setVersion] = useState("1.0");
  const [status, setStatus] = useState("DRAFT");
  const [lastEditedText, setLastEditedText] = useState("Not saved yet");

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

  const parseMarkdownContent = (content: string, defaultTitle: string) => {
    const result = {
      title: defaultTitle,
      scope: "",
      flow: "",
      reqs: ""
    };
    
    if (!content) return result;
    
    // Find Title
    const titleMatch = content.match(/^# Business Document:\s*(.*)$/m);
    if (titleMatch && titleMatch[1]) {
      result.title = titleMatch[1].trim();
    }
    
    // Find sections using RegExp or splitting
    const sections = content.split(/^##\s+/m);
    for (const section of sections) {
      const lines = section.split("\n");
      if (lines.length > 0) {
        const header = lines[0]?.trim() || "";
        const body = lines.slice(1).join("\n").trim();
      
        if (header.includes("Scope") || header.includes("1.")) {
          result.scope = body;
        } else if (header.includes("User Flow") || header.includes("2.")) {
          result.flow = body;
        } else if (header.includes("Requirements") || header.includes("3.")) {
          result.reqs = body;
        }
      }
    }
    
    return result;
  };

  const compileMarkdownContent = (title: string, scope: string, flow: string, reqs: string) => {
    return `# Business Document: ${title}

## 1. Scope & Objective
${scope}

## 2. User Flow Steps
${flow}

## 3. Functional Requirements
${reqs}`;
  };

  const loadDocumentData = async () => {
    if (!activeProject?.id) return;
    setLoading(true);
    try {
      // 1. Fetch BRD documents for this project
      const docsRes = await api.get<any, { data: BusinessDocument[] }>(
        `/documents/?project=${activeProject.id}&doc_type=BRD`
      );
      
      if (docsRes.data && docsRes.data.length > 0) {
        const doc = docsRes.data[0];
        if (doc) {
          setSelectedDoc(doc);
          setVersion(doc.version || "1.0");
          setStatus(doc.status || "DRAFT");
          setDocContent(parseMarkdownContent(doc.content, doc.title));
          
          if (doc.updated_at) {
            const date = new Date(doc.updated_at);
            setLastEditedText(`Last edited ${date.toLocaleDateString()} by ${doc.created_by_username || 'David'}`);
          } else {
            setLastEditedText(`Last edited by ${doc.created_by_username || 'David'}`);
          }
        }
      } else {
        // No document exists, fetch requirements to auto-populate a default template
        setSelectedDoc(null);
        setVersion("1.0");
        setStatus("DRAFT");
        setLastEditedText("New Draft");
        
        const reqsRes = await api.get<any, { data: any[] }>(
          `/requirements/?project=${activeProject.id}`
        );
        const reqsList = reqsRes.data || [];
        
        const defaultReqsText = reqsList.length > 0 
          ? reqsList.map((r: any) => `- ${r.req_id || 'REQ'}: ${r.title}\n  Description: ${r.description || ''}`).join('\n\n')
          : "- REQ-1: System must implement core business rules.\n- REQ-2: Ensure proper authentication for APIs.";

        setDocContent({
          title: `BRD - ${activeProject.name}`,
          scope: `Scope & Objectives for ${activeProject.name}.\n${activeProject.description || 'No description provided.'}`,
          flow: "1. User initiates task.\n2. System processes request.\n3. System returns confirmation.",
          reqs: defaultReqsText
        });
      }
    } catch (err) {
      console.error("Failed to load document/requirements for dashboard workspace:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocumentData();
  }, [activeProject?.id]);

  const handleSaveDraft = async () => {
    if (!activeProject?.id) return;
    setSaving(true);
    try {
      const contentStr = compileMarkdownContent(docContent.title, docContent.scope, docContent.flow, docContent.reqs);
      const payload = {
        project: activeProject.id,
        doc_type: "BRD" as const,
        title: docContent.title,
        version: version,
        content: contentStr,
        status: "DRAFT"
      };

      let res;
      if (selectedDoc) {
        // Update existing
        res = await api.put<any, { data: BusinessDocument }>(`/documents/${selectedDoc.id}/`, {
          ...payload,
          status: status
        });
      } else {
        // Create new
        res = await api.post<any, { data: BusinessDocument }>("/documents/", payload);
      }

      setSelectedDoc(res.data);
      setVersion(res.data.version);
      setStatus(res.data.status);
      setLastEditedText("Saved just now");
      
      if (onSave) onSave();
    } catch (err) {
      console.error("Failed to save document:", err);
      alert("Failed to save draft.");
    } finally {
      setSaving(false);
    }
  };

  const handleApproveSignOff = async () => {
    if (!activeProject?.id) return;
    setSaving(true);
    try {
      // 1. Compile and save/update the document first
      const contentStr = compileMarkdownContent(docContent.title, docContent.scope, docContent.flow, docContent.reqs);
      const payload = {
        project: activeProject.id,
        doc_type: "BRD" as const,
        title: docContent.title,
        version: version,
        content: contentStr,
      };

      let docId = selectedDoc?.id;
      if (selectedDoc) {
        await api.put(`/documents/${selectedDoc.id}/`, {
          ...payload,
          status: "REVIEW"
        });
      } else {
        const res = await api.post<any, { data: BusinessDocument }>("/documents/", {
          ...payload,
          status: "REVIEW"
        });
        docId = res.data.id;
      }

      // 2. Perform sign-off
      const signRes = await api.post<any, { data: BusinessDocument }>(`/documents/${docId}/sign-off/`);
      setSelectedDoc(signRes.data);
      setVersion(signRes.data.version);
      setStatus(signRes.data.status);
      setLastEditedText("Signed off just now");
      
      if (onSave) onSave();
    } catch (err: any) {
      console.error("Failed to sign off document:", err);
      alert(err.message || "Failed to sign off document.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!activeProject?.id) return;
    setSaving(true);
    try {
      const contentStr = compileMarkdownContent(docContent.title, docContent.scope, docContent.flow, docContent.reqs);
      const payload = {
        project: activeProject.id,
        doc_type: "BRD" as const,
        title: docContent.title,
        version: version,
        content: contentStr,
        status: "REVIEW"
      };

      let res;
      if (selectedDoc) {
        res = await api.put<any, { data: BusinessDocument }>(`/documents/${selectedDoc.id}/`, payload);
      } else {
        res = await api.post<any, { data: BusinessDocument }>("/documents/", payload);
      }

      setSelectedDoc(res.data);
      setVersion(res.data.version);
      setStatus(res.data.status);
      setLastEditedText("Submitted for review just now");
      
      if (onSave) onSave();
    } catch (err: any) {
      console.error("Failed to submit document for review:", err);
      alert(err.message || "Failed to submit document for review.");
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!selectedDoc) {
      alert("Please save a draft of the document first.");
      return;
    }
    setSaving(true);
    try {
      const res = await api.get(`/documents/${selectedDoc.id}/export-pdf/`, {
        responseType: "blob"
      } as any);
      
      const blob = new Blob([res as any], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${selectedDoc.title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to export PDF.");
    } finally {
      setSaving(false);
    }
  };

  const handleApplyAi = (id: string, field: "scope" | "reqs") => {
    const item = aiSuggestions.find((s) => s.id === id);
    if (!item) return;

    setDocContent((prev) => ({
      ...prev,
      [field]: prev[field] + "\n" + item.suggestion,
    }));

    setAiSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border min-h-[350px] w-full">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
        <span className="text-xs text-muted-foreground font-semibold">Loading project specification...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden text-foreground w-full">
      {/* Editor Context bar */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30 select-none">
        <div className="flex items-center gap-2">
          <Badge variant={status === "SIGNED_OFF" ? "success" : status === "REVIEW" ? "warning" : "default"}>
            {status === "SIGNED_OFF" ? "Signed Off" : status === "REVIEW" ? "Under Review" : `v${version}`}
          </Badge>
          <span className="text-xs text-muted-foreground font-semibold">
            {lastEditedText}
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
            <div className="max-w-2xl mx-auto flex flex-col gap-6 prose prose-slate w-full">
              <h1 className="text-xl font-bold text-foreground border-b border-border pb-2">
                {docContent.title}
              </h1>
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Scope</h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{docContent.scope}</p>
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
            <div className="flex flex-col gap-4 w-full">
              <input
                type="text"
                value={docContent.title}
                onChange={(e) => setDocContent({ ...docContent, title: e.target.value })}
                className="w-full text-lg font-bold bg-transparent border-b border-transparent focus:border-border outline-none pb-1.5 focus:ring-0 text-foreground"
                disabled={status === "SIGNED_OFF"}
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
                  disabled={status === "SIGNED_OFF"}
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
                  disabled={status === "SIGNED_OFF"}
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
                  disabled={status === "SIGNED_OFF"}
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

            {aiSuggestions.length === 0 || status === "SIGNED_OFF" ? (
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
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSaveDraft}
            disabled={saving || status === "SIGNED_OFF"}
            className="text-xs font-bold text-[#64748B] hover:text-foreground"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            {saving ? "Saving..." : "Save Draft"}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportPDF}
            disabled={saving || !selectedDoc}
            className="text-xs font-bold"
          >
            <FileDown className="w-3.5 h-3.5 mr-1" />
            Export PDF
          </Button>
          {canSignOff ? (
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleApproveSignOff}
              disabled={saving || status === "SIGNED_OFF"}
              className="text-xs font-bold px-4"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              {status === "SIGNED_OFF" ? "Signed Off" : "Approve & Sign-off"}
            </Button>
          ) : (
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleSubmitForReview}
              disabled={saving || status === "REVIEW" || status === "SIGNED_OFF"}
              className="text-xs font-bold px-4"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              {status === "SIGNED_OFF" ? "Signed Off" : status === "REVIEW" ? "Pending Sign-off" : "Submit for Review"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
