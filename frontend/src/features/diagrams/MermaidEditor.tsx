import React, { useState, useEffect, useRef } from "react";
import mermaid from "mermaid";
import { Card, Button, Input, Badge } from "../../components/common/UIComponents";
import { Loader2, Send, Save, ArrowLeft, Wand2 } from "lucide-react";
import { api } from "../../services/api";
import { logger } from "../../utils/logger";

interface MermaidEditorProps {
  projectId: string;
  diagramId: string | null;
  onBackToDashboard: () => void;
}

export const MermaidEditor: React.FC<MermaidEditorProps> = ({ projectId, diagramId, onBackToDashboard }) => {
  const [sourceCode, setSourceCode] = useState<string>("graph TD;\n    A[Start] --> B{Decision};\n    B -- Yes --> C[Result 1];\n    B -- No --> D[Result 2];");
  const [diagramName, setDiagramName] = useState("Untitled Diagram");
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai", text: string }[]>([]);
  const [saving, setSaving] = useState(false);
  
  const mermaidRef = useRef<HTMLDivElement>(null);

  // Initialize mermaid configuration
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      themeVariables: {
        primaryColor: "#4f46e5",
        primaryTextColor: "#ffffff",
        primaryBorderColor: "#3730a3",
        lineColor: "#64748b",
        secondaryColor: "#1e1e2f",
        tertiaryColor: "#1e293b",
      },
      fontFamily: "Inter, sans-serif",
    });
  }, []);

  // Fetch existing diagram if opening an existing one
  useEffect(() => {
    if (diagramId && diagramId !== "new-ai" && diagramId !== "new-mermaid") {
      api.get(`/diagrams/${diagramId}/`)
        .then((res: any) => {
          setDiagramName(res.data.name);
          if (res.data.source_code) {
            setSourceCode(res.data.source_code);
          }
        })
        .catch(err => logger.error("Failed to load diagram", err));
    }
  }, [diagramId]);

  // Render mermaid when sourceCode changes
  useEffect(() => {
    const renderDiagram = async () => {
      if (mermaidRef.current && sourceCode.trim()) {
        try {
          mermaidRef.current.innerHTML = "";
          const { svg } = await mermaid.render(`mermaid-svg-${Date.now()}`, sourceCode);
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg;
          }
        } catch (error) {
          console.error("Mermaid syntax error:", error);
          // If syntax error, we don't break the UI, just leave it as is or show error text.
        }
      }
    };
    renderDiagram();
  }, [sourceCode]);

  const handleGenerate = async () => {
    if (!chatInput.trim()) return;
    
    // Add user message to chat
    setChatHistory(prev => [...prev, { role: "user", text: chatInput }]);
    const currentPrompt = chatInput;
    setChatInput("");
    setIsGenerating(true);

    try {
      // Build contextual prompt including current code if modifying
      const contextualPrompt = `Current Diagram Code:\n${sourceCode}\n\nUser Request: ${currentPrompt}`;
      
      const res = await api.post<any, { data: { mermaid_code: string } }>("/diagram/generate/", {
        prompt: contextualPrompt
      });
      
      if (res.data.mermaid_code) {
        setSourceCode(res.data.mermaid_code);
        setChatHistory(prev => [...prev, { role: "ai", text: "Updated diagram successfully." }]);
      }
    } catch (err) {
      logger.error("Failed to generate diagram", err);
      setChatHistory(prev => [...prev, { role: "ai", text: "Failed to generate diagram. Please check credits." }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        project: projectId,
        name: diagramName,
        diagram_type: "MERMAID",
        source_code: sourceCode,
        canvas_json: {} // Empty for mermaid
      };

      if (!diagramId || diagramId === "new-mermaid") {
        await api.post("/diagrams/", payload);
      } else {
        await api.put(`/diagrams/${diagramId}/`, payload);
      }
      onBackToDashboard();
    } catch (err) {
      logger.error("Failed to save", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4 select-none">
      {/* Left: Chat side-panel */}
      <Card className="w-80 flex flex-col border-border bg-card shadow-sm h-full shrink-0">
        <div className="p-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-indigo-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Diagram Chat</h2>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Describe what you want to draw, e.g., "Add a failover loop to the auth node".
          </p>
        </div>

        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
          {chatHistory.length === 0 && (
            <div className="text-center py-10 text-xs text-muted-foreground italic font-semibold">
              No chat history yet. Ask me to build a flowchart, sequence diagram, or ERD.
            </div>
          )}
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`px-3 py-2 rounded-lg text-xs font-medium max-w-[90%] ${
                msg.role === "user" 
                  ? "bg-indigo-600 text-white rounded-br-none" 
                  : "bg-secondary/50 text-foreground border border-border rounded-bl-none"
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-500 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              Generating Mermaid code...
            </div>
          )}
        </div>

        <div className="p-3 border-t border-border bg-muted/20">
          <div className="flex gap-2">
            <Input 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
              placeholder="e.g. Add a user login node..."
              className="text-xs h-9"
              disabled={isGenerating}
            />
            <Button size="icon" onClick={handleGenerate} disabled={isGenerating || !chatInput.trim()} className="bg-indigo-600 hover:bg-indigo-700 h-9 w-9 shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Right: Diagram Preview & Code Editor */}
      <Card className="flex-1 flex flex-col border-border bg-card shadow-sm h-full overflow-hidden">
        <div className="p-3 border-b border-border bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBackToDashboard} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <input 
              value={diagramName}
              onChange={(e) => setDiagramName(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-sm text-foreground focus:ring-0 p-0 m-0 w-64"
            />
            <Badge variant="secondary" className="text-[9px] uppercase tracking-wider font-bold">Mermaid.js</Badge>
          </div>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Diagram
          </Button>
        </div>

        <div className="flex-1 flex flex-col">
          {/* Visual Preview */}
          <div className="flex-1 overflow-auto bg-black/5 flex items-center justify-center p-8 relative">
            <div ref={mermaidRef} className="w-full flex justify-center">
              {/* SVG will be injected here */}
            </div>
            
            {/* Syntax Editor Toggle / Display */}
          </div>
          
          {/* Source Code Editor (Bottom pane) */}
          <div className="h-48 border-t border-border bg-[#1e1e1e] flex flex-col">
            <div className="px-3 py-1.5 bg-[#2d2d2d] flex justify-between items-center border-b border-[#444]">
              <span className="text-[10px] font-mono text-gray-400 font-bold tracking-wider">Source Code (Live)</span>
            </div>
            <textarea
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              className="flex-1 bg-transparent text-gray-300 font-mono text-xs p-3 resize-none outline-none focus:ring-0"
              spellCheck={false}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
