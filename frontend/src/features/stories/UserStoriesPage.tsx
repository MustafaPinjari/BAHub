import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Card, Badge, Button, Input, Select, Alert } from "../../components/common/UIComponents";
import { useAuth } from "../auth/AuthContext";
import { useProject } from "../projects/ProjectContext";
import { 
  Plus, 
  Trash2, 
  Wand2,
  Loader2,
  FolderGit,
  X,
  FileText,
  CheckSquare,
  ListChecks
} from "lucide-react";


interface Requirement {
  id: string;
  req_id: string;
  title: string;
}

interface UserStory {
  id: string;
  requirement: string;
  requirement_detail: Requirement;
  story_id: string;
  title: string;
  role: string;
  action: string;
  benefit: string;
  acceptance_criteria: string;
  status: "TODO" | "IN_PROGRESS" | "QA" | "DONE";
  points: number;
  created_at: string;
}

export const UserStoriesPage: React.FC = () => {
  const { user } = useAuth();
  const { activeProject } = useProject();

  // States
  const [stories, setStories] = useState<UserStory[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<UserStory | null>(null);

  // Form states
  const [formReq, setFormReq] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formAction, setFormAction] = useState("");
  const [formBenefit, setFormBenefit] = useState("");
  const [formCriteria, setFormCriteria] = useState("");
  const [formStatus, setFormStatus] = useState<UserStory["status"]>("TODO");
  const [formPoints, setFormPoints] = useState(3);

  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canManage = user ? ["ADMIN", "BUSINESS_ANALYST", "PRODUCT_OWNER"].includes(user.role) : false;

  const fetchStories = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const res = await api.get<any, { data: UserStory[] }>(`/stories/?project=${activeProject.id}`);
      setStories(res.data);
    } catch (err) {
      console.error("Failed to load user stories:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequirements = async () => {
    if (!activeProject) return;
    try {
      const res = await api.get<any, { data: Requirement[] }>(`/requirements/?project=${activeProject.id}`);
      setRequirements(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStories();
    fetchRequirements();
  }, [activeProject]);

  const openCreateModal = () => {
    setEditingStory(null);
    setFormError(null);
    setSuccessMessage(null);
    setFormReq(requirements.length > 0 ? requirements[0].id : "");
    setFormTitle("");
    setFormRole("");
    setFormAction("");
    setFormBenefit("");
    setFormCriteria("");
    setFormStatus("TODO");
    setFormPoints(3);
    setModalOpen(true);
  };

  const openEditModal = (story: UserStory) => {
    setEditingStory(story);
    setFormError(null);
    setSuccessMessage(null);
    setFormReq(story.requirement);
    setFormTitle(story.title);
    setFormRole(story.role);
    setFormAction(story.action);
    setFormBenefit(story.benefit);
    setFormCriteria(story.acceptance_criteria || "");
    setFormStatus(story.status);
    setFormPoints(story.points);
    setModalOpen(true);
  };

  const triggerAIGeneration = async () => {
    if (!formReq) {
      setFormError("Please select a parent Requirement context to run the AI assistant.");
      return;
    }
    setAiGenerating(true);
    setFormError(null);
    setSuccessMessage(null);

    try {
      const res = await api.post<any, { data: any }>("/stories/generate/", { requirement: formReq });
      setFormTitle(res.data.title);
      setFormRole(res.data.role);
      setFormAction(res.data.action);
      setFormBenefit(res.data.benefit);
      setFormCriteria(res.data.acceptance_criteria);
      setSuccessMessage("Agile story parameters generated successfully by AI!");
    } catch (err: any) {
      setFormError(err.message || "Failed to generate user story.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmitStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formReq) {
      setFormError("A parent requirement is required.");
      return;
    }
    setSaving(true);
    setFormError(null);

    const payload = {
      requirement: formReq,
      title: formTitle,
      role: formRole,
      action: formAction,
      benefit: formBenefit,
      acceptance_criteria: formCriteria,
      status: formStatus,
      points: Number(formPoints),
    };

    try {
      if (editingStory) {
        await api.put(`/stories/${editingStory.id}/`, payload);
        setSuccessMessage("User story updated successfully.");
      } else {
        await api.post("/stories/", payload);
        setSuccessMessage("User story created successfully.");
      }
      setModalOpen(false);
      fetchStories();
    } catch (err: any) {
      setFormError(err.message || "Failed to save user story details.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStory = async (id: string) => {
    if (!window.confirm("Remove this user story card?")) return;
    setSuccessMessage(null);
    try {
      await api.delete(`/stories/${id}/`);
      setSuccessMessage("User story removed successfully.");
      fetchStories();
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to split stories into Scrum Board columns
  const getColumnStories = (statusKey: UserStory["status"]) => {
    return stories.filter((s) => s.status === statusKey);
  };

  const getPointsBadgeColor = (pts: number) => {
    if (pts >= 8) return "success";
    if (pts >= 3) return "default";
    return "secondary";
  };

  // Calculate story points summary total
  const totalPoints = stories.reduce((sum, s) => sum + s.points, 0);

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
            Select a project context from the Projects list page before managing user stories.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-5 select-none text-foreground">
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-border pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Agile User Stories</h1>
            <Badge variant="default" className="text-[10px] font-bold py-0.5 px-2">
              {totalPoints} Story Points
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Refine requirement details into Scrum user story cards and estimate velocity.
          </p>
        </div>

        {canManage && requirements.length > 0 && (
          <Button
            variant="primary"
            size="sm"
            onClick={openCreateModal}
            className="text-xs font-bold py-1.5 px-3 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add User Story
          </Button>
        )}
      </div>

      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {requirements.length === 0 ? (
        <Card className="flex flex-col items-center justify-center text-center p-12 py-16 max-w-lg mx-auto gap-4 mt-6">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 shrink-0">
            <FileText className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">No Requirements Configured</h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              User stories trace back directly to requirements. Create your first requirement before writing user stories.
            </p>
          </div>
          <button
            onClick={() => window.location.href = "/requirements"}
            className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
          >
            → Go to Requirements
          </button>
        </Card>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-7 h-7 text-primary animate-spin mb-2" />
          <span className="text-xs text-muted-foreground font-semibold">Loading story cards...</span>
        </div>
      ) : stories.length === 0 ? (
        <Card className="flex flex-col items-center justify-center text-center p-12 py-16 max-w-lg mx-auto gap-4 mt-6">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 shrink-0">
            <ListChecks className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">No User Stories Yet</h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              Break requirements into Scrum story cards to estimate velocity and track progress on the board.
            </p>
          </div>
          {canManage && (
            <button
              onClick={openCreateModal}
              className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
            >
              + Create first story
            </button>
          )}
        </Card>
      ) : (
        /* KANBAN SCRUM BOARD */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch select-none text-foreground text-left font-semibold">
          
          {/* Column: To Do */}
          <div className="flex flex-col gap-3.5 bg-secondary/15 p-3.5 rounded-2xl border border-border/40">
            <div className="flex justify-between items-center px-1 border-b border-border pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">To Do</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">{getColumnStories("TODO").length}</Badge>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[500px] pr-0.5">
              {getColumnStories("TODO").map((s) => (
                <Card 
                  key={s.id} 
                  onClick={() => openEditModal(s)}
                  className="p-4 flex flex-col gap-2.5 bg-card hover:border-primary/25 cursor-pointer shadow-sm relative group"
                >
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-[9px] font-bold text-primary uppercase tracking-wider">{s.story_id}</span>
                    <Badge variant={getPointsBadgeColor(s.points)} className="text-[8px] font-bold px-1.5">
                      {s.points} pts
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-foreground truncate max-w-[200px] leading-tight mt-0.5">{s.title}</h4>
                  
                  <div className="text-[10px] text-muted-foreground leading-relaxed flex flex-col gap-0.5 bg-secondary/20 p-2 rounded-lg border border-border/40">
                    <div><span className="font-bold text-foreground">As a:</span> {s.role}</div>
                    <div className="truncate"><span className="font-bold text-foreground">I want:</span> {s.action}</div>
                  </div>

                  <div className="flex justify-between items-center border-t border-border/60 pt-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
                    <span className="truncate max-w-[120px]">Ref: {s.requirement_detail.req_id}</span>
                    {canManage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStory(s.id);
                        }}
                        className="text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-all cursor-pointer p-0.5"
                        title="Delete Story"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Column: In Progress */}
          <div className="flex flex-col gap-3.5 bg-secondary/15 p-3.5 rounded-2xl border border-border/40">
            <div className="flex justify-between items-center px-1 border-b border-border pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">In Progress</span>
              <Badge variant="default" className="text-[10px] px-1.5 py-0.5">{getColumnStories("IN_PROGRESS").length}</Badge>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[500px] pr-0.5">
              {getColumnStories("IN_PROGRESS").map((s) => (
                <Card 
                  key={s.id} 
                  onClick={() => openEditModal(s)}
                  className="p-4 flex flex-col gap-2.5 bg-card hover:border-primary/25 cursor-pointer shadow-sm relative group border-t-2 border-t-blue-500"
                >
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">{s.story_id}</span>
                    <Badge variant={getPointsBadgeColor(s.points)} className="text-[8px] font-bold px-1.5">
                      {s.points} pts
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-foreground truncate max-w-[200px] leading-tight mt-0.5">{s.title}</h4>
                  
                  <div className="text-[10px] text-muted-foreground leading-relaxed flex flex-col gap-0.5 bg-secondary/20 p-2 rounded-lg border border-border/40">
                    <div><span className="font-bold text-foreground">As a:</span> {s.role}</div>
                    <div className="truncate"><span className="font-bold text-foreground">I want:</span> {s.action}</div>
                  </div>

                  <div className="flex justify-between items-center border-t border-border/60 pt-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
                    <span className="truncate max-w-[120px]">Ref: {s.requirement_detail.req_id}</span>
                    {canManage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStory(s.id);
                        }}
                        className="text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-all cursor-pointer p-0.5"
                        title="Delete Story"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Column: QA review */}
          <div className="flex flex-col gap-3.5 bg-secondary/15 p-3.5 rounded-2xl border border-border/40">
            <div className="flex justify-between items-center px-1 border-b border-border pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">QA Review</span>
              <Badge variant="default" className="text-[10px] px-1.5 py-0.5">{getColumnStories("QA").length}</Badge>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[500px] pr-0.5">
              {getColumnStories("QA").map((s) => (
                <Card 
                  key={s.id} 
                  onClick={() => openEditModal(s)}
                  className="p-4 flex flex-col gap-2.5 bg-card hover:border-primary/25 cursor-pointer shadow-sm relative group border-t-2 border-t-amber-500"
                >
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">{s.story_id}</span>
                    <Badge variant={getPointsBadgeColor(s.points)} className="text-[8px] font-bold px-1.5">
                      {s.points} pts
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-foreground truncate max-w-[200px] leading-tight mt-0.5">{s.title}</h4>
                  
                  <div className="text-[10px] text-muted-foreground leading-relaxed flex flex-col gap-0.5 bg-secondary/20 p-2 rounded-lg border border-border/40">
                    <div><span className="font-bold text-foreground">As a:</span> {s.role}</div>
                    <div className="truncate"><span className="font-bold text-foreground">I want:</span> {s.action}</div>
                  </div>

                  <div className="flex justify-between items-center border-t border-border/60 pt-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
                    <span className="truncate max-w-[120px]">Ref: {s.requirement_detail.req_id}</span>
                    {canManage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStory(s.id);
                        }}
                        className="text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-all cursor-pointer p-0.5"
                        title="Delete Story"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Column: Done */}
          <div className="flex flex-col gap-3.5 bg-secondary/15 p-3.5 rounded-2xl border border-border/40">
            <div className="flex justify-between items-center px-1 border-b border-border pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Done</span>
              <Badge variant="success" className="text-[10px] px-1.5 py-0.5">{getColumnStories("DONE").length}</Badge>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[500px] pr-0.5">
              {getColumnStories("DONE").map((s) => (
                <Card 
                  key={s.id} 
                  onClick={() => openEditModal(s)}
                  className="p-4 flex flex-col gap-2.5 bg-card hover:border-primary/25 cursor-pointer shadow-sm relative group border-t-2 border-t-emerald-500"
                >
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">{s.story_id}</span>
                    <Badge variant={getPointsBadgeColor(s.points)} className="text-[8px] font-bold px-1.5">
                      {s.points} pts
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-foreground truncate max-w-[200px] leading-tight mt-0.5">{s.title}</h4>
                  
                  <div className="text-[10px] text-muted-foreground leading-relaxed flex flex-col gap-0.5 bg-secondary/20 p-2 rounded-lg border border-border/40">
                    <div><span className="font-bold text-foreground">As a:</span> {s.role}</div>
                    <div className="truncate"><span className="font-bold text-foreground">I want:</span> {s.action}</div>
                  </div>

                  <div className="flex justify-between items-center border-t border-border/60 pt-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
                    <span className="truncate max-w-[120px]">Ref: {s.requirement_detail.req_id}</span>
                    {canManage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStory(s.id);
                        }}
                        className="text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-all cursor-pointer p-0.5"
                        title="Delete Story"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 flex flex-col gap-5 bg-card border border-border relative select-none">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex justify-between items-center border-b border-border pb-3">
              <div>
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                  {editingStory ? "Edit User Story card" : "Create agile user story"}
                </h2>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                  Trace specifications, size effort points, and draft acceptance scopes.
                </p>
              </div>

              {canManage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={triggerAIGeneration}
                  disabled={aiGenerating}
                  className="text-[10px] font-bold h-7 py-1 px-2.5 rounded text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-100 flex items-center gap-1.5 shrink-0"
                >
                  {aiGenerating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Wand2 className="w-3 h-3" />
                  )}
                  AI Auto-Fill
                </Button>
              )}
            </div>

            {formError && <Alert variant="destructive">{formError}</Alert>}
            {successMessage && <Alert variant="success">{successMessage}</Alert>}

            <form onSubmit={handleSubmitStory} className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] pr-1">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Parent Requirement Context"
                  options={requirements.map((r) => ({
                    value: r.id,
                    label: `${r.req_id} - ${r.title}`,
                  }))}
                  value={formReq}
                  disabled={!canManage}
                  onChange={(e) => setFormReq(e.target.value)}
                />
                <Input
                  label="Story Card Title"
                  placeholder="e.g. Email and password Login"
                  value={formTitle}
                  disabled={!canManage}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>

              {/* Story Formats: As A, I want, So that */}
              <div className="flex flex-col gap-3 bg-secondary/10 p-3 rounded-lg border border-border/40 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                  Agile Format Definition
                </span>
                
                <Input
                  label="AS A (User Persona)"
                  placeholder="e.g. Registered Customer"
                  value={formRole}
                  disabled={!canManage}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="text-xs"
                />
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    I WANT TO (Required Action)
                  </label>
                  <textarea
                    placeholder="e.g. input credentials in fields and click authenticate"
                    value={formAction}
                    rows={2}
                    disabled={!canManage}
                    onChange={(e) => setFormAction(e.target.value)}
                    className="w-full text-xs font-semibold border border-border bg-background rounded-lg p-2.5 outline-none text-foreground leading-relaxed resize-none focus:border-primary"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    SO THAT (Business Value)
                  </label>
                  <textarea
                    placeholder="e.g. access secure accounts data and billing history profiles"
                    value={formBenefit}
                    rows={2}
                    disabled={!canManage}
                    onChange={(e) => setFormBenefit(e.target.value)}
                    className="w-full text-xs font-semibold border border-border bg-background rounded-lg p-2.5 outline-none text-foreground leading-relaxed resize-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Scrum Board Status"
                  options={[
                    { value: "TODO", label: "To Do" },
                    { value: "IN_PROGRESS", label: "In Progress" },
                    { value: "QA", label: "Ready for QA" },
                    { value: "DONE", label: "Done" },
                  ]}
                  value={formStatus}
                  disabled={!canManage}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                />
                <Select
                  label="Sizing Estimate (Fibonacci)"
                  options={[
                    { value: "1", label: "1 Story Point" },
                    { value: "2", label: "2 Story Points" },
                    { value: "3", label: "3 Story Points" },
                    { value: "5", label: "5 Story Points" },
                    { value: "8", label: "8 Story Points" },
                    { value: "13", label: "13 Story Points" },
                  ]}
                  value={String(formPoints)}
                  disabled={!canManage}
                  onChange={(e) => setFormPoints(Number(e.target.value))}
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <div className="flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5 text-muted-foreground" />
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Acceptance Criteria Checklist
                  </label>
                </div>
                <textarea
                  placeholder="- GIVEN a user... \n- WHEN they... \n- THEN they should see..."
                  value={formCriteria}
                  rows={4}
                  disabled={!canManage}
                  onChange={(e) => setFormCriteria(e.target.value)}
                  className="w-full text-xs font-semibold border border-border bg-background rounded-lg p-3 outline-none text-foreground leading-relaxed resize-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-4 mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                  className="text-xs font-bold"
                >
                  Cancel
                </Button>
                {canManage && (
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={saving}
                    className="text-xs font-bold"
                  >
                    Save Story card
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
