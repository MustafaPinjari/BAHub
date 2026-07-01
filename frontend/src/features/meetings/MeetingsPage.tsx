import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Card, Badge, Button, Input, Select, Alert } from "../../components/common/UIComponents";
import { useAuth } from "../auth/AuthContext";
import { 
  Calendar, 
  Plus, 
  Trash2, 
  CheckSquare,
  Users,
  Clock,
  Save,
  Loader2,
  FolderGit,
  X,
  UserCheck
} from "lucide-react";

interface Project {
  id: string;
  name: string;
}

interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
}

interface ActionItem {
  id: string;
  meeting: string;
  meeting_title: string;
  description: string;
  assignee: string | null;
  assignee_detail: User | null;
  due_date: string | null;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED";
}

interface Meeting {
  id: string;
  project: string;
  project_name: string;
  title: string;
  date: string;
  time: string;
  objective: string;
  notes: string;
  attendees: string[];
  attendees_detail: User[];
  action_items: ActionItem[];
}

export const MeetingsPage: React.FC = () => {
  const { user } = useAuth();
  
  // Project context from localStorage
  const [activeProject, setActiveProject] = useState<Project | null>(() => {
    try {
      const stored = localStorage.getItem("active_project");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // States
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [orgUsers, setOrgUsers] = useState<User[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals / Scheduling Form States
  const [modalOpen, setModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formObjective, setFormObjective] = useState("");
  const [formAttendees, setFormAttendees] = useState<string[]>([]);

  // MoM text state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editNotes, setEditNotes] = useState("");

  // Action Item Quick Form States
  const [itemDesc, setItemDesc] = useState("");
  const [itemAssignee, setItemAssignee] = useState("");
  const [itemDueDate, setItemDueDate] = useState("");

  const [saving, setSaving] = useState(false);
  const [actionSaving, setActionSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canManage = user ? ["ADMIN", "BUSINESS_ANALYST", "PRODUCT_OWNER"].includes(user.role) : false;

  const fetchMeetings = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const res = await api.get<any, { data: Meeting[] }>(`/meetings/?project=${activeProject.id}`);
      setMeetings(res.data);
      if (res.data.length > 0) {
        // Maintain selection or default to first
        const current = selectedMeeting ? res.data.find(m => m.id === selectedMeeting.id) : null;
        loadMeeting(current || res.data[0]);
      } else {
        setSelectedMeeting(null);
      }
    } catch (err) {
      console.error("Failed to load meetings:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgUsers = async () => {
    try {
      // Load members from workspace profile settings
      const res = await api.get<any, { data: User[] }>("/auth/members/");
      setOrgUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchOrgUsers();
  }, [activeProject]);

  // Listen to active project changes from top navbar
  useEffect(() => {
    const handleProjectChange = () => {
      try {
        const stored = localStorage.getItem("active_project");
        setActiveProject(stored ? JSON.parse(stored) : null);
        setSelectedMeeting(null);
      } catch {
        setActiveProject(null);
      }
    };
    window.addEventListener("activeProjectChanged", handleProjectChange);
    return () => {
      window.removeEventListener("activeProjectChanged", handleProjectChange);
    };
  }, []);

  const loadMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setEditNotes(meeting.notes || "");
    setIsEditingNotes(false);
    setItemDesc("");
    setItemAssignee("");
    setItemDueDate("");
    setFormError(null);
  };

  const openScheduleModal = () => {
    setFormTitle("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormTime("10:00");
    setFormObjective("");
    setFormAttendees([]);
    setFormError(null);
    setSuccessMessage(null);
    setModalOpen(true);
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;
    setSaving(true);
    setFormError(null);

    const payload = {
      project: activeProject.id,
      title: formTitle,
      date: formDate,
      time: formTime,
      objective: formObjective,
      attendees: formAttendees,
    };

    try {
      const res = await api.post<any, { data: Meeting }>("/meetings/", payload);
      setSuccessMessage("Meeting scheduled successfully.");
      setModalOpen(false);
      fetchMeetings();
      loadMeeting(res.data);
    } catch (err: any) {
      setFormError(err.message || "Failed to schedule meeting.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedMeeting) return;
    setSaving(true);
    setFormError(null);
    try {
      const res = await api.patch<any, { data: Meeting }>(`/meetings/${selectedMeeting.id}/`, {
        notes: editNotes
      });
      setSuccessMessage("Meeting minutes updated.");
      loadMeeting(res.data);
      // Refresh list to keep state
      setMeetings(prev => prev.map(m => m.id === res.data.id ? { ...m, notes: res.data.notes } : m));
    } catch (err: any) {
      setFormError("Failed to update notes.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddActionItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeeting || !itemDesc) return;
    setActionSaving(true);
    setFormError(null);

    const payload = {
      meeting: selectedMeeting.id,
      description: itemDesc,
      assignee: itemAssignee === "" ? null : itemAssignee,
      due_date: itemDueDate === "" ? null : itemDueDate,
      status: "OPEN"
    };

    try {
      await api.post("/meetings/action-items/", payload);
      setSuccessMessage("Action item task assigned.");
      setItemDesc("");
      setItemAssignee("");
      setItemDueDate("");
      // Refresh selected meeting to load child action items
      const res = await api.get<any, { data: Meeting }>(`/meetings/${selectedMeeting.id}/`);
      loadMeeting(res.data);
      setMeetings(prev => prev.map(m => m.id === res.data.id ? res.data : m));
    } catch (err: any) {
      setFormError(err.message || "Failed to add action item.");
    } finally {
      setActionSaving(false);
    }
  };

  const handleToggleAttendee = (userId: string) => {
    setFormAttendees(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleToggleActionStatus = async (item: ActionItem) => {
    const nextStatus: ActionItem["status"] = item.status === "COMPLETED" ? "OPEN" : "COMPLETED";
    try {
      await api.patch(`/meetings/action-items/${item.id}/`, {
        status: nextStatus
      });
      // Update local state directly
      if (selectedMeeting) {
        const nextItems = selectedMeeting.action_items.map(ai =>
          ai.id === item.id ? { ...ai, status: nextStatus } : ai
        );
        setSelectedMeeting({ ...selectedMeeting, action_items: nextItems });
      }
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  const handleDeleteMeeting = async () => {
    if (!selectedMeeting) return;
    if (!window.confirm("Cancel and delete this meeting record permanently?")) return;
    setFormError(null);
    setSuccessMessage(null);
    try {
      await api.delete(`/meetings/${selectedMeeting.id}/`);
      setSuccessMessage("Meeting cancelled successfully.");
      setSelectedMeeting(null);
      fetchMeetings();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMeetings = meetings.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.objective.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            Select a project context from the Projects list page before managing scheduled meetings.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col md:flex-row gap-5 items-stretch select-none text-foreground min-h-[75vh]">
      
      {/* LEFT COLUMN: Scheduled Meetings Index */}
      <div className="w-full md:w-[35%] flex flex-col gap-4">
        <Card className="p-4 flex flex-col gap-4 flex-1">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <div>
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Meetings Index
              </h2>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mt-0.5">
                Project: {activeProject.name}
              </span>
            </div>
            {canManage && (
              <Button
                variant="outline"
                size="sm"
                onClick={openScheduleModal}
                className="text-[10px] font-bold h-7 py-1 px-2.5 rounded"
              >
                <Plus className="w-3 h-3 mr-1" />
                Schedule
              </Button>
            )}
          </div>

          <Input
            placeholder="Search meetings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs py-1.5 h-8 rounded-md"
          />

          {loading ? (
            <div className="flex items-center justify-center py-10 flex-1">
              <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
              <span className="text-xs text-muted-foreground font-semibold">Loading logs...</span>
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-xs text-muted-foreground flex-1">
              <Calendar className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <span>No scheduled sessions recorded.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[550px] pr-1">
              {filteredMeetings.map((m) => {
                const isSelected = selectedMeeting?.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => loadMeeting(m)}
                    className={`p-3 border rounded-xl flex flex-col gap-1.5 cursor-pointer text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:border-primary/20"
                    }`}
                  >
                    <h4 className="font-bold text-xs text-foreground truncate max-w-[200px] leading-tight">{m.title}</h4>
                    <div className="flex items-center gap-3 text-[9px] text-muted-foreground font-semibold">
                      <div className="flex items-center gap-0.5">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>{m.date}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{m.time.substring(0, 5)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* RIGHT COLUMN: MoM Minutes Editor & Action Item Checklists */}
      <div className="w-full md:w-[65%] flex flex-col gap-4">
        {selectedMeeting ? (
          <Card className="p-6 flex flex-col gap-5 flex-1 relative bg-card border border-border text-left">
            
            {/* Header Title with Action Controls */}
            <div className="flex justify-between items-start border-b border-border pb-3 gap-3">
              <div>
                <h3 className="text-sm font-bold text-foreground leading-tight">{selectedMeeting.title}</h3>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-semibold mt-1">
                  <span>Date: {selectedMeeting.date}</span>
                  <span>•</span>
                  <span>Time: {selectedMeeting.time.substring(0, 5)}</span>
                </div>
              </div>

              {canManage && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDeleteMeeting}
                  className="text-muted-foreground hover:text-destructive w-7 h-7 rounded"
                  title="Cancel Meeting"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>

            {successMessage && <Alert variant="success">{successMessage}</Alert>}
            {formError && <Alert variant="destructive">{formError}</Alert>}

            {/* Scrollable details board */}
            <div className="flex flex-col gap-5 overflow-y-auto max-h-[500px] pr-1">
              
              {/* Meeting objective definition */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Objective</span>
                <p className="text-xs text-foreground font-semibold leading-relaxed bg-secondary/15 p-3 rounded-lg border border-border/40">
                  {selectedMeeting.objective}
                </p>
              </div>

              {/* Attendees list map */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Attendees ({selectedMeeting.attendees_detail.length})
                </span>
                <div className="flex flex-wrap gap-1.5 mt-0.5">
                  {selectedMeeting.attendees_detail.length === 0 ? (
                    <span className="text-xs text-muted-foreground/60 italic">No attendees registered</span>
                  ) : (
                    selectedMeeting.attendees_detail.map((att) => (
                      <Badge key={att.id} variant="secondary" className="text-[9px] font-bold py-0.5 px-2 flex items-center gap-1 bg-secondary border border-border text-foreground">
                        <UserCheck className="w-2.5 h-2.5 text-primary shrink-0" />
                        {att.first_name} {att.last_name} (@{att.username})
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              {/* MoM Notes Panel */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Minutes of Meeting (MoM)
                  </span>
                  {canManage && (
                    <button
                      onClick={() => {
                        if (isEditingNotes) handleSaveNotes();
                        else setIsEditingNotes(true);
                      }}
                      className="text-[10px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                    >
                      {isEditingNotes ? (
                        <>
                          <Save className="w-3 h-3" />
                          Save Minutes
                        </>
                      ) : (
                        "Edit Minutes"
                      )}
                    </button>
                  )}
                </div>

                {isEditingNotes ? (
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={4}
                    className="w-full text-xs font-semibold border border-border bg-background rounded-lg p-3 outline-none text-foreground leading-relaxed resize-none focus:border-primary"
                    placeholder="Document decisions, questions, and agendas discussed..."
                  />
                ) : (
                  <div className="border border-border/80 bg-background/50 rounded-xl p-4 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap min-h-20 font-semibold shadow-inner">
                    {selectedMeeting.notes || "No minutes documented yet. Click 'Edit Minutes' to begin."}
                  </div>
                )}
              </div>

              {/* Action items checklist panel */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-1 block">
                  Action Items Checklist ({selectedMeeting.action_items.length})
                </span>

                <div className="flex flex-col gap-2">
                  {selectedMeeting.action_items.map((item) => {
                    const isCompleted = item.status === "COMPLETED";
                    return (
                      <div 
                        key={item.id}
                        className={`p-3 border rounded-xl flex items-center justify-between gap-3 text-xs font-semibold transition-all bg-card ${
                          isCompleted ? "opacity-60 border-border" : "border-border hover:border-primary/20"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isCompleted}
                            disabled={!canManage}
                            onChange={() => handleToggleActionStatus(item)}
                            className="rounded border-border text-primary focus:ring-primary/20 w-4 h-4 cursor-pointer"
                          />
                          <div className="flex flex-col text-left overflow-hidden">
                            <span className={`text-foreground truncate max-w-[280px] ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                              {item.description}
                            </span>
                            <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-bold mt-0.5">
                              {item.assignee_detail && (
                                <span>Assignee: @{item.assignee_detail.username}</span>
                              )}
                              {item.due_date && (
                                <span>• Due: {item.due_date}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <Badge variant={isCompleted ? "success" : "default"} className="text-[8px] font-bold tracking-wider uppercase shrink-0">
                          {item.status.replace("_", " ")}
                        </Badge>
                      </div>
                    );
                  })}

                  {selectedMeeting.action_items.length === 0 && (
                    <span className="text-xs text-muted-foreground/60 italic py-2">No follow-up action items created.</span>
                  )}
                </div>

                {/* Inline Add Action Item Form */}
                {canManage && (
                  <form onSubmit={handleAddActionItem} className="flex flex-col gap-3.5 bg-secondary/10 p-4 rounded-xl border border-border/40 text-left mt-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                      Assign New Action Item Task
                    </span>

                    <Input
                      label="Task Description"
                      placeholder="e.g. Draft authentication test schemas"
                      value={itemDesc}
                      onChange={(e) => setItemDesc(e.target.value)}
                      className="text-xs h-8"
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        label="Assignee"
                        value={itemAssignee}
                        onChange={(e) => setItemAssignee(e.target.value)}
                        options={[
                          { value: "", label: "Unassigned" },
                          ...orgUsers.map((u) => ({
                            value: u.id,
                            label: `${u.first_name} ${u.last_name} (@${u.username})`,
                          })),
                        ]}
                      />
                      <Input
                        label="Due Date"
                        type="date"
                        value={itemDueDate}
                        onChange={(e) => setItemDueDate(e.target.value)}
                        className="text-xs h-8"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={actionSaving}
                      disabled={!itemDesc}
                      className="text-xs font-bold py-1.5 self-end px-4 mt-1 flex items-center gap-1.5"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      Add Task
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <Card className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none text-foreground font-semibold">
            <Calendar className="w-10 h-10 text-muted-foreground/30 animate-pulse mb-3" />
            <h3 className="text-sm font-bold uppercase tracking-wider">No Meeting Selected</h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mt-1">
              Select a meeting row from the index on the left, or click "Schedule" to create a new session profile.
            </p>
          </Card>
        )}
      </div>

      {/* SCHEDULE MEETING MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 flex flex-col gap-5 bg-card border border-border relative select-none">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col gap-1 border-b border-border pb-3">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Schedule Project Meeting
              </h2>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Log objectives, schedule dates, and invite key organization members.
              </p>
            </div>

            {formError && <Alert variant="destructive">{formError}</Alert>}

            <form onSubmit={handleScheduleMeeting} className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] pr-1">
              <Input
                label="Meeting Title"
                placeholder="e.g. Scope Alignment session"
                value={formTitle}
                required
                onChange={(e) => setFormTitle(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Date"
                  type="date"
                  value={formDate}
                  required
                  onChange={(e) => setFormDate(e.target.value)}
                />
                <Input
                  label="Time"
                  type="time"
                  value={formTime}
                  required
                  onChange={(e) => setFormTime(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Meeting Objective
                </label>
                <textarea
                  placeholder="Define agendas and topics to resolve..."
                  value={formObjective}
                  required
                  rows={3}
                  onChange={(e) => setFormObjective(e.target.value)}
                  className="w-full text-xs font-semibold border border-border bg-background rounded-lg p-2.5 outline-none text-foreground leading-relaxed resize-none focus:border-primary"
                />
              </div>

              {/* Invite Attendees list */}
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  Invite Attendees
                </label>
                <div className="max-h-32 overflow-y-auto border border-border bg-background rounded-lg p-2 flex flex-col gap-1.5 mt-0.5">
                  {orgUsers.map((u) => {
                    const checked = formAttendees.includes(u.id);
                    return (
                      <label 
                        key={u.id}
                        className="flex items-center gap-2 px-1 py-0.5 text-xs font-semibold text-foreground cursor-pointer hover:bg-secondary/40 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleAttendee(u.id)}
                          className="rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                        />
                        <span>{u.first_name} {u.last_name} (@{u.username})</span>
                      </label>
                    );
                  })}
                </div>
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
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={saving}
                  className="text-xs font-bold"
                >
                  Schedule Session
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
