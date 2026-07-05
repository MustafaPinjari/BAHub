import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { Button, Badge, Card } from "../../../components/common/UIComponents";
import { 
  Lock, 
  Unlock, 
  Send, 
  User, 
  ShieldCheck
} from "lucide-react";

interface Comment {
  id: string;
  user_username: string;
  user_role: string;
  text: string;
  node_id: string;
  parent: string | null;
  resolved: boolean;
  resolved_by_username: string | null;
  created_at: string;
}

interface Approval {
  id: string;
  user_username: string;
  user_role: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  comments: string;
  version: string;
  created_at: string;
}

interface CollaborationPanelProps {
  projectId: string;
  diagramId: string | null;
  diagramLocked: boolean;
  lockedByUsername: string | null;
  currentUserId: string;
  onLockToggle: () => void;
  onRestoreVersion: (versionId: string) => void;
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  projectId: _projectId,
  diagramId,
  diagramLocked,
  lockedByUsername,
  currentUserId: _currentUserId,
  onLockToggle,
  onRestoreVersion,
}) => {
  const [activeTab, setActiveTab] = useState<"comments" | "approvals" | "history">("comments");

  // States
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [nodeFilter, _setNodeFilter] = useState(""); // Filter comments by selected node if any

  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [approvalComment, setApprovalComment] = useState("");
  const [approvalStatus, setApprovalStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [approvalLoading, setApprovalLoading] = useState(false);

  const [versions, setVersions] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchComments = async () => {
    if (!diagramId) return;
    try {
      const res = await api.get<any, { data: Comment[] }>(`/diagrams/comments/?diagram=${diagramId}`);
      setComments(res.data || []);
    } catch (err) {
      console.warn("Failed to load comments:", err);
    }
  };

  const fetchApprovals = async () => {
    if (!diagramId) return;
    try {
      const res = await api.get<any, { data: Approval[] }>(`/diagrams/approvals/?diagram=${diagramId}`);
      setApprovals(res.data || []);
    } catch (err) {
      console.warn("Failed to load approvals:", err);
    }
  };

  const fetchHistory = async () => {
    if (!diagramId) return;
    setHistoryLoading(true);
    try {
      const res = await api.get<any, { data: any[] }>(`/diagrams/${diagramId}/versions/`);
      setVersions(res.data || []);
    } catch (err) {
      console.warn("Failed to load versions history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (diagramId) {
      fetchComments();
      fetchApprovals();
      fetchHistory();
    }
  }, [diagramId]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !diagramId) return;

    try {
      await api.post("/diagrams/comments/", {
        diagram: diagramId,
        text: commentText,
        node_id: nodeFilter
      });
      setCommentText("");
      fetchComments();
    } catch (err) {
      alert("Failed to submit comment.");
    }
  };

  const handleResolveComment = async (id: string) => {
    try {
      await api.post(`/diagrams/comments/${id}/resolve/`);
      fetchComments();
    } catch (err) {
      alert("Failed to resolve comment.");
    }
  };

  const handlePostApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagramId) return;

    setApprovalLoading(true);
    try {
      await api.post("/diagrams/approvals/", {
        diagram: diagramId,
        status: approvalStatus,
        comments: approvalComment,
        version: "1.0" // Defaults to active version
      });
      setApprovalComment("");
      fetchApprovals();
      alert("Sign-off submitted.");
    } catch (err) {
      alert("Failed to submit sign-off.");
    } finally {
      setApprovalLoading(false);
    }
  };

  return (
    <aside className="w-64 border-l border-border bg-card/60 backdrop-blur-md p-3 flex flex-col justify-between select-none shrink-0 overflow-y-auto z-20">
      <div className="flex flex-col gap-4 text-left">
        {/* Locking & Collaboration status */}
        <Card className="p-3 bg-secondary/35 border-border/60">
          <div className="flex justify-between items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
              Canvas Locking
            </span>
            <Badge variant={diagramLocked ? "destructive" : "success"}>
              {diagramLocked ? "Locked" : "Editable"}
            </Badge>
          </div>
          {diagramLocked && (
            <p className="text-[9px] text-muted-foreground leading-normal mt-1 font-semibold">
              Currently locked by <strong className="text-foreground">{lockedByUsername}</strong>.
            </p>
          )}
          <Button 
            variant={diagramLocked ? "secondary" : "outline"} 
            size="sm" 
            onClick={onLockToggle} 
            className="w-full mt-2 text-[10px] font-bold h-7"
          >
            {diagramLocked ? (
              <>
                <Unlock className="w-3.5 h-3.5 mr-1" />
                Unlock Canvas
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 mr-1 text-primary" />
                Lock for Editing
              </>
            )}
          </Button>
        </Card>

        {/* Tab Buttons */}
        <div className="flex border-b border-border/40 pb-1 gap-1">
          <button
            onClick={() => setActiveTab("comments")}
            className={`flex-1 text-center py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              activeTab === "comments" 
                ? "text-primary border-b-2 border-primary" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Comments
          </button>
          <button
            onClick={() => setActiveTab("approvals")}
            className={`flex-1 text-center py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              activeTab === "approvals" 
                ? "text-primary border-b-2 border-primary" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign-Off
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 text-center py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              activeTab === "history" 
                ? "text-primary border-b-2 border-primary" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Checkpoints
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="flex-1 flex flex-col gap-3">
          {activeTab === "comments" && (
            <div className="flex flex-col gap-3">
              {/* Add Comment */}
              <form onSubmit={handlePostComment} className="flex gap-1.5 items-end">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Discuss node or process..."
                  className="flex-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/60"
                  disabled={!diagramId}
                />
                <Button size="icon" type="submit" disabled={!diagramId} className="w-8 h-8 rounded-lg shrink-0">
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>

              {/* Comments List */}
              <div className="flex flex-col gap-2 max-h-[30vh] overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground italic font-semibold text-center py-4">No comments posted yet.</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="p-2 border border-border bg-card/40 rounded-lg flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[9px] font-bold text-muted-foreground">
                        <span className="flex items-center gap-1 text-foreground">
                          <User className="w-3 h-3 text-primary" />
                          {c.user_username}
                        </span>
                        <span>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-foreground font-semibold leading-relaxed leading-normal">{c.text}</p>
                      
                      {!c.resolved ? (
                        <button
                          onClick={() => handleResolveComment(c.id)}
                          className="self-end text-[9px] font-bold text-primary hover:text-primary-foreground hover:bg-primary/10 px-1.5 py-0.5 rounded border border-primary/25"
                        >
                          Resolve Thread
                        </button>
                      ) : (
                        <div className="text-[9px] text-emerald-500 font-extrabold flex items-center gap-0.5 self-end">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Resolved</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "approvals" && (
            <div className="flex flex-col gap-3">
              {/* Post signoff */}
              <form onSubmit={handlePostApproval} className="flex flex-col gap-2.5 p-2 bg-secondary/15 border border-border/40 rounded-xl">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">Submit Review</span>
                
                <div className="flex gap-2">
                  <label className="flex items-center gap-1 text-[10px] font-bold cursor-pointer text-foreground">
                    <input
                      type="radio"
                      name="status"
                      checked={approvalStatus === "APPROVED"}
                      onChange={() => setApprovalStatus("APPROVED")}
                      className="accent-primary"
                    />
                    Approve
                  </label>
                  <label className="flex items-center gap-1 text-[10px] font-bold cursor-pointer text-foreground">
                    <input
                      type="radio"
                      name="status"
                      checked={approvalStatus === "REJECTED"}
                      onChange={() => setApprovalStatus("REJECTED")}
                      className="accent-primary"
                    />
                    Request Changes
                  </label>
                </div>

                <textarea
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder="Review comments..."
                  className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border text-foreground outline-none focus:border-primary min-h-[45px]"
                  required
                />

                <Button size="sm" type="submit" isLoading={approvalLoading} className="w-full h-8 text-[10px]">
                  Submit Review
                </Button>
              </form>

              {/* Approvals History */}
              <div className="flex flex-col gap-2 max-h-[30vh] overflow-y-auto">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">Approvals Audit Log</span>
                {approvals.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground italic font-semibold text-center py-2">No sign-offs registered.</p>
                ) : (
                  approvals.map((a) => (
                    <div key={a.id} className="p-2 border border-border bg-card/40 rounded-lg flex flex-col gap-1">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-[9px] font-bold text-foreground">{a.user_username}</span>
                        <Badge variant={a.status === "APPROVED" ? "success" : "destructive"}>
                          {a.status}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-normal italic font-semibold">
                        "{a.comments}"
                      </p>
                      <span className="text-[8px] text-muted-foreground text-right">
                        {new Date(a.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="flex flex-col gap-3">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">Versions Timeline</span>
              {historyLoading ? (
                <div className="text-center py-4 text-xs font-semibold text-muted-foreground">Loading versions...</div>
              ) : versions.length === 0 ? (
                <p className="text-[10px] text-muted-foreground italic font-semibold text-center py-4">No checkpoints recorded.</p>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-[40vh] overflow-y-auto">
                  {versions.map((v) => (
                    <div key={v.id} className="p-2 border border-border bg-card/40 rounded-lg flex flex-col gap-1">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-xs font-bold text-primary">v{v.version}</span>
                        <span className="text-[9px] text-muted-foreground font-bold">{new Date(v.created_at).toLocaleDateString()}</span>
                      </div>
                      <h5 className="text-[10px] font-bold text-foreground">
                        {v.checkpoint_name || "Auto-saved state"}
                      </h5>
                      {v.change_description && (
                        <p className="text-[9px] text-muted-foreground leading-normal italic">
                          "{v.change_description}"
                        </p>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRestoreVersion(v.id)}
                        className="w-full text-[9px] h-6 mt-1 border border-primary/20 text-primary hover:bg-primary/5"
                      >
                        Restore Canvas
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
export default CollaborationPanel;
