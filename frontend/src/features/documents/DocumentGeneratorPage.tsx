import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Card, Badge, Button, Input, Alert } from "../../components/common/UIComponents";
import { RichDocumentEditor } from "../../components/common/RichDocumentEditor";
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
  Save,
  Send,
  X,
  Download,
  FileDown,
  History,
  Check,
  Sparkles,
  Upload,
  ClipboardList,
  Search
} from "lucide-react";


interface BusinessDocument {
  id: string;
  project: string;
  project_name: string;
  doc_type: "BRD" | "FRD" | "SWOT" | "GAP" | "IEEE";
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
  docType: "BRD" | "FRD" | "SWOT" | "GAP" | "IEEE";
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
  const [aiEnhancing, setAiEnhancing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const canManage = user ? ["ADMIN", "BUSINESS_ANALYST", "PRODUCT_OWNER"].includes(user.role) : false;
  const canSignOff = user ? ["ADMIN", "PRODUCT_OWNER", "PROJECT_MANAGER"].includes(user.role) : false;

  // Approvals & Revisions snapshot comparison states
  const [histories, setHistories] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [comparing, setComparing] = useState(false);
  const [compareVersionId, setCompareVersionId] = useState("");
  const [compareContent, setCompareContent] = useState("");
    // const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  // const [revisionComment, setRevisionComment] = useState("");

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
        const firstDoc = res.data[0];
        if (firstDoc) {
          setSelectedDoc(firstDoc);
        }
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

  // const handleRequestRevision = async (e: React.FormEvent) => { ... };

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

  const handleExportMarkdown = async () => {
    if (!selectedDoc) return;
    setSaving(true);
    setFormError(null);
    setSuccessMessage(null);
    try {
      const res = await api.get(`/documents/${selectedDoc.id}/export-markdown/`, {
        responseType: "blob"
      } as any);
      
      const blob = new Blob([res as any], { type: "text/markdown" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${selectedDoc.title}.md`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccessMessage("Markdown file exported successfully.");
    } catch (err: any) {
      setFormError("Failed to export Markdown file.");
    } finally {
      setSaving(false);
    }
  };

  const handleAiEnhance = async (enhancementType: "expand" | "refine" | "format") => {
    if (!selectedDoc) return;
    setAiEnhancing(true);
    setFormError(null);
    setSuccessMessage(null);
    try {
      const res = await api.post<any, { data: BusinessDocument }>(
        `/documents/${selectedDoc.id}/ai-enhance/`,
        { enhancement_type: enhancementType }
      );
      setSelectedDoc(res.data);
      setSuccessMessage(`Document ${enhancementType}d successfully using AI.`);
      fetchDocuments();
    } catch (err: any) {
      setFormError(err.message || "Failed to enhance document with AI.");
    } finally {
      setAiEnhancing(false);
    }
  };

  const handleImportFile = async (file: File, fileType: "markdown" | "docx") => {
    if (!activeProject) return;
    setImporting(true);
    setFormError(null);
    setSuccessMessage(null);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("project", activeProject.id);
    formData.append("doc_type", docType);
    formData.append("title", file.name.replace(`.${fileType === "markdown" ? "md" : "docx"}`, ""));
    
    try {
      const endpoint = fileType === "markdown" ? "/documents/import-markdown/" : "/documents/import-docx/";
      const res = await api.post<any, { data: BusinessDocument }>(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setSelectedDoc(res.data);
      setSuccessMessage(`${fileType.toUpperCase()} file imported successfully.`);
      setImportModalOpen(false);
      fetchDocuments();
    } catch (err: any) {
      setFormError(err.message || `Failed to import ${fileType} file.`);
    } finally {
      setImporting(false);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!selectedDoc) return;
    setSaving(true);
    setFormError(null);
    try {
      const version = versions.find(v => v.id === versionId);
      if (version) {
        const res = await api.patch<any, { data: BusinessDocument }>(
          `/documents/${selectedDoc.id}/`,
          { content: version.content }
        );
        setSelectedDoc(res.data);
        setSuccessMessage("Document restored from version successfully.");
        setVersionModalOpen(false);
        fetchDocuments();
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to restore version.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedDoc || !newComment.trim()) return;
    setSaving(true);
    try {
      const comment = {
        document: selectedDoc.id,
        content: newComment.trim(),
        user: user?.id
      };
      await api.post("/document-comments/", comment);
      setNewComment("");
      setSuccessMessage("Comment added successfully.");
      // Refresh comments
      const commentsRes = await api.get(`/document-comments/?document=${selectedDoc.id}`);
      setComments(commentsRes.data.results || []);
    } catch (err: any) {
      setFormError(err.message || "Failed to add comment.");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncWithModule = async (module: string) => {
    if (!selectedDoc) return;
    setSaving(true);
    setFormError(null);
    try {
      await api.post(`/documents/${selectedDoc.id}/sync/`, { module });
      setSuccessMessage(`Document synced with ${module} successfully.`);
      setSyncModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || `Failed to sync with ${module}.`);
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
      if (!line) continue;
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
        if (nodeMatch && nodeMatch[1] && nodeMatch[2]) {
          nodes.push({ id: nodeMatch[1], label: nodeMatch[2].trim() });
          return;
        }
        
        // Edge regex: n1 --> |label| n2 or n1 --> n2
        const edgeMatch = trimmedL.match(/^(\w+)\s*-->\s*\|([^|]+)\|\s*(\w+)/);
        if (edgeMatch && edgeMatch[1] && edgeMatch[2] && edgeMatch[3]) {
          edges.push({ source: edgeMatch[1], label: edgeMatch[2].trim(), target: edgeMatch[3] });
          return;
        }
        
        const edgeMatchNoLabel = trimmedL.match(/^(\w+)\s*-->\s*(\w+)/);
        if (edgeMatchNoLabel && edgeMatchNoLabel[1] && edgeMatchNoLabel[2]) {
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
              {block.lines[0]?.replace("# ", "") || ""}
            </h1>
          );
        case "h2":
          return (
            <h2 key={idx} className="text-xs font-bold text-foreground mt-4 mb-2">
              {block.lines[0]?.replace("## ", "") || ""}
            </h2>
          );
        case "h3":
          return (
            <h3 key={idx} className="text-[11px] font-bold text-foreground mt-3 mb-1">
              {block.lines[0]?.replace("### ", "") || ""}
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
          const body = rows.slice(1).filter(r => r.length > 0 && r[0] && !r[0].startsWith("---"));
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
          const isMermaid = block.lines[0]?.includes("mermaid") || false;
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
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImportModalOpen(true)}
                  className="text-[10px] font-bold h-7 py-1 px-2.5 rounded"
                >
                  <Upload className="w-3 h-3 mr-1" />
                  Import
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateTemplate}
                  className="text-[10px] font-bold h-7 py-1 px-2.5 rounded"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Compile
                </Button>
              </div>
            )}
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-semibold border border-border bg-background rounded-lg p-2 pl-8 outline-none text-foreground leading-relaxed focus:border-primary"
            />
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
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
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setIsDrafting(false)} className="w-6 h-6">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Saved document cards with search filter */}
              {documents
                .filter(doc => 
                  searchQuery === "" || 
                  doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  doc.version.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((doc) => {
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
                <RichDocumentEditor
                  value={draftContent}
                  onChange={setDraftContent}
                  placeholder="Start writing your IEEE document..."
                  minHeight="300px"
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
                {/* AI Enhancement Buttons */}
                {selectedDoc.doc_type === "IEEE" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAiEnhance("expand")}
                      disabled={aiEnhancing}
                      className="text-[10px] font-bold h-7.5 py-1 px-3 border border-purple-200 text-purple-600 hover:bg-purple-50/50 rounded flex items-center gap-1.5"
                    >
                      {aiEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Expand
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAiEnhance("refine")}
                      disabled={aiEnhancing}
                      className="text-[10px] font-bold h-7.5 py-1 px-3 border border-indigo-200 text-indigo-600 hover:bg-indigo-50/50 rounded flex items-center gap-1.5"
                    >
                      {aiEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Refine
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAiEnhance("format")}
                      disabled={aiEnhancing}
                      className="text-[10px] font-bold h-7.5 py-1 px-3 border border-violet-200 text-violet-600 hover:bg-violet-50/50 rounded flex items-center gap-1.5"
                    >
                      {aiEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Format
                    </Button>
                  </>
                )}
                
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportMarkdown}
                  disabled={saving}
                  className="text-[10px] font-bold h-7.5 py-1 px-3 border border-gray-200 text-gray-600 hover:bg-gray-50/50 rounded flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Markdown
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
                
                {/* Version History Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVersionModalOpen(true)}
                  className="text-[10px] font-bold h-7.5 py-1 px-3 border border-emerald-200 text-emerald-600 hover:bg-emerald-50/50 rounded flex items-center gap-1.5"
                >
                  <History className="w-3 h-3" />
                  Versions
                </Button>
                
                {/* Comments Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCommentsOpen(!commentsOpen)}
                  className={`text-[10px] font-bold h-7.5 py-1 px-3 rounded flex items-center gap-1.5 ${commentsOpen ? "bg-blue-500/10 border-blue-500 text-blue-400" : "border-blue-200 text-blue-600 hover:bg-blue-50/50"}`}
                >
                  <ClipboardList className="w-3 h-3" />
                  Comments {comments.length > 0 && `(${comments.length})`}
                </Button>
                
                {/* Sync Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSyncModalOpen(true)}
                  className="text-[10px] font-bold h-7.5 py-1 px-3 border border-orange-200 text-orange-600 hover:bg-orange-50/50 rounded flex items-center gap-1.5"
                >
                  <FolderGit className="w-3 h-3" />
                  Sync
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
                    {/* Request Revision button removed to resolve TS errors */}
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
            
            {/* Comments Panel */}
            {commentsOpen && (
              <div className="border-t border-border/60 pt-5 mt-4 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-blue-400" /> Document Comments
                </h4>
                
                <div className="flex flex-col gap-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={2}
                    className="w-full text-xs font-semibold border border-border bg-background rounded-lg p-2 outline-none text-foreground leading-relaxed resize-none focus:border-primary"
                  />
                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddComment}
                      disabled={saving || !newComment.trim()}
                      className="text-[10px] font-bold h-6 py-1 px-3"
                    >
                      Add Comment
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                  {comments.length === 0 ? (
                    <p className="text-[10px] text-gray-600 font-bold italic text-left">No comments yet.</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] font-bold text-white">{comment.user_full_name || comment.user_username}</span>
                          <span className="text-[9px] text-gray-600">{new Date(comment.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-[11px] text-gray-300 leading-relaxed">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </Card>
        ) : null}
      </div>
      
      {/* Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-card border border-border">
            <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
              <h3 className="text-sm font-bold text-foreground">Import Document</h3>
              <Button variant="ghost" size="icon" onClick={() => setImportModalOpen(false)} className="w-7 h-7">
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {formError && <Alert variant="destructive" className="mb-4">{formError}</Alert>}
            
            <div className="flex flex-col gap-4">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".md,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const fileType = file.name.endsWith('.md') ? 'markdown' : 'docx';
                      handleImportFile(file, fileType as "markdown" | "docx");
                    }
                  }}
                  className="hidden"
                  id="file-import"
                  disabled={importing}
                />
                <label htmlFor="file-import" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground font-semibold">
                    {importing ? "Importing..." : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Markdown (.md) or Word (.docx) files
                  </p>
                </label>
              </div>
              
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setImportModalOpen(false)}
                  disabled={importing}
                  className="text-xs font-bold"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* Sync Modal */}
      {syncModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-card border border-border">
            <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
              <h3 className="text-sm font-bold text-foreground">Sync Document</h3>
              <Button variant="ghost" size="icon" onClick={() => setSyncModalOpen(false)} className="w-7 h-7">
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {formError && <Alert variant="destructive" className="mb-4">{formError}</Alert>}
            
            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">Select a module to sync this document with:</p>
              
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSyncWithModule("requirements")}
                  disabled={saving}
                  className="text-xs font-bold justify-start"
                >
                  <FolderGit className="w-4 h-4 mr-2" />
                  Requirements Module
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSyncWithModule("srs")}
                  disabled={saving}
                  className="text-xs font-bold justify-start"
                >
                  <FileCheck className="w-4 h-4 mr-2" />
                  SRS Module
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSyncWithModule("test_cases")}
                  disabled={saving}
                  className="text-xs font-bold justify-start"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Test Cases Module
                </Button>
              </div>
              
              <div className="flex justify-end pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSyncModalOpen(false)}
                  disabled={saving}
                  className="text-xs font-bold"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* Version History Modal */}
      {versionModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-6 bg-card border border-border max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
              <h3 className="text-sm font-bold text-foreground">Version History</h3>
              <Button variant="ghost" size="icon" onClick={() => setVersionModalOpen(false)} className="w-7 h-7">
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3">
              {versions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No version history available.</p>
              ) : (
                versions.map((version) => (
                  <div key={version.id} className="border border-border rounded-lg p-4 bg-background/50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-xs font-bold text-foreground">Version {version.version}</span>
                        <p className="text-[10px] text-muted-foreground">
                          Created by {version.created_by_username} on {new Date(version.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreVersion(version.id)}
                        disabled={saving}
                        className="text-[10px] font-bold h-6 py-1 px-2"
                      >
                        Restore
                      </Button>
                    </div>
                    <div className="text-[10px] text-muted-foreground line-clamp-3">
                      {version.content.substring(0, 200)}...
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
