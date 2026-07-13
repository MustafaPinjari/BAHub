import React, { useState, useEffect, useRef } from "react";
import { api } from "../../services/api";
import { Card, Button, Input, Alert } from "../../components/common/UIComponents";
import { useProject } from "../projects/ProjectContext";
import { logger } from "../../utils/logger";
import { 
  Bot, 
  Send, 
  Sparkles, 
  Loader2, 
  FolderGit,
  ShieldAlert,
  Terminal,
  FileSpreadsheet
} from "lucide-react";

interface Message {
  sender: "user" | "assistant";
  text: string;
}

export const AiAssistantPage: React.FC = () => {
  const { activeProject } = useProject();

  // States
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "assistant",
      text: "Hello! I am your AI Business Analyst Assistant. Ask me to draft user stories, analyze project threats, or write QA test scripts based on your active database."
    }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Clear chat context when active project changes
  useEffect(() => {
    if (activeProject) {
      setMessages([
        {
          sender: "assistant",
          text: "Hello! I am your AI Business Analyst Assistant. Ask me to draft user stories, analyze project threats, or write QA test scripts based on your active database."
        }
      ]);
    }
  }, [activeProject]);

  const handleSend = async (messageText: string, actionType = "CHAT") => {
    if (!activeProject || !messageText.trim()) return;
    setError(null);
    
    // Add User Message
    const userMsg: Message = { sender: "user", text: messageText };
    setMessages(prev => [...prev, userMsg]);
    setInputVal("");
    setLoading(true);

    try {
      // Create a placeholder message for streaming response
      const aiMsgIndex = messages.length;
      setMessages(prev => [...prev, { sender: "assistant", text: "" }]);

      // Use streaming endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1"}/strategic/ai/chat/stream/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          project_id: activeProject.id,
          message: messageText,
          action_type: actionType
        })
      });

      if (!response.ok) {
        throw new Error("Failed to connect to AI service");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Response body is not readable");
      }

      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulatedText += parsed.content;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[aiMsgIndex] = { sender: "assistant", text: accumulatedText };
                  return updated;
                });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      setLoading(false);
    } catch (err) {
      logger.error("AI chat failed", err);
      setError("Failed to get AI response. Please try again.");
      setLoading(false);
      // Remove the placeholder message on error
      setMessages(prev => prev.slice(0, -1));
    }
  };

  const triggerQuickAction = (label: string, actionType: string) => {
    handleSend(`Triggering AI Action: ${label}`, actionType);
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
            Select a project context from the Projects list page before interacting with the AI Assistant.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-5 items-stretch select-none text-foreground min-h-[75vh]">
      
      {/* LEFT COLUMN: Chat dialogue window */}
      <div className="w-full lg:w-[65%] flex flex-col gap-4">
        <Card className="p-5 flex flex-col flex-1 bg-card border border-border text-left relative min-h-[480px]">
          
          {/* Header */}
          <div className="flex justify-between items-center border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary border border-primary/20">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">AI Analyst Chatbot</h3>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mt-0.5">
                  Context: {activeProject.name}
                </span>
              </div>
            </div>
          </div>

          {error && <Alert variant="destructive" className="mt-3">{error}</Alert>}

          {/* Messages dialog viewport */}
          <div className="flex-1 overflow-y-auto max-h-[360px] flex flex-col gap-3 my-4 pr-1">
            {messages.map((msg, idx) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={idx}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl p-3 text-xs font-semibold leading-relaxed whitespace-pre-wrap border ${
                      isUser
                        ? "bg-primary text-primary-foreground border-primary/30"
                        : "bg-background text-foreground border-border/80 shadow-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-background text-muted-foreground border border-border/80 rounded-xl p-3 text-xs font-semibold flex items-center gap-2 shadow-sm">
                  <Loader2 className="w-4.5 h-4.5 animate-spin text-primary" />
                  <span>AI Business Analyst is compiling context...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Typing Area */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputVal);
            }} 
            className="flex gap-2 border-t border-border pt-4 mt-auto"
          >
            <Input
              placeholder="Ask a question about project specs..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="text-xs py-2 h-9 rounded-lg"
              disabled={loading}
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!inputVal.trim() || loading}
              className="h-9 w-10 p-0 flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </Card>
      </div>

      {/* RIGHT COLUMN: Quick strategic AI utilities */}
      <div className="w-full lg:w-[35%] flex flex-col gap-4">
        <Card className="p-5 flex flex-col gap-4 bg-card border border-border text-left">
          <div className="border-b border-border pb-2.5">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              Quick AI Actions
            </h3>
            <span className="text-[10px] text-muted-foreground font-semibold leading-relaxed block mt-0.5">
              Instantly draft business analysis components.
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {/* User Stories generator */}
            <div 
              onClick={() => triggerQuickAction("Draft User Stories", "GENERATE_STORIES")}
              className="p-3 border border-border bg-background hover:border-primary/20 rounded-xl cursor-pointer flex gap-3 transition-all"
            >
              <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-500 border border-indigo-500/20 shrink-0 mt-0.5">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground leading-tight">Draft Agile User Stories</span>
                <p className="text-[10px] text-muted-foreground leading-snug mt-1 font-semibold">
                  Generate agile stories and acceptance criteria from requirements.
                </p>
              </div>
            </div>

            {/* Risk Analyst */}
            <div 
              onClick={() => triggerQuickAction("Predict Project Risks", "ANALYZE_RISKS")}
              className="p-3 border border-border bg-background hover:border-primary/20 rounded-xl cursor-pointer flex gap-3 transition-all"
            >
              <div className="w-8 h-8 bg-rose-500/10 rounded-lg flex items-center justify-center text-rose-500 border border-rose-500/20 shrink-0 mt-0.5">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground leading-tight">Predict Project Risks</span>
                <p className="text-[10px] text-muted-foreground leading-snug mt-1 font-semibold">
                  Audit specification sheets to flag gaps and probability levels.
                </p>
              </div>
            </div>

            {/* Test Script compiler */}
            <div 
              onClick={() => triggerQuickAction("Generate Test Cases", "DRAFT_TEST_CASES")}
              className="p-3 border border-border bg-background hover:border-primary/20 rounded-xl cursor-pointer flex gap-3 transition-all"
            >
              <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-600 border border-emerald-500/20 shrink-0 mt-0.5">
                <Terminal className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground leading-tight">Generate Test Cases</span>
                <p className="text-[10px] text-muted-foreground leading-snug mt-1 font-semibold">
                  Draft test verification scripts matching requirement parameters.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

    </div>
  );
};
