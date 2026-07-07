import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  ReactFlowProvider,
  useReactFlow,
  MarkerType
} from "@xyflow/react";
import type { Connection, Edge, Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { api } from "../../services/api";
import { SidebarToolbox } from "./components/SidebarToolbox";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { CollaborationPanel } from "./components/CollaborationPanel";
import { AIModal } from "./components/AIModal";
import { CustomNode } from "./components/CustomNode";
import { Button, Input } from "../../components/common/UIComponents";
import { 
  LayoutDashboard, 
  Save, 
  Undo2, 
  Redo2, 
  Sparkles, 
  Download, 
  AlignLeft, 
  GitBranch, 
  FileText,
  X,
  History as HistoryIcon
} from "lucide-react";

const nodeTypes = {
  actor: CustomNode,
  system: CustomNode,
  database: CustomNode,
  server: CustomNode,
  cloud: CustomNode,
  api: CustomNode,
  user: CustomNode,
  decision: CustomNode,
  document: CustomNode,
  storage: CustomNode,
  process: CustomNode,
  subprocess: CustomNode,
  event: CustomNode,
  gateway: CustomNode,
  timer: CustomNode,
  text: CustomNode,
  boundary: CustomNode,
  swimlane: CustomNode,
  package: CustomNode
};

interface DiagramCanvasProps {
  projectId: string;
  diagramId: string | null; // null if creating a new one
  onBackToDashboard: () => void;
}

const DiagramCanvasContent: React.FC<DiagramCanvasProps> = ({
  projectId,
  diagramId,
  onBackToDashboard,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  // Active diagram properties
  const [diagramName, setDiagramName] = useState("");
  const [diagramDesc, setDiagramDesc] = useState("");
  const [diagramType, setDiagramType] = useState("BPMN 2.0");
  const [diagramStatus, setDiagramStatus] = useState("DRAFT");
  const [diagramVersion, setDiagramVersion] = useState("1.0");
  const [isLocked, setIsLocked] = useState(false);
  const [lockedByUsername, setLockedByUsername] = useState<string | null>(null);

  // Canvas React Flow hooks
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [copiedNode, setCopiedNode] = useState<any>(null);
  const [floatingEditor, setFloatingEditor] = useState<{
    x: number;
    y: number;
    elementId: string;
    value: string;
    isEdge: boolean;
  } | null>(null);

  // Documentation Pane State
  const [documentation, setDocumentation] = useState("");
  const [showDocPane, setShowDocPane] = useState(false);

  // Modals & Panels State
  const [aiOpen, setAiOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkpointOpen, setCheckpointOpen] = useState(false);
  const [checkpointName, setCheckpointName] = useState("");
  const [changeDesc, setChangeDesc] = useState("");

  // History stack for Undo/Redo
  const [historyPast, setHistoryPast] = useState<Array<{ nodes: Node[]; edges: Edge[] }>>([]);
  const [historyFuture, setHistoryFuture] = useState<Array<{ nodes: Node[]; edges: Edge[] }>>([]);

  // Fetch diagram payload if editing
  useEffect(() => {
    const loadDiagram = async () => {
      if (!diagramId || diagramId === "new-ai") {
        if (diagramId === "new-ai") {
          setAiOpen(true);
        }
        // Initialize default empty structure
        setDiagramName("Untitled Diagram");
        setDiagramDesc("");
        setNodes([]);
        setEdges([]);
        setDocumentation("");
        return;
      }

      try {
        const res = await api.get<any, { data: any }>(`/diagrams/${diagramId}/`);
        const data = res.data;
        setDiagramName(data.name);
        setDiagramDesc(data.description);
        setDiagramType(data.diagram_type);
        setDiagramStatus(data.status);
        setDiagramVersion(data.version);
        setIsLocked(data.is_locked);
        setLockedByUsername(data.locked_by_username);
        setDocumentation(data.documentation || "");

        // Load Canvas JSON
        const canvas = data.canvas_json || {};
        setNodes(canvas.nodes || []);
        setEdges(canvas.edges || []);
      } catch (err) {
        console.error("Failed to load diagram elements:", err);
      }
    };
    loadDiagram();
  }, [diagramId]);

  // Document Save callback
  const handleSave = async (isAuto = false) => {
    if (!diagramName.trim()) return;
    if (!isAuto) setSaving(true);

    const canvasJson = {
      nodes,
      edges,
      ai_generated: diagramId === "new-ai" || selectedElement?.data?.ai_generated
    };

    try {
      const payload = {
        project: projectId,
        name: diagramName,
        description: diagramDesc,
        diagram_type: diagramType,
        status: diagramStatus,
        version: diagramVersion,
        canvas_json: canvasJson,
        documentation: documentation
      };

      if (!diagramId || diagramId === "new-ai") {
        await api.post<any, { data: any }>("/diagrams/", payload);
        // Refresh mapping
        window.location.reload();
      } else {
        await api.put(`/diagrams/${diagramId}/`, payload);
      }
    } catch (err) {
      console.error("Failed to save diagram model:", err);
    } finally {
      if (!isAuto) setSaving(false);
    }
  };

  // Push Canvas State to Undo stack
  const pushToHistory = useCallback(() => {
    setHistoryPast((prev) => [...prev, { nodes: [...nodes], edges: [...edges] }]);
    setHistoryFuture([]); // Clear redo stack on new action
  }, [nodes, edges]);

  // Undo action trigger
  const triggerUndo = () => {
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryPast((prev) => prev.slice(0, prev.length - 1));
    setHistoryFuture((prev) => [...prev, { nodes: [...nodes], edges: [...edges] }]);
    setNodes(previous.nodes);
    setEdges(previous.edges);
  };

  // Redo action trigger
  const triggerRedo = () => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[historyFuture.length - 1];
    setHistoryFuture((prev) => prev.slice(0, prev.length - 1));
    setHistoryPast((prev) => [...prev, { nodes: [...nodes], edges: [...edges] }]);
    setNodes(next.nodes);
    setEdges(next.edges);
  };

  // Drag and Drop implementation
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const rawData = event.dataTransfer.getData("application/reactflow");

      if (!rawData || !reactFlowBounds) return;

      const item = JSON.parse(rawData);
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `node_${Date.now()}`,
        type: item.type,
        position,
        data: {
          label: item.label,
          description: item.desc,
          shape: item.shape,
          color: item.color,
          icon: item.icon,
          priority: "MEDIUM",
          status: "DRAFT",
          version: "1.0",
          owner: ""
        },
      };

      pushToHistory();
      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, pushToHistory, setNodes]
  );

  // Connect shapes
  const onConnect = useCallback(
    (params: Connection) => {
      pushToHistory();
      setEdges((eds) => addEdge({
        ...params,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#6366F1" },
        style: { stroke: "#6366F1", strokeWidth: 2 }
      }, eds));
    },
    [pushToHistory, setEdges]
  );

  // Double click inline editors for nodes and edges
  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.stopPropagation();
    const rect = reactFlowWrapper.current?.getBoundingClientRect();
    if (!rect) return;
    setFloatingEditor({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      elementId: node.id,
      value: String((node.data as any).label || ""),
      isEdge: false
    });
  }, []);

  const onEdgeDoubleClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    const rect = reactFlowWrapper.current?.getBoundingClientRect();
    if (!rect) return;
    setFloatingEditor({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      elementId: edge.id,
      value: typeof edge.label === "string" ? edge.label : "",
      isEdge: true
    });
  }, []);

  // Selected item node settings update callback
  const handleUpdateElement = (id: string, updatedData: any) => {
    pushToHistory();
    if (selectedElement?.source) {
      // It is an edge
      setEdges((eds) => eds.map((e) => (e.id === id ? { ...e, ...updatedData } : e)));
    } else {
      // It is a node
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...updatedData } } : n))
      );
    }
  };

  const handleDeleteElement = (id: string) => {
    pushToHistory();
    if (selectedElement?.source) {
      setEdges((eds) => eds.filter((e) => e.id !== id));
    } else {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    }
    setSelectedElement(null);
  };

  // Collaboration Locking Toggle
  const handleLockToggle = async () => {
    if (!diagramId) return;
    try {
      if (isLocked) {
        await api.post(`/diagrams/${diagramId}/unlock/`);
        setIsLocked(false);
        setLockedByUsername(null);
      } else {
        await api.post(`/diagrams/${diagramId}/lock/`);
        setIsLocked(true);
        setLockedByUsername("Me");
      }
    } catch (err) {
      alert("Failed to toggle editing lock.");
    }
  };

  // Checkpoint restore handler
  const handleRestoreVersion = async (versionId: string) => {
    if (!diagramId) return;
    if (!confirm("Are you sure you want to restore the canvas to this checkpoint snapshot?")) return;
    try {
      const res = await api.post<any, { data: any }>(`/diagrams/${diagramId}/restore/`, {
        version_id: versionId
      });
      const data = res.data;
      setNodes(data.canvas_json?.nodes || []);
      setEdges(data.canvas_json?.edges || []);
      setDocumentation(data.documentation || "");
      setDiagramVersion(data.version);
      alert("Canvas restored successfully.");
    } catch (err) {
      alert("Failed to restore checkpoint.");
    }
  };

  // Pre-defined layout helper (Horizontal vs Vertical ranker)
  const autoLayout = () => {
    const levelMap: Record<string, number> = {};
    const adj: Record<string, string[]> = {};
    const indegree: Record<string, number> = {};

    nodes.forEach((n) => {
      levelMap[n.id] = 0;
      adj[n.id] = [];
      indegree[n.id] = 0;
    });

    edges.forEach((e) => {
      if (adj[e.source] && e.target in levelMap) {
        adj[e.source].push(e.target);
        indegree[e.target]++;
      }
    });

    const queue: string[] = [];
    nodes.forEach((n) => {
      if (indegree[n.id] === 0) queue.push(n.id);
    });

    while (queue.length > 0) {
      const u = queue.shift()!;
      const currentLevel = levelMap[u];
      adj[u].forEach((v) => {
        levelMap[v] = Math.max(levelMap[v], currentLevel + 1);
        queue.push(v);
      });
    }

    const levelGroups: Record<number, string[]> = {};
    nodes.forEach((n) => {
      const lvl = levelMap[n.id] || 0;
      if (!levelGroups[lvl]) levelGroups[lvl] = [];
      levelGroups[lvl].push(n.id);
    });

    pushToHistory();
    const isSequence = diagramType.toUpperCase().includes("SEQUENCE") || diagramType.toUpperCase().includes("ERD");
    const updatedNodes = nodes.map((n) => {
      const lvl = levelMap[n.id] || 0;
      const index = levelGroups[lvl].indexOf(n.id);
      
      const x = isSequence ? index * 240 + 50 : lvl * 220 + 80;
      const y = isSequence ? lvl * 140 + 80 : index * 120 + 80;

      return {
        ...n,
        position: { x, y }
      };
    });

    setNodes(updatedNodes);
  };

  // Node alignment helpers (align selected elements)
  const alignNodes = (axis: "top" | "left") => {
    // Aligns positions to the topmost or leftmost selected node
    const selectedNodes = nodes.filter(n => n.selected);
    if (selectedNodes.length < 2) {
      alert("Select at least 2 shapes (Shift + Click and Drag) to align.");
      return;
    }
    
    pushToHistory();
    let alignVal = axis === "top" 
      ? Math.min(...selectedNodes.map(n => n.position.y))
      : Math.min(...selectedNodes.map(n => n.position.x));

    const updatedNodes = nodes.map((n) => {
      if (n.selected) {
        return {
          ...n,
          position: axis === "top" 
            ? { ...n.position, y: alignVal }
            : { ...n.position, x: alignVal }
        };
      }
      return n;
    });
    setNodes(updatedNodes);
  };

  // Key Down listeners (Undo, Redo, Copy, Paste, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if inside form input or textarea
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      if (e.ctrlKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        triggerUndo();
      } else if (e.ctrlKey && e.key.toLowerCase() === "y") {
        e.preventDefault();
        triggerRedo();
      } else if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      } else if (e.ctrlKey && e.key.toLowerCase() === "c") {
        // Copy selected node
        const activeNode = nodes.find(n => n.selected);
        if (activeNode) {
          e.preventDefault();
          setCopiedNode(activeNode);
        }
      } else if (e.ctrlKey && e.key.toLowerCase() === "v") {
        // Paste copied node
        if (copiedNode) {
          e.preventDefault();
          const newNode: Node = {
            ...copiedNode,
            id: `node_copy_${Date.now()}`,
            selected: false,
            position: {
              x: copiedNode.position.x + 40,
              y: copiedNode.position.y + 40
            }
          };
          pushToHistory();
          setNodes((nds) => nds.concat(newNode));
        }
      } else if (e.key === "Delete" || e.key === "Backspace") {
        const activeNode = nodes.find(n => n.selected);
        if (activeNode) {
          handleDeleteElement(activeNode.id);
        }
        const activeEdge = edges.find(ed => ed.selected);
        if (activeEdge) {
          handleDeleteElement(activeEdge.id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nodes, edges, copiedNode, pushToHistory]);

  // Export Downloads triggers
  const triggerExport = async (format: "mermaid" | "plantuml" | "drawio" | "bpmn") => {
    if (!diagramId) {
      alert("Please save your diagram first before exporting.");
      return;
    }
    try {
      const res = await api.get<any, { data: any }>(`/diagrams/${diagramId}/export/?format=${format}`);
      const content = res.data.content;
      const blob = new Blob([content], { type: res.data.content_type });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${diagramName.replace(/\s+/g, "_")}_model.${format === "drawio" || format === "bpmn" ? "xml" : "txt"}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export diagram.");
    }
  };

  // Checkpoint creator submission
  const handleCreateCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagramId) return;

    try {
      await api.post(`/diagrams/${diagramId}/save-checkpoint/`, {
        checkpoint_name: checkpointName,
        change_description: changeDesc,
        version: diagramVersion
      });
      setCheckpointOpen(false);
      setCheckpointName("");
      setChangeDesc("");
      alert("Checkpoint version saved successfully!");
      // Reload versions history list
      window.location.reload();
    } catch (err) {
      alert("Failed to save checkpoint.");
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-[inherit]">
      {/* Canvas Navbar Toolbar */}
      <header className="h-12 border-b border-border bg-card/65 backdrop-blur-md px-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3 text-left">
          <Button variant="ghost" size="sm" onClick={onBackToDashboard} className="p-1 px-2.5 h-8 bg-secondary/30">
            <LayoutDashboard className="w-3.5 h-3.5 mr-1" />
            Dashboard
          </Button>
          
          <div className="flex flex-col">
            <input
              type="text"
              value={diagramName}
              onChange={(e) => setDiagramName(e.target.value)}
              className="bg-transparent font-extrabold text-xs text-foreground outline-none border-b border-transparent focus:border-primary placeholder:text-muted-foreground w-40"
              placeholder="Diagram name..."
            />
            <span className="text-[9px] text-muted-foreground font-bold tracking-wider capitalize">
              {diagramType} - v{diagramVersion}
            </span>
          </div>
        </div>

        {/* Toolbar utilities */}
        <div className="flex items-center gap-2">
          {/* Alignment Tools */}
          <div className="flex border border-border rounded-lg bg-card/50 p-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => alignNodes("top")}
              title="Align Top"
              className="w-7 h-7"
            >
              <span className="text-[10px] font-bold">⤒</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => alignNodes("left")}
              title="Align Left"
              className="w-7 h-7"
            >
              <span className="text-[10px] font-bold">⤓</span>
            </Button>
          </div>

          <Button variant="ghost" size="sm" onClick={autoLayout} className="h-8 text-[11px] font-bold bg-secondary/20">
            <GitBranch className="w-3.5 h-3.5 mr-1" />
            Auto Layout
          </Button>

          <Button variant="ghost" size="sm" onClick={triggerUndo} disabled={historyPast.length === 0} className="h-8 w-8 p-0">
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={triggerRedo} disabled={historyFuture.length === 0} className="h-8 w-8 p-0">
            <Redo2 className="w-3.5 h-3.5" />
          </Button>

          <Button variant="ghost" size="sm" onClick={() => setAiOpen(true)} className="h-8 text-[11px] font-bold text-primary border border-primary/15 hover:bg-primary/5 bg-primary/5">
            <Sparkles className="w-3.5 h-3.5 mr-1 fill-primary/10" />
            AI Assistant
          </Button>

          {/* Export Dropdown */}
          <div className="relative group">
            <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold border-border/80">
              <Download className="w-3.5 h-3.5 mr-1" />
              Export
            </Button>
            <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border shadow-lg rounded-xl p-1.5 hidden group-hover:flex flex-col gap-0.5 z-30 text-left select-none">
              <button onClick={() => triggerExport("mermaid")} className="w-full text-left px-2.5 py-1.5 text-[10px] font-bold text-foreground hover:bg-secondary rounded-lg">
                Mermaid Code
              </button>
              <button onClick={() => triggerExport("plantuml")} className="w-full text-left px-2.5 py-1.5 text-[10px] font-bold text-foreground hover:bg-secondary rounded-lg">
                PlantUML File
              </button>
              <button onClick={() => triggerExport("drawio")} className="w-full text-left px-2.5 py-1.5 text-[10px] font-bold text-foreground hover:bg-secondary rounded-lg">
                Draw.io XML
              </button>
              <button onClick={() => triggerExport("bpmn")} className="w-full text-left px-2.5 py-1.5 text-[10px] font-bold text-foreground hover:bg-secondary rounded-lg">
                BPMN 2.0 XML
              </button>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={() => setCheckpointOpen(true)} className="h-8 text-[11px] font-bold" disabled={!diagramId}>
            Checkpoint
          </Button>

          <Button size="sm" onClick={() => handleSave()} isLoading={saving} className="h-8 text-[11px]">
            <Save className="w-3.5 h-3.5 mr-1" />
            Save Canvas
          </Button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Shape Toolbox */}
        <SidebarToolbox />

        {/* Canvas Area wrapper */}
        <div 
          ref={reactFlowWrapper} 
          className="flex-1 h-full relative"
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => setSelectedElement(node)}
            onEdgeClick={(_, edge) => setSelectedElement(edge)}
            onNodeDoubleClick={onNodeDoubleClick}
            onEdgeDoubleClick={onEdgeDoubleClick}
            onPaneClick={() => setSelectedElement(null)}
            fitView
            snapToGrid={true}
            snapGrid={[10, 10]}
          >
            <Controls className="!bg-card border border-border rounded-lg" />
            <MiniMap 
              className="!bg-card/90 border border-border/80 rounded-xl overflow-hidden shadow-md"
              nodeColor={() => "rgb(var(--primary))"}
              maskColor="rgba(0, 0, 0, 0.1)"
            />
            <Background gap={12} size={1} />
          </ReactFlow>

          {/* Floating Inline Editor Overlay */}
          {floatingEditor && (
            <div 
              className="absolute z-50 bg-card/95 border border-primary/45 rounded-xl shadow-2xl p-2 flex items-center gap-1.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
              style={{ 
                left: Math.max(10, Math.min(floatingEditor.x - 120, (reactFlowWrapper.current?.clientWidth || 0) - 250)),
                top: Math.max(10, Math.min(floatingEditor.y - 20, (reactFlowWrapper.current?.clientHeight || 0) - 60)),
                width: "240px"
              }}
            >
              <input
                type="text"
                value={floatingEditor.value}
                onChange={(e) => setFloatingEditor({ ...floatingEditor, value: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    pushToHistory();
                    if (floatingEditor.isEdge) {
                      setEdges((eds) => eds.map((edge) => edge.id === floatingEditor.elementId ? { ...edge, label: floatingEditor.value } : edge));
                    } else {
                      setNodes((nds) => nds.map((node) => node.id === floatingEditor.elementId ? { ...node, data: { ...node.data, label: floatingEditor.value } } : node));
                    }
                    if (selectedElement && selectedElement.id === floatingEditor.elementId) {
                      setSelectedElement((prev: any) => {
                        if (floatingEditor.isEdge) {
                          return { ...prev, label: floatingEditor.value };
                        } else {
                          return { ...prev, data: { ...prev.data, label: floatingEditor.value } };
                        }
                      });
                    }
                    setFloatingEditor(null);
                  } else if (e.key === "Escape") {
                    setFloatingEditor(null);
                  }
                }}
                onBlur={() => {
                  pushToHistory();
                  if (floatingEditor.isEdge) {
                    setEdges((eds) => eds.map((edge) => edge.id === floatingEditor.elementId ? { ...edge, label: floatingEditor.value } : edge));
                  } else {
                    setNodes((nds) => nds.map((node) => node.id === floatingEditor.elementId ? { ...node, data: { ...node.data, label: floatingEditor.value } } : node));
                  }
                  if (selectedElement && selectedElement.id === floatingEditor.elementId) {
                    setSelectedElement((prev: any) => {
                      if (floatingEditor.isEdge) {
                        return { ...prev, label: floatingEditor.value };
                      } else {
                        return { ...prev, data: { ...prev.data, label: floatingEditor.value } };
                      }
                    });
                  }
                  setFloatingEditor(null);
                }}
                className="w-full bg-secondary/55 text-xs font-bold text-foreground px-2 py-1.5 rounded-lg border border-border outline-none focus:border-primary"
                autoFocus
              />
            </div>
          )}
          
          {/* Documentation Panel Toggle Button */}
          <button
            onClick={() => setShowDocPane(!showDocPane)}
            className="absolute bottom-4 right-4 z-10 px-3.5 py-2 rounded-xl bg-card border border-border hover:border-primary/25 hover:shadow-md flex items-center gap-1.5 text-xs font-bold text-foreground cursor-pointer shadow-sm"
          >
            <AlignLeft className="w-4 h-4 text-primary" />
            <span>{showDocPane ? "Hide Documentation" : "View Documentation"}</span>
          </button>
        </div>

        {/* Right Collapsible Documentation pane */}
        {showDocPane && (
          <div className="w-80 border-l border-border bg-card/65 backdrop-blur-md p-4 flex flex-col gap-3 shrink-0 text-left z-10">
            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <h4 className="font-extrabold text-xs text-foreground flex items-center gap-1">
                <FileText className="w-4 h-4 text-primary" />
                Model Documentation
              </h4>
              <button onClick={() => setShowDocPane(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-[10px] text-muted-foreground leading-normal font-semibold">
              Write purpose constraints and rules. This documentation integrates with generated specifications.
            </p>
            
            <textarea
              value={documentation}
              onChange={(e) => setDocumentation(e.target.value)}
              className="flex-1 w-full p-3 text-xs font-semibold bg-card border border-border rounded-xl text-foreground outline-none focus:border-primary resize-none min-h-[300px] leading-relaxed"
              placeholder="# Purpose&#10;Describe model context...&#10;&#10;# Business Rules&#10;- Rule 1..."
            />
            <Button size="sm" onClick={() => handleSave()} className="w-full text-xs font-bold">
              Save Documentation
            </Button>
          </div>
        )}

        {/* Right Properties drawer */}
        {selectedElement && (
          <PropertiesPanel
            projectId={projectId}
            selectedElement={selectedElement}
            onUpdateElement={handleUpdateElement}
            onDeleteElement={handleDeleteElement}
            onClose={() => setSelectedElement(null)}
          />
        )}

        {/* Right Collaboration Drawer */}
        {diagramId && (
          <CollaborationPanel
            projectId={projectId}
            diagramId={diagramId}
            diagramLocked={isLocked}
            lockedByUsername={lockedByUsername}
            currentUserId=""
            onLockToggle={handleLockToggle}
            onRestoreVersion={handleRestoreVersion}
          />
        )}
      </div>

      {/* AI Assistant Modal */}
      {aiOpen && (
        <AIModal
          projectId={projectId}
          diagramId={diagramId}
          canvasJson={{ nodes, edges }}
          documentation={documentation}
          onClose={() => setAiOpen(false)}
          onGenerateSuccess={(generated) => {
            setNodes(generated.nodes);
            setEdges(generated.edges);
            setDocumentation(generated.documentation);
          }}
        />
      )}

      {/* Create Checkpoint Modal */}
      {checkpointOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-5 flex flex-col gap-4 shadow-2xl text-left">
            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <HistoryIcon className="w-4 h-4 text-primary" />
                <span>Save Checkpoint version</span>
              </h3>
              <button onClick={() => setCheckpointOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCheckpoint} className="flex flex-col gap-3">
              <Input
                label="New Version ID"
                value={diagramVersion}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDiagramVersion(e.target.value)}
                placeholder="e.g. 1.1"
                required
              />
              <Input
                label="Checkpoint Name"
                value={checkpointName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCheckpointName(e.target.value)}
                placeholder="e.g. Approved Sprint 1"
                required
              />
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Change Description</label>
                <textarea
                  value={changeDesc}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setChangeDesc(e.target.value)}
                  placeholder="Summarize structural modifications..."
                  className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border text-foreground outline-none focus:border-primary min-h-[50px]"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
                <Button variant="ghost" size="sm" type="button" onClick={() => setCheckpointOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" type="submit">
                  Save Version
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const DiagramCanvas: React.FC<DiagramCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <DiagramCanvasContent {...props} />
    </ReactFlowProvider>
  );
};
export default DiagramCanvas;
