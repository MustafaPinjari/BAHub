import React from "react";
import { 
  User, 
  Workflow, 
  Database, 
  Globe, 
  Link2, 
  Cpu, 
  FileText, 
  GitFork, 
  Play, 
  Clock, 
  Package, 
  Layers, 
  Square,
  Type
} from "lucide-react";

interface ToolboxItem {
  type: string;  // Node Type
  label: string;
  shape: string; // Shape identifier (e.g. Actor, Database, Gateway, Process, Event)
  icon: React.ComponentType<any>;
  color: string;
  desc: string;
}

const TOOLBOX_GROUPS = [
  {
    title: "Flow Elements (BABOK / BPMN)",
    items: [
      { type: "process", label: "Process Step", shape: "Process", icon: Workflow, color: "indigo", desc: "A task or activity in a workflow" },
      { type: "gateway", label: "Decision Gateway", shape: "Gateway", icon: GitFork, color: "amber", desc: "Evaluate conditions or fork flows" },
      { type: "event", label: "Process Event", shape: "Event", icon: Play, color: "emerald", desc: "Start, end, or middle trigger point" },
      { type: "timer", label: "Timer Event", shape: "Event", icon: Clock, color: "amber", desc: "Schedule or delay action points" },
    ]
  },
  {
    title: "Architecture & Systems (UML)",
    items: [
      { type: "actor", label: "Business Actor", shape: "Actor", icon: User, color: "purple", desc: "External user or stakeholder role" },
      { type: "database", label: "Database / Store", shape: "Database", icon: Database, color: "emerald", desc: "Data storage or persistence table" },
      { type: "cloud", label: "Cloud Service", shape: "Process", icon: Globe, color: "indigo", desc: "External web hosted service" },
      { type: "api", label: "API Gateway / Link", shape: "Process", icon: Link2, color: "rose", desc: "Application interface endpoint" },
      { type: "server", label: "App Server", shape: "Process", icon: Cpu, color: "indigo", desc: "Computation or backend container" },
      { type: "document", label: "Document", shape: "Process", icon: FileText, color: "slate", desc: "Generated files, reports, or sheets" },
    ]
  },
  {
    title: "Containers & Text",
    items: [
      { type: "boundary", label: "System Boundary", shape: "Boundary", icon: Square, color: "slate", desc: "Define system scope box" },
      { type: "swimlane", label: "Swimlane Lane", shape: "Swimlane", icon: Layers, color: "slate", desc: "Group actions by department or role" },
      { type: "package", label: "Package", shape: "Package", icon: Package, color: "indigo", desc: "Group related UML components" },
      { type: "text", label: "Text Label", shape: "Text", icon: Type, color: "slate", desc: "Freeform text header annotation" }
    ]
  }
];

export const SidebarToolbox: React.FC = () => {
  const onDragStart = (event: React.DragEvent, item: ToolboxItem) => {
    event.dataTransfer.setData("application/reactflow", JSON.stringify({
      type: item.type,
      label: item.label,
      shape: item.shape,
      color: item.color,
      icon: item.icon.name || "HelpCircle",
      desc: item.desc
    }));
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="w-56 border-r border-border bg-card/60 backdrop-blur-md p-3 flex flex-col gap-4 select-none shrink-0 overflow-y-auto">
      <div>
        <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Toolbox</h3>
        <p className="text-[9px] text-muted-foreground/60 leading-normal mt-0.5 font-semibold">
          Drag elements onto the canvas workspace.
        </p>
      </div>

      <nav className="flex-1 flex flex-col gap-4">
        {TOOLBOX_GROUPS.map((group, idx) => (
          <div key={idx} className="flex flex-col gap-1.5 text-left">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground/80 border-b border-border/40 pb-0.5">
              {group.title}
            </span>
            <div className="flex flex-col gap-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    draggable
                    onDragStart={(e) => onDragStart(e, item as any)}
                    className="flex items-center gap-2 p-1.5 rounded-lg bg-card/75 border border-border hover:border-primary/30 hover:bg-secondary/60 cursor-grab active:cursor-grabbing text-[11px] font-semibold text-foreground transition-all duration-100"
                    title={item.desc}
                  >
                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
};
