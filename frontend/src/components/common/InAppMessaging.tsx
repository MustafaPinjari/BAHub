import React, { useState, useEffect } from "react";
import { X, Sparkles, Zap, Shield, Users, FileText } from "lucide-react";
import { Button } from "./UIComponents";

interface Message {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  cta?: {
    text: string;
    action: () => void;
  };
  dismissible: boolean;
  priority: "info" | "success" | "warning";
}

interface InAppMessagingProps {
  userRole?: string;
  currentPath?: string;
}

export const InAppMessaging: React.FC<InAppMessagingProps> = ({
  userRole,
  currentPath
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [dismissedMessages, setDismissedMessages] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load dismissed messages from localStorage
    const saved = localStorage.getItem("dismissedMessages");
    if (saved) {
      setDismissedMessages(new Set(JSON.parse(saved)));
    }
  }, []);

  useEffect(() => {
    // Generate contextual messages based on user state
    const generateMessages = (): Message[] => {
      const msgs: Message[] = [];

      // Welcome message for new users
      if (!localStorage.getItem("welcomeShown")) {
        msgs.push({
          id: "welcome",
          title: "Welcome to BAHub!",
          description: "Start by creating your first project or explore our AI-powered analysis tools.",
          icon: <Sparkles className="w-5 h-5 text-purple-400" />,
          cta: {
            text: "Create Project",
            action: () => {
              window.location.href = "/projects";
            }
          },
          dismissible: true,
          priority: "success"
        });
      }

      // Feature discovery messages
      if (userRole === "ADMIN" && !dismissedMessages.has("audit_logs")) {
        msgs.push({
          id: "audit_logs",
          title: "Enable Audit Logs",
          description: "Track all workspace activities with our comprehensive audit logging feature.",
          icon: <Shield className="w-5 h-5 text-blue-400" />,
          cta: {
            text: "View Audit Logs",
            action: () => {
              window.location.href = "/audit";
            }
          },
          dismissible: true,
          priority: "info"
        });
      }

      // Team collaboration prompt
      if (!dismissedMessages.has("team_invite") && currentPath === "/projects") {
        msgs.push({
          id: "team_invite",
          title: "Invite Your Team",
          description: "Collaborate more effectively by inviting team members to your workspace.",
          icon: <Users className="w-5 h-5 text-green-400" />,
          cta: {
            text: "Go to Teams",
            action: () => {
              window.location.href = "/teams";
            }
          },
          dismissible: true,
          priority: "info"
        });
      }

      // BRD generation prompt
      if (!dismissedMessages.has("brd_feature") && currentPath === "/requirements") {
        msgs.push({
          id: "brd_feature",
          title: "Generate BRD Documents",
          description: "Convert your requirements into professional Business Requirement Documents.",
          icon: <FileText className="w-5 h-5 text-orange-400" />,
          cta: {
            text: "Generate BRD",
            action: () => {
              window.location.href = "/brd";
            }
          },
          dismissible: true,
          priority: "success"
        });
      }

      // AI features promotion
      if (!dismissedMessages.has("ai_features") && currentPath === "/dashboard") {
        msgs.push({
          id: "ai_features",
          title: "Try AI Analysis",
          description: "Let our AI analyze your requirements and generate insights automatically.",
          icon: <Zap className="w-5 h-5 text-yellow-400" />,
          cta: {
            text: "Try AI Workspace",
            action: () => {
              window.location.href = "/ai";
            }
          },
          dismissible: true,
          priority: "warning"
        });
      }

      return msgs;
    };

    setMessages(generateMessages());
  }, [userRole, currentPath, dismissedMessages]);

  const dismissMessage = (messageId: string) => {
    const newDismissed = new Set(dismissedMessages);
    newDismissed.add(messageId);
    setDismissedMessages(newDismissed);
    localStorage.setItem("dismissedMessages", JSON.stringify([...newDismissed]));
    
    // Special handling for welcome message
    if (messageId === "welcome") {
      localStorage.setItem("welcomeShown", "true");
    }

    setMessages(messages.filter(m => m.id !== messageId));
  };

  if (messages.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`relative p-4 rounded-xl border shadow-2xl backdrop-blur-xl ${
            message.priority === "success"
              ? "bg-emerald-950/80 border-emerald-500/30"
              : message.priority === "warning"
              ? "bg-yellow-950/80 border-yellow-500/30"
              : "bg-blue-950/80 border-blue-500/30"
          }`}
        >
          {message.dismissible && (
            <button
              onClick={() => dismissMessage(message.id)}
              className="absolute top-2 right-2 p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-white/60 hover:text-white" />
            </button>
          )}
          
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white/5">
              {message.icon}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-white mb-1">{message.title}</h4>
              <p className="text-xs text-white/70 mb-3 leading-relaxed">{message.description}</p>
              {message.cta && (
                <Button
                  size="sm"
                  onClick={message.cta.action}
                  className="text-xs"
                >
                  {message.cta.text}
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
