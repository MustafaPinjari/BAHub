import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { Button, Input, Select } from "../../../components/common/UIComponents";
import { 
  X, 
  Trash2, 
  Settings, 
  Link
} from "lucide-react";
import { MarkerType } from "@xyflow/react";

interface PropertiesPanelProps {
  projectId: string;
  selectedElement: any; // Node or Edge
  onUpdateElement: (id: string, updatedData: any) => void;
  onDeleteElement: (id: string) => void;
  onClose: () => void;
}

const COLOR_OPTIONS = [
  { value: "indigo", label: "Indigo Accent" },
  { value: "purple", label: "Purple (Actors/Roles)" },
  { value: "emerald", label: "Emerald (Success/Start/DB)" },
  { value: "rose", label: "Rose (Danger/End/API)" },
  { value: "amber", label: "Amber (Warning/Gateway)" },
  { value: "slate", label: "Slate (Boundary/Doc)" }
];

const SHAPE_OPTIONS = [
  { value: "Process", label: "Process Step" },
  { value: "Actor", label: "Actor Boundary" },
  { value: "Gateway", label: "Gateway Decision" },
  { value: "Event", label: "Event Circle" },
  { value: "Database", label: "Database Cylinder" },
  { value: "Boundary", label: "System Boundary Box" },
  { value: "Swimlane", label: "Swimlane Column" },
  { value: "Package", label: "UML Package" },
  { value: "Text", label: "Text Label" }
];

const PRIORITY_OPTIONS = [
  { value: "HIGH", label: "High Priority" },
  { value: "MEDIUM", label: "Medium Priority" },
  { value: "LOW", label: "Low Priority" }
];

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft State" },
  { value: "REVIEW", label: "Under Review" },
  { value: "APPROVED", label: "Approved Production" }
];

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  projectId,
  selectedElement,
  onUpdateElement,
  onDeleteElement,
  onClose,
}) => {
  const isEdge = !!selectedElement.source;
  const elementId = selectedElement.id;
  const elementData = selectedElement.data || {};

  // Form States
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("indigo");
  const [shape, setShape] = useState("Process");
  const [priority, setPriority] = useState("MEDIUM");
  const [status, setStatus] = useState("DRAFT");
  const [owner, setOwner] = useState("");
  const [version, setVersion] = useState("1.0");
  const [notes, setNotes] = useState("");

  // Edge Style States
  const [routing, setRouting] = useState("smoothstep");
  const [lineStyle, setLineStyle] = useState("solid");
  const [lineWidth, setLineWidth] = useState("2");
  const [lineColor, setLineColor] = useState("indigo");
  const [arrowhead, setArrowhead] = useState("target");

  // Mapping selection states
  const [requirementId, setRequirementId] = useState("");
  const [stakeholderId, setStakeholderId] = useState("");
  const [userStoryId, setUserStoryId] = useState("");
  const [riskId, setRiskId] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [changeRequestId, setChangeRequestId] = useState("");

  // Text Mappings
  const [task, setTask] = useState("");
  const [businessGoal, setBusinessGoal] = useState("");
  const [businessRule, setBusinessRule] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");

  // Lists loaded from backend
  const [requirements, setRequirements] = useState<any[]>([]);
  const [stakeholders, setStakeholders] = useState<any[]>([]);
  const [userStories, setUserStories] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [changeRequests, setChangeRequests] = useState<any[]>([]);

  // Load backend mappings lists
  useEffect(() => {
    const loadMappings = async () => {
      try {
        const reqs = await api.get<any, { data: any[] }>(`/requirements/?project=${projectId}`);
        setRequirements(reqs.data || []);
        
        const stks = await api.get<any, { data: any[] }>(`/stakeholders/?project=${projectId}`);
        setStakeholders(stks.data || []);
        
        const stories = await api.get<any, { data: any[] }>(`/stories/?project=${projectId}`);
        setUserStories(stories.data || []);
        
        const rks = await api.get<any, { data: any[] }>(`/risks/?project=${projectId}`);
        setRisks(rks.data || []);
        
        const mtgs = await api.get<any, { data: any[] }>(`/meetings/?project=${projectId}`);
        setMeetings(mtgs.data || []);
        
        const crs = await api.get<any, { data: any[] }>(`/risks/change-requests/?project=${projectId}`);
        setChangeRequests(crs.data || []);
      } catch (err) {
        console.warn("Failed to load property mapping metadata:", err);
      }
    };
    loadMappings();
  }, [projectId]);

  // Sync state with selected node change
  useEffect(() => {
    setLabel(selectedElement.label || elementData.label || "");
    
    if (isEdge) {
      const data = selectedElement.data || {};
      setRouting(selectedElement.type || data.routing || "smoothstep");
      setLineStyle(data.lineStyle || "solid");
      setLineWidth(String(data.lineWidth || "2"));
      setLineColor(data.lineColor || "indigo");
      setArrowhead(data.arrowhead || "target");
    } else {
      setDescription(elementData.description || "");
      setColor(elementData.color || "indigo");
      setShape(elementData.shape || "Process");
      setPriority(elementData.priority || "MEDIUM");
      setStatus(elementData.status || "DRAFT");
      setOwner(elementData.owner || "");
      setVersion(elementData.version || "1.0");
      setNotes(elementData.notes || "");

      setRequirementId(elementData.requirementId || elementData.requirement_id || "");
      setStakeholderId(elementData.stakeholderId || elementData.stakeholder_id || "");
      setUserStoryId(elementData.userStoryId || elementData.user_story_id || "");
      setRiskId(elementData.riskId || elementData.risk_id || "");
      setMeetingId(elementData.meetingId || elementData.meeting_id || "");
      setChangeRequestId(elementData.changeRequestId || elementData.change_request_id || "");

      setTask(elementData.task || "");
      setBusinessGoal(elementData.business_goal || elementData.businessGoal || "");
      setBusinessRule(elementData.business_rule || elementData.businessRule || "");
      setAcceptanceCriteria(elementData.acceptance_criteria || elementData.acceptanceCriteria || "");
    }
  }, [selectedElement.id]);

  const updateEdgeStyle = (newParams: {
    label?: string;
    routing?: string;
    lineStyle?: string;
    lineWidth?: string;
    lineColor?: string;
    arrowhead?: string;
  }) => {
    if (!isEdge) return;

    const finalLabel = newParams.label !== undefined ? newParams.label : label;
    const finalRouting = newParams.routing !== undefined ? newParams.routing : routing;
    const finalLineStyle = newParams.lineStyle !== undefined ? newParams.lineStyle : lineStyle;
    const finalLineWidth = newParams.lineWidth !== undefined ? newParams.lineWidth : lineWidth;
    const finalLineColor = newParams.lineColor !== undefined ? newParams.lineColor : lineColor;
    const finalArrowhead = newParams.arrowhead !== undefined ? newParams.arrowhead : arrowhead;

    const colorHexMap: Record<string, string> = {
      indigo: "#6366F1",
      purple: "#8B5CF6",
      emerald: "#10B981",
      rose: "#F43F5E",
      amber: "#F59E0B",
      slate: "#6B7280",
    };
    const strokeColor = colorHexMap[finalLineColor] || finalLineColor || "#6366F1";
    const strokeWidthVal = parseInt(finalLineWidth) || 2;

    const edgeStyle: any = {
      stroke: strokeColor,
      strokeWidth: strokeWidthVal,
    };
    if (finalLineStyle === "dashed") {
      edgeStyle.strokeDasharray = "6 6";
    } else if (finalLineStyle === "dotted") {
      edgeStyle.strokeDasharray = "2 2";
    }

    let markerEnd: any = undefined;
    if (finalArrowhead === "target" || finalArrowhead === "both") {
      markerEnd = { type: MarkerType.ArrowClosed, color: strokeColor };
    }

    let markerStart: any = undefined;
    if (finalArrowhead === "source" || finalArrowhead === "both") {
      markerStart = { type: MarkerType.ArrowClosed, color: strokeColor };
    }

    onUpdateElement(elementId, {
      label: finalLabel,
      type: finalRouting,
      style: edgeStyle,
      markerEnd,
      markerStart,
      data: {
        label: finalLabel,
        routing: finalRouting,
        lineStyle: finalLineStyle,
        lineWidth: finalLineWidth,
        lineColor: finalLineColor,
        arrowhead: finalArrowhead,
      },
    });
  };

  const handleSave = () => {
    if (isEdge) {
      updateEdgeStyle({});
    } else {
      const updatedData = {
        label,
        description,
        color,
        shape,
        priority,
        status,
        owner,
        version,
        notes,
        requirementId,
        stakeholderId,
        userStoryId,
        riskId,
        meetingId,
        changeRequestId,
        task,
        businessGoal,
        businessRule,
        acceptanceCriteria
      };
      onUpdateElement(elementId, updatedData);
    }
  };

  return (
    <aside className="w-64 border-l border-border bg-card/60 backdrop-blur-md p-4 flex flex-col justify-between select-none shrink-0 overflow-y-auto z-20">
      <div className="flex flex-col gap-4 text-left">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-border/40">
          <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Settings className="w-3.5 h-3.5 text-primary" />
            <span>Inspector: {isEdge ? "Connection" : "Shape"}</span>
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Core fields */}
        <div className="flex flex-col gap-3">
          <Input
            label={isEdge ? "Connection Name" : "Shape Label"}
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              // Save live on text change to prevent lag
              if (isEdge) {
                updateEdgeStyle({ label: e.target.value });
              } else {
                onUpdateElement(elementId, { ...elementData, label: e.target.value });
              }
            }}
            placeholder="Name or action"
          />

          {isEdge && (
            <>
              <Select
                label="Connection Routing"
                value={routing}
                onChange={(e) => {
                  setRouting(e.target.value);
                  updateEdgeStyle({ routing: e.target.value });
                }}
                options={[
                  { value: "smoothstep", label: "Orthogonal (Smooth)" },
                  { value: "step", label: "Orthogonal (Corner)" },
                  { value: "straight", label: "Straight Line" },
                  { value: "default", label: "Bezier Curve" }
                ]}
              />

              <Select
                label="Line Style"
                value={lineStyle}
                onChange={(e) => {
                  setLineStyle(e.target.value);
                  updateEdgeStyle({ lineStyle: e.target.value });
                }}
                options={[
                  { value: "solid", label: "Solid Line" },
                  { value: "dashed", label: "Dashed (e.g. «extends»)" },
                  { value: "dotted", label: "Dotted (e.g. Reference)" }
                ]}
              />

              <Select
                label="Line Width"
                value={lineWidth}
                onChange={(e) => {
                  setLineWidth(e.target.value);
                  updateEdgeStyle({ lineWidth: e.target.value });
                }}
                options={[
                  { value: "1", label: "Thin (1px)" },
                  { value: "2", label: "Medium (2px)" },
                  { value: "4", label: "Thick (4px)" }
                ]}
              />

              <Select
                label="Line Color"
                value={lineColor}
                onChange={(e) => {
                  setLineColor(e.target.value);
                  updateEdgeStyle({ lineColor: e.target.value });
                }}
                options={COLOR_OPTIONS}
              />

              <Select
                label="Arrowheads"
                value={arrowhead}
                onChange={(e) => {
                  setArrowhead(e.target.value);
                  updateEdgeStyle({ arrowhead: e.target.value });
                }}
                options={[
                  { value: "none", label: "None (Association)" },
                  { value: "target", label: "Target Arrow (Direct)" },
                  { value: "source", label: "Source Arrow" },
                  { value: "both", label: "Bidirectional" }
                ]}
              />
            </>
          )}

          {!isEdge && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground mb-0.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    onUpdateElement(elementId, { ...elementData, description: e.target.value });
                  }}
                  placeholder="Responsibilities..."
                  className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border text-foreground outline-none focus:border-primary min-h-[50px] leading-relaxed"
                />
              </div>

              <Select
                label="Visual Style Color"
                value={color}
                onChange={(e) => {
                  setColor(e.target.value);
                  onUpdateElement(elementId, { ...elementData, color: e.target.value });
                }}
                options={COLOR_OPTIONS}
              />

              <Select
                label="Geometry Shape"
                value={shape}
                onChange={(e) => {
                  setShape(e.target.value);
                  onUpdateElement(elementId, { ...elementData, shape: e.target.value });
                }}
                options={SHAPE_OPTIONS}
              />

              {/* Collapsible Meta Block */}
              <div className="border-t border-border/40 pt-3 mt-1 flex flex-col gap-3">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground/80">Properties Meta</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    label="Priority"
                    value={priority}
                    onChange={(e) => {
                      setPriority(e.target.value);
                      onUpdateElement(elementId, { ...elementData, priority: e.target.value });
                    }}
                    options={PRIORITY_OPTIONS}
                  />
                  <Select
                    label="Status"
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      onUpdateElement(elementId, { ...elementData, status: e.target.value });
                    }}
                    options={STATUS_OPTIONS}
                  />
                </div>

                <Input
                  label="Owner / Role"
                  value={owner}
                  onChange={(e) => {
                    setOwner(e.target.value);
                    onUpdateElement(elementId, { ...elementData, owner: e.target.value });
                  }}
                  placeholder="e.g. Accounts Dept"
                />

                <Input
                  label="Node Version"
                  value={version}
                  onChange={(e) => {
                    setVersion(e.target.value);
                    onUpdateElement(elementId, { ...elementData, version: e.target.value });
                  }}
                  placeholder="1.0"
                />
              </div>

              {/* Mapping Section */}
              <div className="border-t border-border/40 pt-3 mt-1 flex flex-col gap-3">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1">
                  <Link className="w-3 h-3" />
                  Traceability Mappings
                </span>

                <Select
                  label="Requirement Link"
                  value={requirementId}
                  onChange={(e) => {
                    setRequirementId(e.target.value);
                    onUpdateElement(elementId, { ...elementData, requirementId: e.target.value });
                  }}
                  options={[{ value: "", label: "No mapping" }, ...requirements.map(r => ({ value: r.id, label: `${r.req_id}: ${r.title}` }))]}
                />

                <Select
                  label="Stakeholder Link"
                  value={stakeholderId}
                  onChange={(e) => {
                    setStakeholderId(e.target.value);
                    onUpdateElement(elementId, { ...elementData, stakeholderId: e.target.value });
                  }}
                  options={[{ value: "", label: "No mapping" }, ...stakeholders.map(s => ({ value: s.id, label: `${s.name} (${s.role})` }))]}
                />

                <Select
                  label="User Story Link"
                  value={userStoryId}
                  onChange={(e) => {
                    setUserStoryId(e.target.value);
                    onUpdateElement(elementId, { ...elementData, userStoryId: e.target.value });
                  }}
                  options={[{ value: "", label: "No mapping" }, ...userStories.map(u => ({ value: u.id, label: `${u.story_id}: ${u.title}` }))]}
                />

                <Select
                  label="Project Risk Link"
                  value={riskId}
                  onChange={(e) => {
                    setRiskId(e.target.value);
                    onUpdateElement(elementId, { ...elementData, riskId: e.target.value });
                  }}
                  options={[{ value: "", label: "No mapping" }, ...risks.map(rk => ({ value: rk.id, label: rk.title }))]}
                />

                <Select
                  label="Meeting Link"
                  value={meetingId}
                  onChange={(e) => {
                    setMeetingId(e.target.value);
                    onUpdateElement(elementId, { ...elementData, meetingId: e.target.value });
                  }}
                  options={[{ value: "", label: "No mapping" }, ...meetings.map(m => ({ value: m.id, label: m.title }))]}
                />

                <Select
                  label="Change Request"
                  value={changeRequestId}
                  onChange={(e) => {
                    setChangeRequestId(e.target.value);
                    onUpdateElement(elementId, { ...elementData, changeRequestId: e.target.value });
                  }}
                  options={[{ value: "", label: "No mapping" }, ...changeRequests.map(cr => ({ value: cr.id, label: cr.title }))]}
                />

                {/* Text Mappings */}
                <Input
                  label="Action Task"
                  value={task}
                  onChange={(e) => {
                    setTask(e.target.value);
                    onUpdateElement(elementId, { ...elementData, task: e.target.value });
                  }}
                  placeholder="Task checklist"
                />

                <Input
                  label="Business Goal"
                  value={businessGoal}
                  onChange={(e) => {
                    setBusinessGoal(e.target.value);
                    onUpdateElement(elementId, { ...elementData, businessGoal: e.target.value });
                  }}
                  placeholder="e.g. Reduce churn by 5%"
                />

                <Input
                  label="Business Rule Reference"
                  value={businessRule}
                  onChange={(e) => {
                    setBusinessRule(e.target.value);
                    onUpdateElement(elementId, { ...elementData, businessRule: e.target.value });
                  }}
                  placeholder="BR-04 Validation Rule"
                />

                <Input
                  label="Acceptance Criteria"
                  value={acceptanceCriteria}
                  onChange={(e) => {
                    setAcceptanceCriteria(e.target.value);
                    onUpdateElement(elementId, { ...elementData, acceptanceCriteria: e.target.value });
                  }}
                  placeholder="Given X When Y"
                />
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1 mt-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">Internal Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    onUpdateElement(elementId, { ...elementData, notes: e.target.value });
                  }}
                  placeholder="Architectural notes..."
                  className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border text-foreground outline-none focus:border-primary min-h-[50px] leading-relaxed"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete / Actions Footer */}
      <div className="flex flex-col gap-2 border-t border-border/40 pt-4 mt-6">
        <Button variant="ghost" size="sm" onClick={handleSave} className="w-full font-bold text-xs bg-secondary/80">
          Save Element
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDeleteElement(elementId)}
          className="w-full font-bold text-xs"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          {isEdge ? "Delete Connection" : "Delete Shape"}
        </Button>
      </div>
    </aside>
  );
};
export default PropertiesPanel;
