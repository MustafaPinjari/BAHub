import React, { useState, useEffect, useRef } from "react";
import { api, API_BASE_URL } from "../../services/api";
import { Card, Badge, Button, Input, Select, Alert, Textarea } from "../../components/common/UIComponents";
import { useAuth } from "../auth/AuthContext";
import { useProject } from "../projects/ProjectContext";
import { 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Save,
  Wand2,
  Loader2,
  FolderGit,
  ShieldCheck,
  Info
} from "lucide-react";


interface Stakeholder {
  id: string;
  name: string;
  title: string;
}

interface Requirement {
  id: string;
  project: string;
  req_id: string;
  title: string;
  description: string;
  req_type: "FUNCTIONAL" | "NON_FUNCTIONAL" | "TECHNICAL" | "UI";
  status: "DRAFT" | "REVIEW" | "APPROVED" | "REJECTED";
  priority: "HIGH" | "MEDIUM" | "LOW";
  version: string;
  source_stakeholder: string | null;
  source_stakeholder_detail: Stakeholder | null;
  created_by_username: string;
}

export const RequirementsPage: React.FC = () => {
  const { user } = useAuth();
  const { activeProject } = useProject();

  // States
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [selectedReq, setSelectedReq] = useState<Requirement | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form states for editor
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editType, setEditType] = useState<Requirement["req_type"]>("FUNCTIONAL");
  const [editStatus, setEditStatus] = useState<Requirement["status"]>("DRAFT");
  const [editPriority, setEditPriority] = useState<Requirement["priority"]>("MEDIUM");
  const [editStakeholder, setEditStakeholder] = useState("");
  const [editVersion, setEditVersion] = useState("1.0");

  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState("");

  // WebSocket Co-authoring States
  const socketRef = useRef<WebSocket | null>(null);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");

  const canManage = user ? ["ADMIN", "BUSINESS_ANALYST", "PRODUCT_OWNER"].includes(user.role) : false;

  const fetchRequirements = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const res = await api.get<any, { data: Requirement[] }>(`/requirements/?project=${activeProject.id}`);
      setRequirements(res.data);
      // Auto-select first requirement if none selected
      if (res.data.length > 0 && !selectedReq) {
        loadReqInEditor(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to load requirements:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStakeholders = async () => {
    if (!activeProject) return;
    try {
      const res = await api.get<any, { data: Stakeholder[] }>(`/stakeholders/?project=${activeProject.id}`);
      setStakeholders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequirements();
    fetchStakeholders();
  }, [activeProject]);

  // WebSocket Live Sync Connection Effect
  useEffect(() => {
    if (!activeProject) return;

    setWsStatus("connecting");
    const accessToken = localStorage.getItem("accessToken") || "";
    const wsScheme = window.location.protocol === "https:" ? "wss:" : "ws:";
    const hostUrl = API_BASE_URL.replace(/^https?:\/\//, "").replace(/\/api\/v1\/?$/, "");
    const wsUrl = `${wsScheme}//${hostUrl}/ws/projects/${activeProject.id}/requirements/?token=${accessToken}`;

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setWsStatus("connected");
    };

    socket.onmessage = (event) => {
      try {
        const data = jsonParse(event.data);
        if (!data) return;

        if (data.type === "requirement.update") {
          // Reload specifications silently from database
          fetchRequirementsSilently();
        } else if (data.type === "presence") {
          setActiveUsers((prev) => {
            const userExists = prev.includes(data.user);
            if (data.status === "online" && !userExists) {
              return [...prev, data.user];
            } else if (data.status === "offline" && userExists) {
              return prev.filter((u) => u !== data.user);
            }
            return prev;
          });
        } else if (data.type === "requirement.typing") {
          setTypingUsers((prev) => {
            const copy = { ...prev };
            if (data.is_typing) {
              copy[data.requirement_id] = data.user;
            } else {
              delete copy[data.requirement_id];
            }
            return copy;
          });
        }
      } catch (err) {
        console.error("Failed to parse socket message:", err);
      }
    };

    socket.onclose = () => {
      setWsStatus("disconnected");
      setActiveUsers([]);
      setTypingUsers({});
    };

    return () => {
      socket.close();
    };
  }, [activeProject]);

  const jsonParse = (str: string) => {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  };

  const fetchRequirementsSilently = async () => {
    if (!activeProject) return;
    try {
      const res = await api.get<any, { data: Requirement[] }>(`/requirements/?project=${activeProject.id}`);
      setRequirements(res.data);
    } catch (err) {
      console.error("Silent reload failed:", err);
    }
  };

  const broadcastTyping = (reqId: string, isTyping: boolean) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "typing",
        requirement_id: reqId,
        is_typing: isTyping
      }));
    }
  };

  const loadReqInEditor = (req: Requirement) => {
    setSelectedReq(req);
    setEditTitle(req.title);
    setEditDesc(req.description);
    setEditType(req.req_type);
    setEditStatus(req.status);
    setEditPriority(req.priority);
    setEditStakeholder(req.source_stakeholder || "");
    setEditVersion(req.version);
    setFormError(null);
  };

  const handleCreateNew = () => {
    const tempReq: Requirement = {
      id: "new",
      project: activeProject!.id,
      req_id: "NEW",
      title: "Untitled Requirement",
      description: "Provide requirement specification details...",
      req_type: "FUNCTIONAL",
      status: "DRAFT",
      priority: "MEDIUM",
      version: "1.0",
      source_stakeholder: "",
      source_stakeholder_detail: null,
      created_by_username: user?.username || "",
    };
    loadReqInEditor(tempReq);
  };

  const handleSave = async () => {
    if (!selectedReq || !activeProject) return;
    setSaving(true);
    setFormError(null);
    setSuccessMessage(null);

    const payload = {
      project: activeProject.id,
      title: editTitle,
      description: editDesc,
      req_type: editType,
      status: editStatus,
      priority: editPriority,
      version: editVersion,
      source_stakeholder: editStakeholder === "" ? null : editStakeholder,
    };

    try {
      if (selectedReq.id === "new") {
        const res = await api.post<any, { data: Requirement }>("/requirements/", payload);
        setSuccessMessage("Requirement created successfully.");
        loadReqInEditor(res.data);
      } else {
        const res = await api.put<any, { data: Requirement }>(`/requirements/${selectedReq.id}/`, payload);
        setSuccessMessage("Requirement changes saved.");
        loadReqInEditor(res.data);
      }
      fetchRequirements();
    } catch (err: any) {
      setFormError(err.message || "Failed to save requirement details.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedReq || selectedReq.id === "new") return;
    if (!window.confirm("Are you sure you want to delete this requirement specification?")) return;
    setFormError(null);
    setSuccessMessage(null);

    try {
      await api.delete(`/requirements/${selectedReq.id}/`);
      setSuccessMessage("Requirement deleted successfully.");
      setSelectedReq(null);
      fetchRequirements();
    } catch (err: any) {
      setFormError("Failed to delete requirement.");
    }
  };

  const triggerAIAssist = () => {
    if (!selectedReq) return;
    setAiGenerating(true);
    setSuccessMessage(null);
    
    // Simulate premium AI acceptance criteria generation
    setTimeout(() => {
      const generatedCriteria = `\n\n### Acceptance Criteria (AI Generated)\n- **GIVEN** a registered business analyst is modifying requirement fields\n- **WHEN** they input details and click the sticky "Save Specifications" action button\n- **THEN** details are validated against active organization schemas and stored.`;
      
      setEditDesc((prev) => prev + generatedCriteria);
      setSuccessMessage("Acceptance criteria generated successfully by AI assistant.");
      setAiGenerating(false);
    }, 1200);
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeProject) return;

    setImporting(true);
    setImportProgress("Reading file...");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setImporting(false);
        setFormError("Could not read CSV file contents.");
        return;
      }

      const lines = text.split(/\r?\n/);
      if (lines.length <= 1) {
        setImporting(false);
        setFormError("CSV file is empty or contains only headers.");
        return;
      }

      const parseCSVLine = (line: string) => {
        const result = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result.map(s => s.replace(/^"|"$/g, '').replace(/""/g, '"'));
      };

      const headers = parseCSVLine(lines[0]);
      const titleIdx = headers.findIndex(h => h.toLowerCase().includes("title"));
      const descIdx = headers.findIndex(h => h.toLowerCase().includes("desc"));
      const typeIdx = headers.findIndex(h => h.toLowerCase().includes("type"));
      const priorityIdx = headers.findIndex(h => h.toLowerCase().includes("priority"));
      const statusIdx = headers.findIndex(h => h.toLowerCase().includes("status"));

      if (titleIdx === -1 || descIdx === -1) {
        setImporting(false);
        setFormError("CSV must contain at least 'Title' and 'Description' columns.");
        return;
      }

      const rowsToImport = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const columns = parseCSVLine(line);
        if (columns.length < 2) continue;
        rowsToImport.push(columns);
      }

      let successCount = 0;
      for (let i = 0; i < rowsToImport.length; i++) {
        const row = rowsToImport[i];
        setImportProgress(`Importing row ${i + 1} of ${rowsToImport.length}...`);

        const title = row[titleIdx] || "Untitled Requirement";
        const description = row[descIdx] || "";
        
        let req_type = "FUNCTIONAL";
        if (typeIdx !== -1 && row[typeIdx]) {
          const rawType = row[typeIdx].toUpperCase().replace(" ", "_");
          if (["FUNCTIONAL", "NON_FUNCTIONAL", "TECHNICAL", "UI"].includes(rawType)) {
            req_type = rawType;
          }
        }

        let priority = "MEDIUM";
        if (priorityIdx !== -1 && row[priorityIdx]) {
          const rawPriority = row[priorityIdx].toUpperCase();
          if (["HIGH", "MEDIUM", "LOW"].includes(rawPriority)) {
            priority = rawPriority;
          }
        }

        let status = "DRAFT";
        if (statusIdx !== -1 && row[statusIdx]) {
          const rawStatus = row[statusIdx].toUpperCase();
          if (["DRAFT", "REVIEW", "APPROVED", "REJECTED"].includes(rawStatus)) {
            status = rawStatus;
          }
        }

        try {
          await api.post("/requirements/", {
            project: activeProject.id,
            title,
            description,
            req_type,
            priority,
            status,
            version: "1.0",
          });
          successCount++;
        } catch (err) {
          console.error(`Failed to import row ${i + 1}:`, err);
        }
      }

      setImporting(false);
      setImportModalOpen(false);
      setSuccessMessage(`Successfully imported ${successCount} requirements.`);
      fetchRequirements();
    };

    reader.readAsText(file);
  };

  // Filtered requirements based on search
  const filteredReqs = requirements.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.req_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "HIGH":
        return <Badge variant="success">High</Badge>;
      case "MEDIUM":
        return <Badge variant="default">Medium</Badge>;
      case "LOW":
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="secondary">{p}</Badge>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "APPROVED":
        return <Badge variant="success">Approved</Badge>;
      case "REVIEW":
        return <Badge variant="default">In Review</Badge>;
      case "REJECTED":
        return <Badge variant="secondary">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

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
            Select a project context from the Projects list page before managing requirements.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5 select-none text-foreground">
      {/* Top Banner: Presence and Live Status */}
      <Card className="p-4 py-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-card border-border">
        <div className="flex items-center gap-2">
          {wsStatus === "connected" ? (
            <Badge variant="success" className="gap-1.5 text-[10px] py-1 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync Active
            </Badge>
          ) : wsStatus === "connecting" ? (
            <Badge variant="warning" className="gap-1.5 text-[10px] py-1 font-bold">
              <Loader2 className="w-3 h-3 animate-spin text-current" />
              Connecting Live Sync...
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1.5 text-[10px] py-1 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              Live Sync Offline
            </Badge>
          )}

          {activeUsers.length > 0 && (
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 ml-3 select-none">
              <span className="uppercase tracking-wider">Active:</span>
              <div className="flex -space-x-1.5 overflow-hidden">
                {activeUsers.map((username) => (
                  <div
                    key={username}
                    title={`@${username} (active)`}
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-black bg-purple-500/10 text-[9px] font-extrabold text-purple-400 uppercase ring-1 ring-white/10"
                  >
                    {username[0]}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
          Requirement Workspace: {activeProject.name}
        </span>
      </Card>

      <div className="h-full flex flex-col md:flex-row gap-5 items-stretch min-h-[70vh]">
        {/* LEFT COLUMN: Backlog Spreadsheet Table */}
        <div className="w-full md:w-[40%] flex flex-col gap-4">
          <Card className="p-4 flex flex-col gap-4 flex-1">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div>
                <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Project Backlog
                </h2>
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block mt-0.5">
                  Requirements Registry
                </span>
              </div>
              {canManage && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateNew}
                    className="text-[10px] font-bold h-7 py-1 px-2.5 rounded"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Req
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setImportModalOpen(true)}
                    className="text-[10px] font-bold h-7 py-1 px-2.5 rounded"
                  >
                    Import CSV
                  </Button>
                </div>
              )}
            </div>

            {/* Quick Search */}
            <Input
              placeholder="Search backlog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs py-1.5 h-8 rounded-md"
            />

            {loading ? (
              <div className="flex items-center justify-center py-10 flex-1">
                <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                <span className="text-xs text-muted-foreground font-semibold">Loading backlog...</span>
              </div>
            ) : filteredReqs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center flex-1 gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-bold text-foreground">
                    {searchQuery ? "No requirements match your search" : "No requirements yet"}
                  </p>
                  <p className="text-[10px] text-muted-foreground max-w-[180px] leading-relaxed">
                    {searchQuery
                      ? "Try a different keyword or clear the filter."
                      : "Create your first requirement to start building your backlog."}
                  </p>
                </div>
                {!searchQuery && canManage && (
                  <button
                    onClick={handleCreateNew}
                    className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    + Create first requirement
                  </button>
                )}
              </div>
            ) : (
              /* Backlog directory rows */
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[500px] pr-1">
                {filteredReqs.map((req) => {
                  const isSelected = selectedReq?.id === req.id;
                  const typingUser = typingUsers[req.id];
                  return (
                    <div
                      key={req.id}
                      onClick={() => loadReqInEditor(req)}
                      className={`p-3.5 border rounded-xl flex items-start justify-between gap-3 cursor-pointer text-left transition-all duration-200 select-none ${
                        isSelected
                          ? "border-primary bg-primary/[0.03] shadow-md shadow-primary/5 scale-[1.01]"
                          : "border-white/[0.06] bg-secondary/10 hover:border-white/[0.14] hover:bg-secondary/20"
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 overflow-hidden w-full">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold text-primary uppercase tracking-wider">{req.req_id}</span>
                          {req.version !== "1.0" && <Badge variant="secondary" className="text-[8px] px-1 py-0 font-bold">v{req.version}</Badge>}
                        </div>
                        <h4 className="font-bold text-xs text-foreground truncate max-w-[200px] mt-0.5">{req.title}</h4>
                        <span className="text-[9px] text-muted-foreground leading-none font-bold uppercase mt-1">
                          Type: {req.req_type.replace("_", " ")}
                        </span>
                        {typingUser && (
                          <span className="text-[9px] font-bold text-indigo-500 animate-pulse mt-1.5 flex items-center gap-1">
                            ✍️ @{typingUser} is editing...
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {getPriorityBadge(req.priority)}
                        {getStatusBadge(req.status)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: Split Notion-Style Document Editor */}
        <div className="w-full md:w-[60%] flex flex-col gap-4">
          {selectedReq ? (
            <Card className="p-6 flex flex-col gap-5 flex-1 relative bg-card border border-border">
              
              {/* Action Header Context */}
              <div className="flex justify-between items-center border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                    {selectedReq.id === "new" ? "New Requirement Profile" : "Notion-style editor"}
                  </span>
                  {selectedReq.id !== "new" && (
                    <Badge variant="default" className="text-[9px]">
                      v{editVersion}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={triggerAIAssist}
                      disabled={aiGenerating}
                      className="text-[10px] font-bold h-7 py-1 px-2.5 rounded text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-100 flex items-center gap-1.5"
                    >
                      {aiGenerating ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Wand2 className="w-3 h-3" />
                      )}
                      AI Assist
                    </Button>
                  )}
                  {selectedReq.id !== "new" && canManage && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDelete}
                      className="text-muted-foreground hover:text-destructive w-7 h-7 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {successMessage && <Alert variant="success">{successMessage}</Alert>}
              {formError && <Alert variant="destructive">{formError}</Alert>}

              {typingUsers[selectedReq.id] && (
                <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-200/50 p-2 rounded-lg font-semibold animate-pulse">
                  <Info className="w-3.5 h-3.5" />
                  <span>@{typingUsers[selectedReq.id]} is currently modifying this requirement.</span>
                </div>
              )}

              {/* Document Workspace Form */}
              <div className="flex flex-col gap-4 overflow-y-auto max-h-[420px] pr-1">
                
                {/* Document Title input */}
                <div className="flex flex-col gap-1">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onFocus={() => broadcastTyping(selectedReq.id, true)}
                    onBlur={() => broadcastTyping(selectedReq.id, false)}
                    placeholder="Requirement Title"
                    disabled={!canManage}
                    className="text-lg font-bold bg-transparent border-b border-transparent focus:border-border outline-none text-foreground pb-1"
                  />
                </div>

                {/* Grid Metadata options */}
                <div className="grid grid-cols-2 gap-4 border-y border-border/60 py-3 bg-secondary/15 px-3 rounded-lg">
                  <Select
                    label="Priority"
                    value={editPriority}
                    disabled={!canManage}
                    onChange={(e) => setEditPriority(e.target.value as any)}
                    options={[
                      { value: "HIGH", label: "High" },
                      { value: "MEDIUM", label: "Medium" },
                      { value: "LOW", label: "Low" },
                    ]}
                  />
                  <Select
                    label="Type"
                    value={editType}
                    disabled={!canManage}
                    onChange={(e) => setEditType(e.target.value as any)}
                    options={[
                      { value: "FUNCTIONAL", label: "Functional" },
                      { value: "NON_FUNCTIONAL", label: "Non-Functional" },
                      { value: "TECHNICAL", label: "Technical" },
                      { value: "UI", label: "UI / UX" },
                    ]}
                  />
                  <Select
                    label="Status"
                    value={editStatus}
                    disabled={!canManage}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    options={[
                      { value: "DRAFT", label: "Draft" },
                      { value: "REVIEW", label: "In Review" },
                      { value: "APPROVED", label: "Approved" },
                      { value: "REJECTED", label: "Rejected" },
                    ]}
                  />
                  <Select
                    label="Traceability (Stakeholder)"
                    value={editStakeholder}
                    disabled={!canManage}
                    onChange={(e) => setEditStakeholder(e.target.value)}
                    options={[
                      { value: "", label: "No linked stakeholder" },
                      ...stakeholders.map((s) => ({
                        value: s.id,
                        label: `${s.name} (${s.title})`,
                      })),
                    ]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Version"
                    value={editVersion}
                    disabled={!canManage}
                    onChange={(e) => setEditVersion(e.target.value)}
                    placeholder="e.g. 1.0"
                  />
                  {selectedReq.id !== "new" && (
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Author</span>
                      <span className="text-xs font-semibold text-foreground mt-2 truncate">
                        @{selectedReq.created_by_username || "System Seeder"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Requirement Description text body */}
                <Textarea
                  label="Requirement Specification"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  onFocus={() => broadcastTyping(selectedReq.id, true)}
                  onBlur={() => broadcastTyping(selectedReq.id, false)}
                  placeholder="Provide requirement definitions, schemas, and details..."
                  rows={8}
                  disabled={!canManage}
                  className="resize-none font-semibold leading-relaxed mt-1 border-white/[0.06] focus:border-primary/40 bg-black/40"
                />
              </div>

              {/* Persistent/Sticky Action Bar */}
              {canManage && (
                <div className="flex items-center justify-end gap-2 border-t border-border pt-4 mt-auto">
                  {selectedReq.status === "REVIEW" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditStatus("APPROVED");
                        setSuccessMessage("Status queued to 'Approved'. Save specifications to apply.");
                      }}
                      className="text-xs font-bold py-1 px-3 border-emerald-200 text-emerald-600 hover:bg-emerald-50/50 flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Approve
                    </Button>
                  )}
                  
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    isLoading={saving}
                    className="text-xs font-bold py-1.5 px-4 flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Specifications
                  </Button>
                </div>
              )}
            </Card>
          ) : (
            <Card className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none text-foreground font-semibold">
              <FileSpreadsheet className="w-10 h-10 text-muted-foreground/30 animate-pulse mb-3" />
              <h3 className="text-sm font-bold uppercase tracking-wider">No Requirement Selected</h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mt-1">
                Select a requirement card from the project backlog table, or click "Add Req" to draft a new specification profile.
              </p>
            </Card>
          )}
        </div>
      </div>
      {/* ── CSV Import Modal ── */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setImportModalOpen(false)} />
          <div className="relative w-full max-w-md bg-gray-950 border border-white/[0.10] rounded-2xl p-6 shadow-2xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <FileSpreadsheet className="w-4 h-4 text-purple-400" /> Import Requirements CSV
            </h2>
            <div className="flex flex-col gap-4 text-left">
              <Alert variant="info" title="CSV Template Guidelines">
                File must contain headers: <code className="font-mono bg-white/10 px-1 py-0.5 rounded text-[10px]">Title,Description,Type,Priority,Status</code>.
              </Alert>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Select CSV File</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  disabled={importing}
                  className="w-full text-xs bg-gray-900 border border-white/[0.08] text-gray-200 rounded-md p-2 outline-none file:bg-white/[0.08] file:border-none file:text-white file:text-xs file:font-semibold file:rounded file:px-2 file:py-1 file:mr-2 file:cursor-pointer"
                />
              </div>

              {importing && (
                <div className="flex items-center gap-2 text-xs text-purple-400 font-semibold mt-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{importProgress}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 mt-4">
                <Button variant="ghost" size="sm" onClick={() => setImportModalOpen(false)} disabled={importing}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
