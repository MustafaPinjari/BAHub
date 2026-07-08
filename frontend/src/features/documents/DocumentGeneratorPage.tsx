import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Card, Badge, Button, Input, Alert } from "../../components/common/UIComponents";
import { useAuth } from "../auth/AuthContext";
import { useProject } from "../projects/ProjectContext";
import { FeatureLock } from "../../components/common/FeatureLock";
import { 
  FileText, 
  Plus, 
  Trash2, 
  CheckCircle,
  FileCheck,
  Loader2,
  FolderGit,
  ClipboardList,
  Save,
  Send,
  X,
  Download,
  FileDown,
  History,
  Check,
  XCircle
} from "lucide-react";


interface BusinessDocument {
  id: string;
  project: string;
  project_name: string;
  doc_type: "BRD" | "FRD";
  title: string;
  version: string;
  status: "DRAFT" | "REVIEW" | "APPROVED" | "SIGNED_OFF";
  content: string;
  created_by_username: string;
  signed_off_by_username: string | null;
  signed_off_at: string | null;
  created_at: string;
}

interface DocumentGeneratorPageProps {
  docType: "BRD" | "FRD";
}

export const DocumentGeneratorPage: React.FC<DocumentGeneratorPageProps> = ({ docType }) => {
  const { user } = useAuth();
  const { activeProject } = useProject();

  // States
  const [documents, setDocuments] = useState<BusinessDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<BusinessDocument | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Generate/Drafting states
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftVersion, setDraftVersion] = useState("1.0");
  const [draftContent, setDraftContent] = useState("");

  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canManage = user ? ["ADMIN", "BUSINESS_ANALYST", "PRODUCT_OWNER"].includes(user.role) : false;
  const canSignOff = user ? ["ADMIN", "PRODUCT_OWNER", "PROJECT_MANAGER"].includes(user.role) : false;

  // Approvals & Revisions snapshot comparison states
  const [histories, setHistories] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [comparing, setComparing] = useState(false);
  const [compareVersionId, setCompareVersionId] = useState("");
  const [compareContent, setCompareContent] = useState("");
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [revisionComment, setRevisionComment] = useState("");

  const loadDocHistory = async (docId: string) => {
    try {
      const res = await api.get<any, { data: any[] }>(`/documents/${docId}/history/`);
      setHistories(res.data || []);
    } catch (err) {
      console.error("Failed to load approval histories:", err);
    }
  };

  const loadDocVersions = async (docId: string) => {
    try {
      const res = await api.get<any, { data: any[] }>(`/documents/${docId}/versions/`);
      setVersions(res.data || []);
    } catch (err) {
      console.error("Failed to load versions snapshots:", err);
    }
  };

  const handleSelectCompareVersion = (vId: string) => {
    const ver = versions.find((v) => v.id === vId);
    if (ver) {
      setCompareVersionId(vId);
      setCompareContent(ver.content);
    } else {
      setCompareVersionId("");
      setCompareContent("");
    }
  };

  useEffect(() => {
    if (selectedDoc?.id) {
      loadDocHistory(selectedDoc.id);
      loadDocVersions(selectedDoc.id);
      setComparing(false);
      setCompareVersionId("");
      setCompareContent("");
    } else {
      setHistories([]);
      setVersions([]);
    }
  }, [selectedDoc?.id]);

  const fetchDocuments = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const res = await api.get<any, { data: BusinessDocument[] }>(
        `/documents/?project=${activeProject.id}&doc_type=${docType}`
      );
      setDocuments(res.data);
      if (res.data.length > 0 && !selectedDoc && !isDrafting) {
        setSelectedDoc(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    setSelectedDoc(null);
    setIsDrafting(false);
  }, [activeProject, docType]);


  const handleGenerateTemplate = async () => {
    if (!activeProject) return;
    setLoading(true);
    setFormError(null);
    setSuccessMessage(null);
    try {
      const res = await api.post<any, { data: any }>("/documents/generate/", {
        project: activeProject.id,
        doc_type: docType
      });
      setDraftTitle(res.data.title);
      setDraftVersion(res.data.version);
      setDraftContent(res.data.content);
      setIsDrafting(true);
      setSelectedDoc(null);
    } catch (err: any) {
      setFormError(err.message || "Failed to generate document template.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDocument = async () => {
    if (!activeProject) return;
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        project: activeProject.id,
        doc_type: docType,
        title: draftTitle,
        version: draftVersion,
        content: draftContent,
        status: "DRAFT"
      };
      const res = await api.post<any, { data: BusinessDocument }>("/documents/", payload);
      setSuccessMessage(`${docType} document saved as Draft successfully.`);
      setIsDrafting(false);
      setSelectedDoc(res.data);
      fetchDocuments();
    } catch (err: any) {
      setFormError(err.message || "Failed to save document.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!selectedDoc) return;
    setSaving(true);
    setFormError(null);
    try {
      const res = await api.post<any, { data: BusinessDocument }>(`/documents/${selectedDoc.id}/submit-for-review/`);
      setSuccessMessage("Document submitted for review successfully.");
      setSelectedDoc(res.data);
      fetchDocuments();
    } catch (err: any) {
      setFormError(err.message || "Failed to submit for review.");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedDoc) return;
    setSaving(true);
    setFormError(null);
    try {
      const res = await api.post<any, { data: BusinessDocument }>(`/documents/${selectedDoc.id}/approve/`);
      setSuccessMessage("Document approved successfully.");
      setSelectedDoc(res.data);
      fetchDocuments();
    } catch (err: any) {
      setFormError(err.message || "Failed to approve document.");
    } finally {
      setSaving(false);
    }
  };

  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc || !revisionComment) return;
    setSaving(true);
    setFormError(null);
    try {
      const res = await api.post<any, { data: BusinessDocument }>(`/documents/${selectedDoc.id}/request-revision/`, {
        comment: revisionComment
      });
      setSuccessMessage("Revisions requested successfully.");
      setRevisionModalOpen(false);
      setRevisionComment("");
      setSelectedDoc(res.data);
      fetchDocuments();
    } catch (err: any) {
      setFormError(err.message || "Failed to request revisions.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOff = async () => {
    if (!selectedDoc) return;
    setSigning(true);
    setFormError(null);
    try {
      const res = await api.post<any, { data: BusinessDocument }>(`/documents/${selectedDoc.id}/sign-off/`);
      setSuccessMessage(`Document officially Signed Off by @${user?.username}.`);
      setSelectedDoc(res.data);
      fetchDocuments();
    } catch (err: any) {
      setFormError(err.message || "Failed to sign off document.");
    } finally {
      setSigning(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this document profile permanently?")) return;
    setFormError(null);
    try {
      await api.delete(`/documents/${id}/`);
      setSuccessMessage("Document deleted successfully.");
      setSelectedDoc(null);
      fetchDocuments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportPDF = async () => {
    if (!selectedDoc) return;
    setSaving(true);
    setFormError(null);
    setSuccessMessage(null);
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
      setSuccessMessage("PDF exported successfully.");
    } catch (err: any) {
      setFormError("Failed to export PDF document.");
    } finally {
      setSaving(false);
    }
  };

  const handleExportWord = async () => {
    if (!selectedDoc) return;
    setSaving(true);
    setFormError(null);
    setSuccessMessage(null);
    try {
      const res = await api.get(`/documents/${selectedDoc.id}/export-word/`, {
        responseType: "blob"
      } as any);
      
      const blob = new Blob([res as any], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${selectedDoc.title}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccessMessage("Word document exported successfully.");
    } catch (err: any) {
      setFormError("Failed to export Word document.");
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (statusKey: string) => {
    switch (statusKey) {
      case "SIGNED_OFF":
        return <Badge variant="success">Signed Off</Badge>;
      case "REVIEW":
        return <Badge variant="default">Under Review</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  // Basic Markdown-to-HTML parser rendering for reader panel
  const renderMarkdown = (text: string) => {
    if (!text) return null;

    // Helper interfaces
    interface MarkdownBlock {
      type: "h1" | "h2" | "h3" | "list" | "table" | "code" | "paragraph";
      lines: string[];
    }

    // Segment markdown text into blocks
    const lines = text.split("\n");
    const blocks: MarkdownBlock[] = [];
    let currentBlock: MarkdownBlock | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Handle code block
      if (trimmed.startsWith("```")) {
        if (currentBlock && currentBlock.type === "code") {
          // End of code block
          blocks.push(currentBlock);
          currentBlock = null;
        } else {
          // Start of code block
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = { type: "code", lines: [line] };
        }
        continue;
      }

      if (currentBlock && currentBlock.type === "code") {
        currentBlock.lines.push(line);
        continue;
      }

      // Handle empty line
      if (trimmed === "") {
        if (currentBlock) {
          blocks.push(currentBlock);
          currentBlock = null;
        }
        continue;
      }

      // Handle headings
      if (trimmed.startsWith("# ")) {
        if (currentBlock) blocks.push(currentBlock);
        blocks.push({ type: "h1", lines: [trimmed] });
        currentBlock = null;
        continue;
      }
      if (trimmed.startsWith("## ")) {
        if (currentBlock) blocks.push(currentBlock);
        blocks.push({ type: "h2", lines: [trimmed] });
        currentBlock = null;
        continue;
      }
      if (trimmed.startsWith("### ")) {
        if (currentBlock) blocks.push(currentBlock);
        blocks.push({ type: "h3", lines: [trimmed] });
        currentBlock = null;
        continue;
      }

      // Handle bullet lists
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        if (currentBlock && currentBlock.type === "list") {
          currentBlock.lines.push(trimmed);
        } else {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = { type: "list", lines: [trimmed] };
        }
        continue;
      }

      // Handle tables
      if (trimmed.startsWith("|")) {
        if (currentBlock && currentBlock.type === "table") {
          currentBlock.lines.push(trimmed);
        } else {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = { type: "table", lines: [trimmed] };
        }
        continue;
      }

      // Handle normal paragraphs
      if (currentBlock && currentBlock.type === "paragraph") {
        currentBlock.lines.push(line);
      } else {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: "paragraph", lines: [line] };
      }
    }

    if (currentBlock) {
      blocks.push(currentBlock);
    }

    // Helper to parse mermaid elements and connections
    const parseMermaid = (mermaidLines: string[]) => {
      const nodes: { id: string; label: string }[] = [];
      const edges: { source: string; target: string; label: string }[] = [];
      
      mermaidLines.forEach(l => {
        const trimmedL = l.trim();
        if (!trimmedL || trimmedL.startsWith("```") || trimmedL.startsWith("graph") || trimmedL.startsWith("subgraph") || trimmedL === "end") {
          return;
        }
        
        // Node regex: n1["👤 Customer"] or n1("Customer")
        const nodeMatch = trimmedL.match(/^(\w+)\["([^"]+)"\]/) || trimmedL.match(/^(\w+)\("([^"]+)"\)/) || trimmedL.match(/^(\w+)\[([^\]]+)\]/);
        if (nodeMatch) {
          nodes.push({ id: nodeMatch[1], label: nodeMatch[2].trim() });
          return;
        }
        
        // Edge regex: n1 --> |label| n2 or n1 --> n2
        const edgeMatch = trimmedL.match(/^(\w+)\s*-->\s*\|([^|]+)\|\s*(\w+)/);
        if (edgeMatch) {
          edges.push({ source: edgeMatch[1], label: edgeMatch[2].trim(), target: edgeMatch[3] });
          return;
        }
        
        const edgeMatchNoLabel = trimmedL.match(/^(\w+)\s*-->\s*(\w+)/);
        if (edgeMatchNoLabel) {
          edges.push({ source: edgeMatchNoLabel[1], label: "", target: edgeMatchNoLabel[2] });
          return;
        }
      });
      
      return { nodes, edges };
    };

    // Render blocks to React Components
    return blocks.map((block, idx) => {
      switch (block.type) {
        case "h1":
          return (
            <h1 key={idx} className="text-base font-bold text-foreground border-b border-border pb-1 mt-6 mb-3">
              {block.lines[0].replace("# ", "")}
            </h1>
          );
        case "h2":
          return (
            <h2 key={idx} className="text-xs font-bold text-foreground mt-4 mb-2">
              {block.lines[0].replace("## ", "")}
            </h2>
          );
        case "h3":
          return (
            <h3 key={idx} className="text-[11px] font-bold text-foreground mt-3 mb-1">
              {block.lines[0].replace("### ", "")}
            </h3>
          );
        case "list":
          return (
            <ul key={idx} className="list-disc pl-5 my-2">
              {block.lines.map((line, lIdx) => (
                <li key={lIdx} className="text-xs text-muted-foreground leading-relaxed my-0.5">
                  {line.replace(/^[-*]\s+/, "")}
                </li>
              ))}
            </ul>
          );
        case "table": {
          const rows = block.lines.map(line => line.split("|").map(c => c.trim()).filter((_c, i, a) => i > 0 && i < a.length - 1));
          const header = rows[0];
          const body = rows.slice(1).filter(r => r.length > 0 && !r[0].startsWith("---"));
          return (
            <div key={idx} className="overflow-x-auto my-3 border border-border rounded-xl">
              <table className="min-w-full divide-y divide-border text-[11px]">
                {header && (
                  <thead className="bg-secondary/40">
                    <tr>
                      {header.map((cell, cIdx) => (
                        <th key={cIdx} className="px-3 py-2 font-bold text-foreground text-left border-r border-border last:border-0">
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody className="bg-card divide-y divide-border">
                  {body.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-secondary/15 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 text-muted-foreground border-r border-border last:border-0 font-medium">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        case "code": {
          const isMermaid = block.lines[0].includes("mermaid");
          if (isMermaid) {
            const { nodes, edges } = parseMermaid(block.lines);
            const nodeMap = new Map(nodes.map(n => [n.id, n.label]));
            
            return (
              <div key={idx} className="my-4 p-4 rounded-2xl bg-secondary/10 border border-border/85 flex flex-col gap-4 text-left">
                <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">Visual Model Specifications</span>
                </div>
                
                {nodes.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-extrabold uppercase text-muted-foreground tracking-wider">Actors & Systems</span>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {nodes.map((node, nIdx) => (
                        <div key={nIdx} className="px-2.5 py-1.5 rounded-xl border border-border bg-card flex items-center gap-2 shadow-sm">
                          <span className="text-[11px] font-semibold text-foreground">{node.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {edges.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-extrabold uppercase text-muted-foreground tracking-wider">Flows & Interactions</span>
                    <div className="overflow-hidden border border-border rounded-xl">
                      <table className="min-w-full divide-y divide-border text-[10px]">
                        <thead className="bg-secondary/40">
                          <tr>
                            <th className="px-3 py-1.5 font-bold text-foreground text-left">Source</th>
                            <th className="px-3 py-1.5 font-bold text-foreground text-left">Action / Flow</th>
                            <th className="px-3 py-1.5 font-bold text-foreground text-left">Target</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card font-medium text-muted-foreground">
                          {edges.map((edge, eIdx) => (
                            <tr key={eIdx} className="hover:bg-secondary/10 transition-colors">
                              <td className="px-3 py-1.5 text-foreground font-bold">{nodeMap.get(edge.source) || edge.source}</td>
                              <td className="px-3 py-1.5 italic text-primary font-bold">{edge.label || "initiates"}</td>
                              <td className="px-3 py-1.5 text-foreground font-bold">{nodeMap.get(edge.target) || edge.target}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          }
          // Normal code block
          return (
            <pre key={idx} className="p-3 bg-secondary/45 border border-border rounded-xl font-mono text-[10px] text-muted-foreground overflow-x-auto my-3 leading-relaxed">
              <code>
                {block.lines.filter((_, i) => i > 0 && i < block.lines.length - 1).join("\n")}
              </code>
            </pre>
          );
        }
        case "paragraph":
        default:
          return (
            <p key={idx} className="text-xs text-muted-foreground leading-relaxed my-1.5">
              {block.lines.join(" ")}
            </p>
          );
      }
    });
  };

  if (user?.plan_tier === "FREE") {
    return (
      <FeatureLock
        requiredTier="PRO"
        featureName={`${docType} Generator`}
        featureDescription={`Synthesize full professional requirements and specification documents (${docType}) dynamically from project backlogs, stakeholder maps, and user story catalogs.`}
      />
    );
  }

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
            Select a project context from the Projects list page before generating requirement documents.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col md:flex-row gap-5 items-stretch select-none text-foreground min-h-[75vh]">
      
      {/* LEFT COLUMN: Document Listing & Generator Controls */}
      <div className="w-full md:w-[35%] flex flex-col gap-4">
        <Card className="p-4 flex flex-col gap-4 flex-1">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <div>
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
                {docType} Workspace
              </h2>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mt-0.5">
                Project: {activeProject.name}
              </span>
            </div>
            {canManage && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateTemplate}
                className="text-[10px] font-bold h-7 py-1 px-2.5 rounded"
              >
                <Plus className="w-3 h-3 mr-1" />
                Compile
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 flex-1">
              <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
              <span className="text-xs text-muted-foreground font-semibold">Compiling backlogs...</span>
            </div>
          ) : documents.length === 0 && !isDrafting ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-xs text-muted-foreground flex-1">
              <FileText className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <span>No document versions saved.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[550px] pr-1">
              {/* Drafting indicator card */}
              {isDrafting && (
                <div className="p-3 border border-indigo-400 bg-indigo-50/10 rounded-xl flex items-center justify-between text-left">
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <span className="text-[8px] font-bold text-indigo-600 uppercase tracking-wider">Drafting Mode</span>
                    <h4 className="font-bold text-xs text-foreground truncate max-w-[150px]">{draftTitle}</h4>
                    <span className="text-[9px] text-muted-foreground font-bold leading-none mt-1">v{draftVersion}</span>
                  </div>
                  <Badge variant="secondary">Compiling</Badge>
                </div>
              )}

              {/* Saved document cards */}
              {documents.map((doc) => {
                const isSelected = selectedDoc?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setSelectedDoc(doc);
                      setIsDrafting(false);
                    }}
                    className={`p-3 border rounded-xl flex items-center justify-between gap-3 cursor-pointer text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:border-primary/20"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      <h4 className="font-bold text-xs text-foreground truncate max-w-[160px]">{doc.title}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-muted-foreground font-bold">
                        <span>v{doc.version}</span>
                        <span>•</span>
                        <span>@{doc.created_by_username}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(doc.status)}
                      {canManage && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(doc.id);
                          }}
                          className="text-muted-foreground hover:text-destructive cursor-pointer p-0.5"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* RIGHT COLUMN: Document Markdown Reader & Sign-off header */}
      <div className="w-full md:w-[65%] flex flex-col gap-4">
        {isDrafting ? (
          /* DRAFT WRITER INTERFACE */
          <Card className="p-6 flex flex-col gap-4 flex-1 bg-card border border-border">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Compile Document Specifications
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDrafting(false)}
                className="text-muted-foreground hover:text-foreground w-7 h-7 rounded"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {formError && <Alert variant="destructive">{formError}</Alert>}

            <div className="flex flex-col gap-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Document Title"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                />
                <Input
                  label="Version"
                  value={draftVersion}
                  onChange={(e) => setDraftVersion(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Compiled Specifications Template (Markdown Editor)
                </label>
                <textarea
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  rows={14}
                  className="w-full text-xs font-mono border border-border bg-background rounded-lg p-3 outline-none text-foreground leading-relaxed resize-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-4 mt-auto">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsDrafting(false)}
                className="text-xs font-bold"
              >
                Discard
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveDocument}
                isLoading={saving}
                className="text-xs font-bold flex items-center gap-1.5 px-4"
              >
                <Save className="w-3.5 h-3.5" />
                Save Draft
              </Button>
            </div>
          </Card>
        ) : selectedDoc ? (
          /* READ-ONLY MARKDOWN DOCUMENT READER WITH ACTIONS */
          <Card className="p-6 flex flex-col gap-4 flex-1 relative bg-card border border-border">
            
            {/* Header Document Status Actions */}
            <div className="flex flex-wrap justify-between items-center border-b border-border pb-3 gap-3">
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground leading-none">{selectedDoc.title}</h3>
                  {getStatusBadge(selectedDoc.status)}
                </div>
                {selectedDoc.status === "SIGNED_OFF" && (
                  <span className="text-[10px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Signed off by @{selectedDoc.signed_off_by_username} on {new Date(selectedDoc.signed_off_at!).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Export Buttons */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                  disabled={saving}
                  className="text-[10px] font-bold h-7.5 py-1 px-3 border border-red-200 text-red-600 hover:bg-red-50/50 rounded flex items-center gap-1.5"
                >
                  <Download className="w-3 h-3" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportWord}
                  disabled={saving}
                  className="text-[10px] font-bold h-7.5 py-1 px-3 border border-blue-200 text-blue-600 hover:bg-blue-50/50 rounded flex items-center gap-1.5"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Word
                </Button>

                {/* Compare Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setComparing(!comparing)}
                  className={`text-[10px] font-bold h-7.5 py-1 px-3 rounded flex items-center gap-1.5 ${comparing ? "bg-purple-500/10 border-purple-500 text-purple-400" : ""}`}
                >
                  <History className="w-3 h-3" />
                  {comparing ? "Show Reader" : "Compare Versions"}
                </Button>

                {selectedDoc.status === "DRAFT" && canManage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSubmitForReview}
                    isLoading={saving}
                    className="text-[10px] font-bold h-7.5 py-1 px-3 rounded flex items-center gap-1.5"
                  >
                    <Send className="w-3 h-3" />
                    Submit Review
                  </Button>
                )}

                {selectedDoc.status === "REVIEW" && canSignOff && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleApprove}
                      isLoading={saving}
                      className="text-[10px] font-bold h-7.5 py-1 px-3 border-green-500/20 text-green-400 hover:bg-green-500/10 rounded flex items-center gap-1.5"
                    >
                      <Check className="w-3 h-3" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRevisionModalOpen(true)}
                      className="text-[10px] font-bold h-7.5 py-1 px-3 border-red-500/20 text-red-400 hover:bg-red-500/10 rounded flex items-center gap-1.5"
                    >
                      <XCircle className="w-3 h-3" />
                      Request Revision
                    </Button>
                  </>
                )}

                {(selectedDoc.status === "APPROVED" || (selectedDoc.status === "REVIEW" && canSignOff)) && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSignOff}
                    isLoading={signing}
                    className="text-[10px] font-bold h-7.5 py-1 px-3 rounded flex items-center gap-1.5"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    Sign Off
                  </Button>
                )}
              </div>
            </div>

            {successMessage && <Alert variant="success">{successMessage}</Alert>}
            {formError && <Alert variant="destructive">{formError}</Alert>}

            {/* Document Render Panel or Version Compare side-by-side */}
            {comparing ? (
              <div className="flex flex-col gap-4 text-left">
                <div className="flex justify-between items-center bg-white/[0.02] border border-white/[0.06] p-3 rounded-xl">
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    <History className="w-4 h-4 text-purple-400" /> Comparing Version Snapshots
                  </span>
                  <div className="flex items-center gap-3">
                    <select
                      value={compareVersionId}
                      onChange={(e) => handleSelectCompareVersion(e.target.value)}
                      className="bg-gray-950 border border-white/[0.08] text-gray-200 text-xs rounded-md p-1.5 outline-none cursor-pointer font-semibold"
                    >
                      <option value="">Select Version to Compare...</option>
                      {versions.map((v) => (
                        <option key={v.id} value={v.id}>
                          Version {v.version} ({new Date(v.created_at).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                    <Button variant="secondary" size="sm" onClick={() => setComparing(false)} className="text-xs py-1 h-7">
                      Close Compare
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Current */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current Content (Version {selectedDoc.version})</span>
                    <div className="border border-border/80 bg-background/50 rounded-xl p-4 text-left overflow-y-auto max-h-[400px] text-xs font-semibold whitespace-pre-wrap select-text leading-relaxed text-gray-300">
                      {selectedDoc.content}
                    </div>
                  </div>
                  {/* Right Column: Historical */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Historical Snapshot Content</span>
                    {compareVersionId ? (
                      <div className="border border-border/80 bg-background/50 rounded-xl p-4 text-left overflow-y-auto max-h-[400px] text-xs font-semibold whitespace-pre-wrap select-text leading-relaxed text-gray-300">
                        {compareContent}
                      </div>
                    ) : (
                      <div className="border border-border/60 bg-white/[0.01] rounded-xl p-4 text-center text-xs text-gray-500 min-h-[200px] flex items-center justify-center font-bold">
                        Select a historical version snapshot from the dropdown to start comparing.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-border/80 bg-background/50 rounded-xl p-5 text-left overflow-y-auto max-h-[500px] shadow-inner select-text">
                {renderMarkdown(selectedDoc.content)}
              </div>
            )}

            {/* Timeline History Panel */}
            <div className="border-t border-border/60 pt-5 mt-4 flex flex-col gap-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-purple-400" /> Approval Workflow History Timeline
              </h4>
              {histories.length === 0 ? (
                <p className="text-[10px] text-gray-600 font-bold italic text-left">No review activities recorded yet.</p>
              ) : (
                <div className="flex flex-col gap-3 border-l-2 border-white/[0.06] pl-4 ml-2 mt-2">
                  {histories.map((h) => (
                    <div key={h.id} className="relative flex flex-col gap-1 text-left text-xs font-semibold">
                      <div className="absolute -left-[22px] top-1 w-2 h-2 rounded-full bg-purple-500 border border-black shadow" />
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white uppercase tracking-wide text-[10px]">
                          {h.action === "SUBMIT_REVIEW" ? "Submitted for Review" :
                           h.action === "APPROVE" ? "Approved" :
                           h.action === "REQUEST_REVISIONS" ? "Revisions Requested" :
                           h.action === "SIGN_OFF" ? "Signed Off" : h.action}
                        </span>
                        <span className="text-[9px] text-gray-500">by @{h.user_username} ({h.user_full_name})</span>
                        <span className="text-[9px] text-gray-600 ml-auto">{new Date(h.created_at).toLocaleString()}</span>
                      </div>
                      {h.comment && (
                        <p className="text-[11px] text-gray-400 font-medium bg-white/[0.02] border border-white/[0.04] p-2 rounded-lg mt-0.5 whitespace-pre-wrap italic">
                          "{h.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Revision Request Dialog / Modal */}
            {revisionModalOpen && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md p-5 bg-card border border-border shadow-2xl flex flex-col gap-4 text-left">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-border pb-2">
                    Request Document Revision
                  </h3>
                  <form onSubmit={handleRequestRevision} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                        Rejection Reason / Requested Changes
                      </label>
                      <textarea
                        value={revisionComment}
                        onChange={(e) => setRevisionComment(e.target.value)}
                        rows={4}
                        required
                        placeholder="Detail the corrections, additions, or changes requested before approval..."
                        className="w-full text-xs font-semibold border border-border bg-background rounded-lg p-3 outline-none text-foreground leading-relaxed resize-none focus:border-primary"
                      />
                    </div>
                    <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
                      <Button type="button" variant="secondary" size="sm" onClick={() => { setRevisionModalOpen(false); setRevisionComment(""); }} className="font-bold text-xs">
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary" size="sm" className="font-bold text-xs bg-red-600 hover:bg-red-500 border-none px-4">
                        Request Revision
                      </Button>
                    </div>
                  </form>
                </Card>
              </div>
            )}
          </Card>
        ) : (
          <Card className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none text-foreground font-semibold">
            <ClipboardList className="w-10 h-10 text-muted-foreground/30 animate-pulse mb-3" />
            <h3 className="text-sm font-bold uppercase tracking-wider">No Document Selected</h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mt-1">
              Select a compiled version from the left panel, or click "Compile" to build a fresh {docType} specification document.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
