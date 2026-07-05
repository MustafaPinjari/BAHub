import React from "react";
import { Handle, Position } from "@xyflow/react";
import * as Icons from "lucide-react";

interface CustomNodeProps {
  id: string;
  data: {
    label: string;
    description?: string;
    shape?: string;
    color?: string;
    icon?: string;
    isLocked?: boolean;
    priority?: string;
    status?: string;
  };
  selected?: boolean;
}

export const CustomNode: React.FC<CustomNodeProps> = ({ id: _id, data, selected }) => {
  // Resolve icon dynamically
  const IconComponent = data.icon && (Icons as any)[data.icon] 
    ? (Icons as any)[data.icon] 
    : Icons.HelpCircle;

  // Visual coloring maps
  const colorMap: Record<string, { bg: string, border: string, text: string, primary: string }> = {
    purple: {
      bg: "bg-purple-500/10 dark:bg-purple-950/20",
      border: "border-purple-500/30 hover:border-purple-500/60",
      text: "text-purple-600 dark:text-purple-400",
      primary: "bg-purple-500"
    },
    indigo: {
      bg: "bg-indigo-500/10 dark:bg-indigo-950/20",
      border: "border-indigo-500/30 hover:border-indigo-500/60",
      text: "text-indigo-600 dark:text-indigo-400",
      primary: "bg-indigo-500"
    },
    emerald: {
      bg: "bg-emerald-500/10 dark:bg-emerald-950/20",
      border: "border-emerald-500/30 hover:border-emerald-500/60",
      text: "text-emerald-600 dark:text-emerald-400",
      primary: "bg-emerald-500"
    },
    rose: {
      bg: "bg-rose-500/10 dark:bg-rose-950/20",
      border: "border-rose-500/30 hover:border-rose-500/60",
      text: "text-rose-600 dark:text-rose-400",
      primary: "bg-rose-500"
    },
    amber: {
      bg: "bg-amber-500/10 dark:bg-amber-950/20",
      border: "border-amber-500/30 hover:border-amber-500/60",
      text: "text-amber-600 dark:text-amber-400",
      primary: "bg-amber-500"
    },
    slate: {
      bg: "bg-slate-500/10 dark:bg-slate-900/20",
      border: "border-slate-500/30 hover:border-slate-500/60",
      text: "text-slate-600 dark:text-slate-400",
      primary: "bg-slate-500"
    }
  };

  const activeColor = colorMap[data.color || "indigo"] || colorMap["indigo"];
  const shape = (data.shape || "Process").toUpperCase();

  // Styles based on shape
  let shapeClass = "rounded-xl border-2 px-4 py-3 min-w-[150px] shadow-sm backdrop-blur-md transition-all";
  if (shape === "BOUNDARY" || shape === "PACKAGE") {
    shapeClass = "rounded-xl border-2 border-dashed p-6 min-w-[280px] min-h-[180px] text-left";
  } else if (shape === "SWIMLANE") {
    shapeClass = "border-2 border-slate-300 dark:border-slate-800 p-4 min-w-[600px] min-h-[120px] text-left rounded-none";
  } else if (shape === "DECISION" || shape === "GATEWAY") {
    // Keep it readable but give it rhombus shape styles
    shapeClass = "rounded-lg border-2 p-3 rotate-45 w-[100px] h-[100px] flex items-center justify-center text-center shadow-md backdrop-blur-md";
  } else if (shape === "EVENT") {
    shapeClass = "rounded-full border-2 w-[70px] h-[70px] flex items-center justify-center shadow-md backdrop-blur-md";
  } else if (shape === "TEXT") {
    shapeClass = "border-none p-1 text-left bg-transparent";
  }

  // Selected state borders
  const borderState = selected 
    ? "border-primary ring-2 ring-primary/20 scale-[1.02]" 
    : `${activeColor.border}`;

  return (
    <div className="relative group select-none">
      {/* Connector Handles */}
      {shape !== "TEXT" && shape !== "BOUNDARY" && shape !== "SWIMLANE" && (
        <>
          <Handle
            type="target"
            position={Position.Top}
            id="t-top"
            className="w-2 h-2 !bg-primary border border-background hover:scale-125 transition-transform"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="s-bottom"
            className="w-2 h-2 !bg-primary border border-background hover:scale-125 transition-transform"
          />
          <Handle
            type="target"
            position={Position.Left}
            id="t-left"
            className="w-2 h-2 !bg-primary border border-background hover:scale-125 transition-transform"
          />
          <Handle
            type="source"
            position={Position.Right}
            id="s-right"
            className="w-2 h-2 !bg-primary border border-background hover:scale-125 transition-transform"
          />
        </>
      )}

      {/* Shapes Content Layouts */}
      {shape === "DECISION" || shape === "GATEWAY" ? (
        <div className={`${activeColor.bg} ${borderState} ${shapeClass}`}>
          <div className="-rotate-45 text-center flex flex-col items-center">
            <span className="text-[10px] font-extrabold leading-tight text-heading truncate max-w-[80px]">
              {data.label}
            </span>
          </div>
        </div>
      ) : shape === "EVENT" ? (
        <div className={`${activeColor.bg} ${borderState} ${shapeClass} flex flex-col items-center justify-center`}>
          <IconComponent className={`w-5 h-5 ${activeColor.text}`} />
          <span className="text-[9px] font-bold text-muted-foreground mt-1 truncate max-w-[60px]">
            {data.label}
          </span>
        </div>
      ) : shape === "TEXT" ? (
        <div className={shapeClass}>
          <p className="text-xs font-bold text-foreground">{data.label}</p>
          {data.description && <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">{data.description}</p>}
        </div>
      ) : shape === "BOUNDARY" || shape === "PACKAGE" ? (
        <div className={`bg-slate-900/5 dark:bg-slate-950/10 border-slate-300 dark:border-slate-800 ${borderState} ${shapeClass}`}>
          <div className="absolute top-2 left-3 flex items-center gap-1.5">
            <IconComponent className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {data.label}
            </span>
          </div>
          {data.description && (
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed mt-4">
              {data.description}
            </p>
          )}
        </div>
      ) : shape === "SWIMLANE" ? (
        <div className={`bg-slate-900/5 dark:bg-slate-950/10 border-slate-300 dark:border-slate-800 ${borderState} ${shapeClass}`}>
          <div className="border-b border-border/40 pb-1 mb-2">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">{data.label}</span>
          </div>
          {data.description && <p className="text-[10px] text-muted-foreground/60">{data.description}</p>}
        </div>
      ) : (
        // Standard process node layout (Actor, DB, Cloud, API, Server, Process, System, User, etc.)
        <div className={`${activeColor.bg} ${borderState} ${shapeClass} border`}>
          <div className="flex items-start gap-2.5">
            <div className={`w-8 h-8 rounded-lg bg-card border border-border/40 flex items-center justify-center ${activeColor.text} shadow-inner`}>
              <IconComponent className="w-4 h-4" />
            </div>
            
            <div className="flex-1 flex flex-col text-left overflow-hidden min-h-[32px] justify-center">
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-xs text-foreground leading-tight truncate">
                  {data.label}
                </span>
                {data.priority && (
                  <span className={`text-[8px] px-1 font-bold rounded ${
                    data.priority === "HIGH" 
                      ? "bg-rose-500/10 text-rose-500" 
                      : data.priority === "MEDIUM" 
                      ? "bg-amber-500/10 text-amber-500" 
                      : "bg-slate-500/10 text-slate-500"
                  }`}>
                    {data.priority}
                  </span>
                )}
              </div>
              {data.description && (
                <span className="text-[10px] text-muted-foreground truncate leading-normal mt-0.5">
                  {data.description}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CustomNode;
