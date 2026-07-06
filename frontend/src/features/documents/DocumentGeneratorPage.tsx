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
  FileDown
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
      const res = await api.put<any, { data: BusinessDocument }>(`/documents/${selectedDoc.id}/`, {
        project: selectedDoc.project,
        doc_type: selectedDoc.doc_type,
        title: selectedDoc.title,
        version: selectedDoc.version,
        content: selectedDoc.content,
        status: "REVIEW"
      });
      setSuccessMessage("Document status updated to 'Under Review'.");
      setSelectedDoc(res.data);
      fetchDocuments();
    } catch (err: any) {
      setFormError("Failed to update status.");
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
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith("# ")) {
        return (
          <h1 key={idx} className="text-lg font-bold text-foreground border-b border-border pb-1 mt-5 mb-2.5">
            {line.replace("# ", "")}
          </h1>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h2 key={idx} className="text-sm font-bold text-foreground mt-4 mb-2">
            {line.replace("## ", "")}
          </h2>
        );
      }
      // Bullet lists
      if (line.startsWith("- ")) {
        return (
          <li key={idx} className="text-xs text-muted-foreground ml-4 list-disc mt-1 leading-relaxed">
            {line.replace("- ", "")}
          </li>
        );
      }
      if (line.startsWith("*") && line.endsWith("*")) {
        return (
          <p key={idx} className="text-xs italic text-muted-foreground/75 mt-1">
            {line.replace(/\*/g, "")}
          </p>
        );
      }
      // Tables formatting
      if (line.startsWith("|")) {
        const cells = line.split("|").map((c) => c.trim()).filter((c) => c !== "");
        if (cells[0] && cells[0].startsWith("---")) return null;
        return (
          <div key={idx} className="overflow-x-auto my-1.5">
            <table className="min-w-full divide-y divide-border border border-border rounded-lg text-[10px]">
              <tbody className="bg-card divide-y divide-border">
                <tr className="hover:bg-secondary/20">
                  {cells.map((cell, cIdx) => (
                    <td 
                      key={cIdx} 
                      className="px-2.5 py-1.5 font-semibold text-foreground border-r border-border last:border-0"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        );
      }

      if (line.trim() === "") return <div key={idx} className="h-1.5" />;
      return (
        <p key={idx} className="text-xs text-muted-foreground leading-relaxed my-0.5">
          {line}
        </p>
      );
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
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSignOff}
                    isLoading={signing}
                    className="text-[10px] font-bold h-7.5 py-1 px-3 rounded flex items-center gap-1.5"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    Approve & Sign Off
                  </Button>
                )}
              </div>
            </div>

            {successMessage && <Alert variant="success">{successMessage}</Alert>}
            {formError && <Alert variant="destructive">{formError}</Alert>}

            {/* Document Render Panel */}
            <div className="border border-border/80 bg-background/50 rounded-xl p-5 text-left overflow-y-auto max-h-[500px] shadow-inner select-text">
              {renderMarkdown(selectedDoc.content)}
            </div>
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
