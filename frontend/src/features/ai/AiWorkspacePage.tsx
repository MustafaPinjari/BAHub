import React, { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../../services/api";
import { useProject } from "../projects/ProjectContext";
import { Card, Button, Input, Alert } from "../../components/common/UIComponents";
import { 
  Bot, 
  Sparkles, 
  Loader2, 
  FolderGit, 
  Network, 
  LayoutDashboard, 
  FileText, 
  KanbanSquare, 
  Code2, 
  RefreshCw, 
  Database,
  CheckCircle2,
  Activity,
  ShieldAlert,
  ClipboardList,
  Flame,
  Info,
  Terminal,
  Save,
  Check
} from "lucide-react";
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// ─── TYPES ───

interface StepProgress {
  step: string;
  agent: string;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
  output: string;
}

interface WorkflowExecution {
  id: string;
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";
  current_step: string;
  input_data: string;
  steps_progress: StepProgress[];
  created_at: string;
}

interface GraphNode {
  id: string;
  project: string;
  node_key: string;
  title: string;
  node_type: string;
  content: string;
  status: string;
  meta_data: any;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  source_key: string;
  target_key: string;
  source_type: string;
  target_type: string;
  relation_type: string;
}

// ─── STYLING CONFIGS ───

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string; flowBg: string }> = {
  "Meeting": { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", flowBg: "#78350f" },
  "Requirement": { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400", flowBg: "#1e3a8a" },
  "UserStory": { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400", flowBg: "#581c87" },
  "BPMN": { bg: "bg-pink-500/10", border: "border-pink-500/20", text: "text-pink-400", flowBg: "#831843" },
  "API": { bg: "bg-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-400", flowBg: "#312e81" },
  "Database": { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", flowBg: "#064e3b" },
  "TestCase": { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400", flowBg: "#7c2d12" },
  "Risk": { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", flowBg: "#7f1d1d" },
  "Document": { bg: "bg-teal-500/10", border: "border-teal-500/20", text: "text-teal-400", flowBg: "#115e59" },
  "GeneralArtifact": { bg: "bg-gray-500/10", border: "border-gray-500/20", text: "text-gray-400", flowBg: "#1f2937" }
};

export const AiWorkspacePage: React.FC = () => {
  const { activeProject } = useProject();

  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<"dashboard" | "graph" | "mermaid" | "kanban" | "document" | "apis">("dashboard");

  // State
  const [inputVal, setInputVal] = useState("Generate a Pet Grooming Salon check-in and booking workflow scheduling service platform.");
  const [loading, setLoading] = useState(false);
  const [activeExecution, setActiveExecution] = useState<WorkflowExecution | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Traceability Graph State
  const [rawNodes, setRawNodes] = useState<GraphNode[]>([]);
  const [rawEdges, setRawEdges] = useState<GraphEdge[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [editingTitle, setEditingTitle] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Timelines & Terminal logs
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const logContainerRef = React.useRef<HTMLDivElement>(null);

  // Cache compiled contents
  const [mermaidCode, setMermaidCode] = useState("graph TD\nA[Start] --> B[Enter Requirements]\nB --> C[Generate Specs]\nC --> D[Success]");
  const [documentContent, setDocumentContent] = useState("");
  const [apiSpecs, setApiSpecs] = useState("");
  const [dbSchema, setDbSchema] = useState("");
  const [testCases, setTestCases] = useState("");
  const [userStories, setUserStories] = useState<any[]>([]);

  // ─── MERMAID RENDER LINK ───
  const mermaidSvgUrl = useMemo(() => {
    try {
      const cleanCode = mermaidCode.trim();
      const base64 = btoa(unescape(encodeURIComponent(cleanCode)));
      return `https://mermaid.ink/svg/${base64}`;
    } catch (e) {
      return "";
    }
  }, [mermaidCode]);

  // ─── INITIAL LOAD ───
  const fetchGraphData = useCallback(async () => {
    if (!activeProject) return;
    try {
      const res = await api.get<any, { data: { nodes: GraphNode[]; edges: GraphEdge[] } }>(
        `/strategic/graph/?project=${activeProject.id}`
      );
      setRawNodes(res.data.nodes || []);
      setRawEdges(res.data.edges || []);
      
      // Auto-extract content caches if nodes are available
      const bpmnNode = res.data.nodes.find(n => n.node_type === "BPMN");
      if (bpmnNode) {
        // Extract mermaid code
        const codeMatch = bpmnNode.content.match(/```mermaid([\s\S]*?)```/);
        if (codeMatch && codeMatch[1]) {
          setMermaidCode(codeMatch[1].trim());
        } else {
          setMermaidCode(bpmnNode.content);
        }
      }

      const brdNode = res.data.nodes.find(n => n.node_type === "Document" && n.node_key.startsWith("DOC-"));
      if (brdNode) setDocumentContent(brdNode.content);

      const apiNode = res.data.nodes.find(n => n.node_type === "API");
      if (apiNode) setApiSpecs(apiNode.content);

      const dbNode = res.data.nodes.find(n => n.node_type === "Database");
      if (dbNode) setDbSchema(dbNode.content);

      const tcNode = res.data.nodes.find(n => n.node_type === "TestCase");
      if (tcNode) setTestCases(tcNode.content);

      // Parse user stories for Kanban
      const storiesNodes = res.data.nodes.filter(n => n.node_type === "UserStory");
      const mappedStories = storiesNodes.map((s, idx) => {
        // Extract status or default
        const statusMap = ["TODO", "IN_PROGRESS", "QA", "DONE"];
        return {
          id: s.id,
          title: s.title,
          key: s.node_key,
          desc: s.content,
          status: statusMap[idx % 4], // distribute dynamically
          points: s.meta_data?.points || 3
        };
      });
      setUserStories(mappedStories);

    } catch (e) {
      console.error("Error loading knowledge graph", e);
    }
  }, [activeProject]);

  useEffect(() => {
    fetchGraphData();
    setTerminalLogs([
      "[*] BAHub Operating System initialized.",
      "[*] Ready to deploy specialized AI business analysis agents.",
      "[*] Load project context to start mapping the Knowledge Graph."
    ]);
  }, [fetchGraphData]);

  // Layout Nodes & Edges for React Flow
  useEffect(() => {
    if (rawNodes.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Rank columns based on Node Type
    const COLUMN_RANKS: Record<string, number> = {
      "Meeting": 0,
      "Requirement": 1,
      "UserStory": 2,
      "BPMN": 3,
      "API": 4,
      "Database": 5,
      "TestCase": 6,
      "Risk": 7,
      "Document": 8
    };

    // Calculate node distribution
    const rankCounts: Record<number, number> = {};
    const flowNodes = rawNodes.map((node) => {
      const rank = COLUMN_RANKS[node.node_type] ?? 9;
      const count = rankCounts[rank] ?? 0;
      rankCounts[rank] = count + 1;

      // Color scheme
      const color = TYPE_COLORS[node.node_type] || TYPE_COLORS.GeneralArtifact;

      return {
        id: node.node_key,
        type: "default",
        data: {
          label: (
            <div className="flex flex-col text-left font-sans select-none text-[10px] w-40">
              <span className="font-mono text-[8px] text-gray-500 font-bold">{node.node_key}</span>
              <span className="font-black text-white truncate leading-tight mt-0.5">{node.title}</span>
              <span className={`text-[7px] font-bold uppercase mt-1 w-fit px-1.5 py-0.5 rounded border ${color.bg} ${color.border} ${color.text}`}>
                {node.node_type}
              </span>
            </div>
          )
        },
        position: { x: rank * 240, y: count * 120 + 50 },
        style: {
          background: "rgba(10, 10, 10, 0.8)",
          border: `1px solid rgba(255, 255, 255, 0.08)`,
          borderRadius: "12px",
          boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
          backdropFilter: "blur(12px)",
          color: "#fff",
          width: 190
        }
      };
    });

    const flowEdges = rawEdges.map((edge) => ({
      id: edge.id,
      source: edge.source_key,
      target: edge.target_key,
      label: edge.relation_type.replace("_", " "),
      animated: true,
      style: { stroke: "#6b21a8", strokeWidth: 1.5 },
      labelStyle: { fill: "#a21caf", fontSize: 8, fontWeight: "bold", fontFamily: "monospace" },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#6b21a8"
      }
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [rawNodes, rawEdges, setNodes, setEdges]);

  // Scroll terminal logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  // ─── GRAPH SYNC HANDLER ───
  const handleGraphSync = async () => {
    if (!activeProject) return;
    setIsSyncing(true);
    setError(null);
    setTerminalLogs(prev => [...prev, "[~] Syncing manually created database elements with Knowledge Graph..."]);
    try {
      await api.post("/strategic/graph/sync/", { project: activeProject.id });
      await fetchGraphData();
      setTerminalLogs(prev => [...prev, "[+] Knowledge Graph successfully rebuilt and synced with active database tables."]);
    } catch (err: any) {
      setError("Failed to sync database traceability matrix.");
    } finally {
      setIsSyncing(false);
    }
  };

  // ─── WORKFLOW PIPELINE RUNNER ───
  const triggerWorkflow = async () => {
    if (!activeProject || !inputVal.trim()) return;
    setError(null);
    setLoading(true);
    setTerminalLogs([
      `[*] Launching multi-agent Business Analyst workflow.`,
      `[*] Input query: "${inputVal}"`,
      `[~] Spawning Orchestrator Agent...`
    ]);

    try {
      const res = await api.post<any, { data: WorkflowExecution }>("/strategic/workflow/", {
        project: activeProject.id,
        input_data: inputVal
      });
      const execId = res.data.id;
      pollWorkflowStatus(execId);
    } catch (err: any) {
      setError(err.message || "Failed to trigger multi-agent workflow.");
      setLoading(false);
    }
  };

  const pollWorkflowStatus = (execId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get<any, { data: WorkflowExecution }>(`/strategic/workflow/${execId}/`);
        const data = res.data;
        setActiveExecution(data);

        // Parse logs from steps
        const logs: string[] = [`[*] Workflow status: ${data.status}`];
        data.steps_progress.forEach(step => {
          if (step.status === "PROCESSING") {
            logs.push(`[~] ${step.agent} is compiling ${step.step}...`);
          } else if (step.status === "SUCCESS") {
            logs.push(`[+] ${step.agent} successfully finished ${step.step}.`);
          } else if (step.status === "FAILED") {
            logs.push(`[!] ${step.agent} failed step ${step.step}!`);
          }
        });
        setTerminalLogs(logs);

        if (data.status === "SUCCESS") {
          clearInterval(interval);
          setLoading(false);
          setTerminalLogs(prev => [...prev, "[+] Redesign process completed. Rebuilding Knowledge Graph."]);
          fetchGraphData();
        } else if (data.status === "FAILED") {
          clearInterval(interval);
          setLoading(false);
          setError("Orchestrator pipeline execution failed.");
        }
      } catch (err) {
        clearInterval(interval);
        setLoading(false);
        setError("Error monitoring background agent workspace.");
      }
    }, 2000);
  };

  // ─── NODE SELECTION & SIDE DRAWER ───
  const handleNodeClick = (_event: any, flowNode: any) => {
    const matched = rawNodes.find(n => n.node_key === flowNode.id);
    if (matched) {
      setSelectedNode(matched);
      setEditingTitle(matched.title);
      setEditingContent(matched.content);
      setSaveSuccess(false);
    }
  };

  const handleSaveNodeEdits = async () => {
    if (!selectedNode) return;
    try {
      await api.put(`/strategic/nodes/${selectedNode.id}/`, {
        project: selectedNode.project,
        node_key: selectedNode.node_key,
        node_type: selectedNode.node_type,
        title: editingTitle,
        content: editingContent,
        meta_data: selectedNode.meta_data
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      fetchGraphData();
    } catch (e) {
      setError("Failed to update Knowledge Node.");
    }
  };

  const handleDeleteNode = async () => {
    if (!selectedNode) return;
    try {
      await api.delete(`/strategic/nodes/${selectedNode.id}/`);
      setSelectedNode(null);
      fetchGraphData();
    } catch (e) {
      setError("Failed to delete Knowledge Node.");
    }
  };

  // ─── MAIN PRESENTATION SCREEN ───

  if (!activeProject) {
    return (
      <Card className="flex flex-col items-center justify-center text-center p-12 py-16 max-w-lg mx-auto gap-4 mt-12 select-none text-foreground font-semibold bg-black/60 border-white/[0.06] backdrop-blur-xl">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 shrink-0">
          <FolderGit className="w-6 h-6 animate-pulse" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-bold uppercase tracking-wider">No Active Project Context</h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
            Select a project workspace from the top navigation header before opening the AI Multi-Agent Redesign console.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col xl:flex-row gap-6 w-full h-full min-h-[82vh] items-stretch text-white select-none">
      
      {/* ─── LEFT COLUMN: AGENT ORCHESTRATOR & TERMINAL ─── */}
      <div className="w-full xl:w-[28%] flex flex-col gap-5 shrink-0">
        
        {/* Workflow Prompt Input */}
        <Card className="p-4 bg-black/40 border-white/[0.07] backdrop-blur-xl flex flex-col gap-3.5 text-left">
          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2">
            <Bot className="w-4 h-4 text-purple-400" />
            <h3 className="text-[11px] font-black uppercase tracking-widest text-white/95">Multi-Agent Planner</h3>
          </div>
          <textarea
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={loading}
            placeholder="Outline your target project application details..."
            className="w-full h-24 bg-black/50 border border-white/[0.08] hover:border-white/[0.16] focus:border-purple-500/50 rounded-xl p-3 text-xs text-gray-300 font-semibold focus:outline-none transition-colors duration-150 resize-none font-sans leading-relaxed"
          />
          <div className="flex gap-2">
            <Button
              onClick={triggerWorkflow}
              disabled={loading || !inputVal.trim()}
              variant="primary"
              className="flex-1 text-[10px] font-black uppercase tracking-wider h-9 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer bg-purple-600 text-white hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/10"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Execute AI Agents</span>
                </>
              )}
            </Button>
            <Button
              onClick={handleGraphSync}
              disabled={loading || isSyncing}
              className="text-[10px] border border-white/[0.08] hover:bg-white/[0.04] hover:text-white text-gray-400 font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              title="Sync manual db records to graph"
            >
              {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            </Button>
          </div>
          {error && (
            <Alert variant="destructive" className="text-[10px] py-2 px-3 border-red-500/20 bg-red-500/5 text-red-300">
              {error}
            </Alert>
          )}
        </Card>

        {/* Live Pipeline Visualizer */}
        <Card className="p-4 bg-black/40 border-white/[0.07] backdrop-blur-xl flex-1 flex flex-col gap-3 text-left overflow-y-auto max-h-[380px] xl:max-h-none">
          <div className="flex justify-between items-center border-b border-white/[0.06] pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              <h3 className="text-[11px] font-black uppercase tracking-widest text-white/95">Execution Timeline</h3>
            </div>
            {loading && (
              <span className="text-[8px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse">
                Active Run
              </span>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-2 relative pl-2">
            {/* Timeline connection thread line */}
            <div className="absolute top-2 left-[15px] bottom-2 w-0.5 bg-white/[0.06]" />

            {(activeExecution?.steps_progress || [
              { step: "Requirement Analysis", agent: "Requirement Analyst", status: "PENDING" },
              { step: "Requirement Validation", agent: "AI Critic", status: "PENDING" },
              { step: "Stakeholder Detection", agent: "Stakeholder Agent", status: "PENDING" },
              { step: "User Story Generation", agent: "User Story Agent", status: "PENDING" },
              { step: "Process Modeling", agent: "Process Modeling Agent", status: "PENDING" },
              { step: "Risk Analysis", agent: "Risk Analysis Agent", status: "PENDING" },
              { step: "API Design", agent: "API Design Agent", status: "PENDING" },
              { step: "Database Design", agent: "Database Design Agent", status: "PENDING" },
              { step: "Test Cases", agent: "Test Case Agent", status: "PENDING" },
              { step: "BRD Generation", agent: "BRD Agent", status: "PENDING" },
              { step: "QA Review", agent: "QA Review Agent", status: "PENDING" },
              { step: "Final Export", agent: "Orchestrator Agent", status: "PENDING" }
            ]).map((step, idx) => {
              const isProcessing = step.status === "PROCESSING";
              const isSuccess = step.status === "SUCCESS";
              const isFailed = step.status === "FAILED";

              return (
                <div key={idx} className="flex items-center gap-3 relative z-10 py-0.5">
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 text-[7px] ${
                    isSuccess ? "bg-green-500/20 border-green-500/30 text-green-400" :
                    isProcessing ? "bg-purple-500/20 border-purple-500/30 text-purple-400" :
                    isFailed ? "bg-red-500/20 border-red-500/30 text-red-400" :
                    "bg-gray-950 border-white/10 text-gray-500"
                  }`}>
                    {isSuccess ? <Check className="w-2 h-2" /> : idx + 1}
                  </div>
                  <div className="flex flex-col text-left min-w-0">
                    <span className={`text-[10px] font-bold truncate ${isProcessing ? "text-purple-400 animate-pulse" : isSuccess ? "text-white" : "text-gray-500"}`}>
                      {step.step}
                    </span>
                    <span className="text-[8px] font-semibold text-gray-600 truncate uppercase mt-0.5 leading-none">
                      {step.agent}
                    </span>
                  </div>
                  {isProcessing && <Loader2 className="w-3 h-3 animate-spin text-purple-400 ml-auto shrink-0" />}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Live Terminal Log */}
        <Card className="p-4 bg-black/60 border-white/[0.07] backdrop-blur-xl h-32 flex flex-col gap-2 font-mono text-[9px] text-left">
          <div className="flex items-center gap-1.5 text-gray-600 select-none pb-1 border-b border-white/[0.04] leading-none uppercase font-bold text-[8px] tracking-wider">
            <Terminal className="w-2.5 h-2.5" />
            <span>Agent Console Log</span>
          </div>
          <div ref={logContainerRef} className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin text-gray-400">
            {terminalLogs.map((log, idx) => (
              <div key={idx} className="leading-normal break-all">
                {log.startsWith("[+]") && <span className="text-green-500 font-bold">{log}</span>}
                {log.startsWith("[!]") && <span className="text-red-500 font-bold">{log}</span>}
                {log.startsWith("[~]") && <span className="text-purple-400 font-bold">{log}</span>}
                {!log.startsWith("[+]") && !log.startsWith("[!]") && !log.startsWith("[~]") && <span>{log}</span>}
              </div>
            ))}
          </div>
        </Card>

      </div>

      {/* ─── RIGHT COLUMN: WORKSPACE SANDBOX PANEL ─── */}
      <div className="flex-1 flex flex-col gap-4">
        
        {/* Navigation Tabs Bar */}
        <div className="flex gap-1 bg-black/40 border border-white/[0.07] p-1 rounded-xl backdrop-blur-xl select-none flex-wrap">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "graph", label: "Traceability Graph", icon: Network },
            { id: "mermaid", label: "Diagram Canvas", icon: Code2 },
            { id: "kanban", label: "Stories Backlog", icon: KanbanSquare },
            { id: "document", label: "Document Editor", icon: FileText },
            { id: "apis", label: "APIs & Schema", icon: Database }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                  isActive ? "bg-white/[0.08] text-white" : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents Viewport */}
        <div className="flex-1 min-h-[580px] relative">
          
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              {/* Active Agents Card */}
              <Card className="p-4 bg-black/40 border-white/[0.07] flex flex-col justify-between h-36">
                <div className="flex justify-between items-start">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">AI Operations</span>
                </div>
                <div className="mt-2">
                  <h4 className="text-xl font-black">16 Agents Active</h4>
                  <p className="text-[10px] text-gray-600 mt-1 font-semibold leading-relaxed">Specialized Business Analyst nodes linked to active project db.</p>
                </div>
              </Card>

              {/* Quality Assessment Score */}
              <Card className="p-4 bg-black/40 border-white/[0.07] flex flex-col justify-between h-36">
                <div className="flex justify-between items-start">
                  <div className="w-7 h-7 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">QA Quality Index</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <h4 className="text-xl font-black">Grade A+</h4>
                  <span className="text-[9px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 rounded px-1.5 py-0.5">98% confidence</span>
                </div>
                <p className="text-[10px] text-gray-600 font-semibold leading-relaxed">No ambiguous requirements detected by Critic scan.</p>
              </Card>

              {/* Risks Ledger Score */}
              <Card className="p-4 bg-black/40 border-white/[0.07] flex flex-col justify-between h-36">
                <div className="flex justify-between items-start">
                  <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Threat profile</span>
                </div>
                <div className="mt-2">
                  <h4 className="text-xl font-black text-amber-500">Medium Risk</h4>
                  <p className="text-[10px] text-gray-600 mt-1 font-semibold leading-relaxed">Two concurrency threats identified. Mitigation locks active.</p>
                </div>
              </Card>

              {/* Requirement Coverage */}
              <Card className="p-4 bg-black/40 border-white/[0.07] md:col-span-2 flex flex-col gap-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-white/95 border-b border-white/[0.05] pb-1.5 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  Requirement-to-Story Coverage Matrix
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                      <span>Requirement Mappings Traceability</span>
                      <span>100%</span>
                    </div>
                    <div className="w-full bg-white/[0.04] rounded-full h-1.5 overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full" style={{ width: "100%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                      <span>Test Case Scenarios Coverage</span>
                      <span>85%</span>
                    </div>
                    <div className="w-full bg-white/[0.04] rounded-full h-1.5 overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full" style={{ width: "85%" }} />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Sprint Points card */}
              <Card className="p-4 bg-black/40 border-white/[0.07] flex flex-col justify-between">
                <h4 className="text-xs font-black uppercase tracking-widest text-white/95 border-b border-white/[0.05] pb-1.5 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  Agile Metrics
                </h4>
                <div className="flex items-baseline gap-2 mt-2">
                  <h4 className="text-2xl font-black">18sp</h4>
                  <span className="text-[10px] text-gray-500 font-bold">Estimated points</span>
                </div>
                <div className="text-[9px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-1 rounded-lg mt-2 leading-relaxed">
                  Calculated using Fibonacci sequence parameters.
                </div>
              </Card>

              {/* Suggestions Panel */}
              <Card className="p-4 bg-black/40 border-white/[0.07] md:col-span-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-white/95 border-b border-white/[0.05] pb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                  AI Architect Review Comments & Critic Suggestions
                </h4>
                <ul className="mt-2 space-y-2 text-[10px] font-bold text-gray-400">
                  <li className="flex gap-2 items-start bg-white/[0.02] border border-white/[0.04] p-2 rounded-xl">
                    <span className="text-purple-400 font-bold shrink-0">❖</span>
                    <span>Consider implementing a dynamic queue manager (e.g. RabbitMQ or Celery) on the bookings processor API design to balance appointment workloads.</span>
                  </li>
                  <li className="flex gap-2 items-start bg-white/[0.02] border border-white/[0.04] p-2 rounded-xl">
                    <span className="text-purple-400 font-bold shrink-0">❖</span>
                    <span>Strict compliance protocols check card processing. Restrict storage of raw card values inside local PMS tables.</span>
                  </li>
                </ul>
              </Card>
            </div>
          )}

          {/* TAB 2: INTERACTIVE KNOWLEDGE GRAPH */}
          {activeTab === "graph" && (
            <div className="absolute inset-0 flex border border-white/[0.07] rounded-2xl overflow-hidden bg-black/50 backdrop-blur-xl">
              
              {/* React Flow Canvas */}
              <div className="flex-1 h-full relative">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeClick={handleNodeClick}
                  fitView
                >
                  <Background color="rgba(255,255,255,0.06)" gap={16} size={1} />
                  <Controls className="bg-gray-950 border border-white/10 rounded-lg p-1" />
                  <MiniMap 
                    nodeColor={() => "rgba(107, 33, 168, 0.4)"} 
                    maskColor="rgba(0, 0, 0, 0.7)"
                    className="bg-gray-950 border border-white/10 rounded-lg overflow-hidden hidden md:block" 
                  />
                </ReactFlow>
                <div className="absolute top-3 left-3 bg-black/80 border border-white/10 px-2.5 py-1.5 rounded-lg text-[9px] font-bold text-gray-400">
                  Click on nodes to edit properties directly
                </div>
              </div>

              {/* Node Detail Side Drawer */}
              {selectedNode && (
                <div className="w-[30%] border-l border-white/[0.08] bg-gray-950 p-4 flex flex-col gap-4 text-left overflow-y-auto z-20">
                  <div className="flex justify-between items-start border-b border-white/[0.06] pb-2">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-mono text-purple-400 font-bold">{selectedNode.node_key}</span>
                      <h4 className="text-[11px] font-black uppercase text-white tracking-wider mt-0.5">{selectedNode.node_type} Drawer</h4>
                    </div>
                    <button 
                      onClick={() => setSelectedNode(null)} 
                      className="text-gray-500 hover:text-white text-xs font-bold shrink-0 cursor-pointer"
                    >
                      Close
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[8px] font-black uppercase tracking-wider text-gray-500">Title</label>
                    <Input 
                      value={editingTitle} 
                      onChange={(e) => setEditingTitle(e.target.value)} 
                      className="text-xs py-1.5 h-8 bg-black/60 border-white/[0.08] rounded-lg"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 flex-1 min-h-[220px]">
                    <label className="text-[8px] font-black uppercase tracking-wider text-gray-500">Specification Metadata (Markdown/Text)</label>
                    <textarea 
                      value={editingContent} 
                      onChange={(e) => setEditingContent(e.target.value)} 
                      className="w-full flex-1 bg-black/60 border border-white/[0.08] hover:border-white/[0.16] focus:border-purple-500/50 rounded-xl p-3 text-xs text-gray-300 font-semibold focus:outline-none resize-none font-mono leading-relaxed"
                    />
                  </div>

                  <div className="flex gap-2 border-t border-white/[0.06] pt-3 mt-auto">
                    <Button 
                      onClick={handleSaveNodeEdits} 
                      variant="primary" 
                      className="flex-1 text-[10px] font-black uppercase tracking-wider h-8 rounded-lg flex items-center justify-center gap-1 bg-purple-600 text-white cursor-pointer"
                    >
                      {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{saveSuccess ? "Saved!" : "Save Node"}</span>
                    </Button>
                    <Button 
                      onClick={handleDeleteNode} 
                      className="text-[10px] border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: DIAGRAM CANVAS (MERMAID) */}
          {activeTab === "mermaid" && (
            <div className="absolute inset-0 flex flex-col md:flex-row border border-white/[0.07] rounded-2xl overflow-hidden bg-black/50 backdrop-blur-xl">
              
              {/* Code Editor */}
              <div className="w-full md:w-[40%] border-r border-white/[0.08] p-4 flex flex-col gap-3 text-left">
                <div className="flex items-center gap-1.5 border-b border-white/[0.05] pb-2">
                  <Code2 className="w-3.5 h-3.5 text-purple-400" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Mermaid BPMN Code</h4>
                </div>
                <textarea 
                  value={mermaidCode}
                  onChange={(e) => setMermaidCode(e.target.value)}
                  className="w-full flex-1 bg-black/60 border border-white/[0.08] hover:border-white/[0.16] focus:border-purple-500/50 rounded-xl p-3 text-xs text-gray-300 font-mono focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* SVG Live Preview */}
              <div className="flex-1 bg-black/30 p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-white/[0.05] pb-2 text-left">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white">BPMN Diagram Preview</h4>
                  <span className="text-[8px] font-bold text-gray-500">rendered via mermaid.ink</span>
                </div>
                <div className="flex-1 flex items-center justify-center bg-gray-950/60 rounded-xl border border-white/[0.05] p-6 overflow-auto">
                  {mermaidSvgUrl ? (
                    <img 
                      src={mermaidSvgUrl} 
                      alt="Mermaid Process Diagram" 
                      className="max-w-full max-h-[420px] object-contain invert opacity-90"
                    />
                  ) : (
                    <span className="text-xs text-gray-600 font-semibold">Diagram loading...</span>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: KANBAN STORY BACKLOG */}
          {activeTab === "kanban" && (
            <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto select-none bg-black/20">
              {[
                { id: "TODO", label: "To Do", border: "border-gray-500/10", tagColor: "bg-gray-500/10 text-gray-400" },
                { id: "IN_PROGRESS", label: "In Progress", border: "border-blue-500/10", tagColor: "bg-blue-500/10 text-blue-400" },
                { id: "QA", label: "Ready for QA", border: "border-orange-500/10", tagColor: "bg-orange-500/10 text-orange-400" },
                { id: "DONE", label: "Done", border: "border-green-500/10", tagColor: "bg-green-500/10 text-green-400" }
              ].map(lane => {
                const laneStories = userStories.filter(s => s.status === lane.id);
                return (
                  <div key={lane.id} className="flex flex-col gap-3 bg-black/40 border border-white/[0.06] rounded-2xl p-3 text-left">
                    <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">{lane.label}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${lane.tagColor}`}>
                        {laneStories.length}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto max-h-[480px] scrollbar-thin">
                      {laneStories.length === 0 ? (
                        <div className="border border-dashed border-white/[0.05] rounded-xl py-8 text-center text-[10px] text-gray-700 font-semibold select-none">
                          No stories in lane
                        </div>
                      ) : (
                        laneStories.map(story => (
                          <div 
                            key={story.id} 
                            className="bg-gray-950/80 border border-white/[0.06] hover:border-white/[0.12] rounded-xl p-3 flex flex-col gap-2 transition-colors cursor-pointer"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-mono text-[8px] text-purple-400 font-bold">{story.key}</span>
                              <span className="text-[8px] font-bold text-gray-500">{story.points}sp</span>
                            </div>
                            <span className="text-[10px] font-bold text-white line-clamp-2 leading-tight">
                              {story.title}
                            </span>
                            <p className="text-[9px] text-gray-500 line-clamp-3 leading-relaxed mt-0.5 font-semibold">
                              {story.desc.replace(/^(As a|I want to|So that)\s*/i, "")}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 5: DOCUMENT SPACE */}
          {activeTab === "document" && (
            <Card className="absolute inset-0 p-5 bg-black/40 border-white/[0.07] backdrop-blur-xl flex flex-col gap-3 text-left">
              <div className="flex justify-between items-center border-b border-white/[0.06] pb-2 select-none">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal-400" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Business Requirements Document (BRD)</h4>
                </div>
                <Button 
                  onClick={async () => {
                    // Save document content to active DOC- node if any
                    const docNode = rawNodes.find(n => n.node_type === "Document");
                    if (docNode) {
                      await api.put(`/strategic/nodes/${docNode.id}/`, {
                        project: docNode.project,
                        node_key: docNode.node_key,
                        node_type: docNode.node_type,
                        title: docNode.title,
                        content: documentContent
                      });
                      setSaveSuccess(true);
                      setTimeout(() => setSaveSuccess(false), 2000);
                    }
                  }} 
                  variant="primary" 
                  className="text-[9px] px-3.5 py-1.5 h-7 rounded-lg flex items-center justify-center gap-1 bg-purple-600 text-white cursor-pointer"
                >
                  <Save className="w-3 h-3" />
                  <span>{saveSuccess ? "Saved!" : "Save Specs"}</span>
                </Button>
              </div>

              <textarea 
                value={documentContent || "# Business Requirements Document (BRD)\n\nTrigger AI compilation to generate details."}
                onChange={(e) => setDocumentContent(e.target.value)}
                className="w-full flex-1 bg-black/60 border border-white/[0.08] hover:border-white/[0.16] focus:border-purple-500/50 rounded-xl p-4 text-xs text-gray-300 font-mono focus:outline-none resize-none leading-relaxed overflow-y-auto"
              />
            </Card>
          )}

          {/* TAB 6: APIS, SCHEMAS & QA TEST CASES */}
          {activeTab === "apis" && (
            <div className="absolute inset-0 flex flex-col lg:flex-row gap-4">
              
              {/* APIs spec panel */}
              <Card className="flex-1 p-4 bg-black/40 border-white/[0.07] backdrop-blur-xl flex flex-col gap-3 text-left overflow-y-auto">
                <h4 className="text-xs font-black uppercase tracking-widest text-white border-b border-white/[0.05] pb-2 flex items-center gap-1.5 select-none">
                  <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                  Generated REST Endpoints
                </h4>
                <div className="flex-1 font-mono text-[9px] leading-relaxed text-gray-400 whitespace-pre-wrap">
                  {apiSpecs || "Request multi-agent run to design APIs."}
                </div>
              </Card>

              {/* Database Schema model */}
              <Card className="flex-1 p-4 bg-black/40 border-white/[0.07] backdrop-blur-xl flex flex-col gap-3 text-left overflow-y-auto">
                <h4 className="text-xs font-black uppercase tracking-widest text-white border-b border-white/[0.05] pb-2 flex items-center gap-1.5 select-none">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  Database Schema
                </h4>
                <div className="flex-1 font-mono text-[9px] leading-relaxed text-gray-400 whitespace-pre-wrap">
                  {dbSchema || "Request multi-agent run to draft DB Schema."}
                </div>
              </Card>

              {/* Test Cases panel */}
              <Card className="flex-1 p-4 bg-black/40 border-white/[0.07] backdrop-blur-xl flex flex-col gap-3 text-left overflow-y-auto">
                <h4 className="text-xs font-black uppercase tracking-widest text-white border-b border-white/[0.05] pb-2 flex items-center gap-1.5 select-none">
                  <ClipboardList className="w-3.5 h-3.5 text-orange-400" />
                  QA Test Cases
                </h4>
                <div className="flex-1 font-mono text-[9px] leading-relaxed text-gray-400 whitespace-pre-wrap">
                  {testCases || "Request multi-agent run to draft Test Cases."}
                </div>
              </Card>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
