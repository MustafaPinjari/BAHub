import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Card, Button, Input } from "../../components/common/UIComponents";
import { Code, Save, Loader2, GitCommit, GitBranch, GitPullRequest, Copy, CheckCircle2 } from "lucide-react";

interface CodeCommitPanelProps {
  requirementId: string;
  requirementTitle?: string;
  reqIdStr?: string;
}

interface CodeCommit {
  id: string;
  repository_url: string;
  commit_hash: string;
  commit_message: string;
  author_name: string;
  pr_url: string;
  branch_name: string;
  created_at: string;
}

export const CodeCommitPanel: React.FC<CodeCommitPanelProps> = ({ requirementId, requirementTitle = "", reqIdStr = "" }) => {
  const [commits, setCommits] = useState<CodeCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  const [isAdding, setIsAdding] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [commitHash, setCommitHash] = useState("");
  const [commitMsg, setCommitMsg] = useState("");
  const [branchName, setBranchName] = useState("");
  const [prUrl, setPrUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCommits();
  }, [requirementId]);

  const fetchCommits = async () => {
    try {
      const res = await api.get<any, { data: CodeCommit[] }>(`/integrations/code/?requirement=${requirementId}`);
      setCommits(res.data);
    } catch (err) {
      console.error("Failed to load commits", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAttach = async () => {
    if (!repoUrl || !commitHash) return;
    setSaving(true);
    try {
      await api.post("/integrations/code/attach/", {
        requirement_id: requirementId,
        repository_url: repoUrl,
        commit_hash: commitHash,
        commit_message: commitMsg,
        branch_name: branchName,
        pr_url: prUrl,
        author_name: "Attached User"
      });
      setIsAdding(false);
      setRepoUrl("");
      setCommitHash("");
      setCommitMsg("");
      setBranchName("");
      setPrUrl("");
      fetchCommits();
    } catch (err) {
      console.error("Failed to attach commit", err);
    } finally {
      setSaving(false);
    }
  };

  const suggestedBranchName = `feature/${reqIdStr || requirementId.substring(0, 8)}-${requirementTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`.replace(/-$/, '');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(suggestedBranchName);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="w-full bg-card border border-border shadow-sm overflow-hidden flex flex-col mt-4">
      <div className="p-3 border-b border-border bg-muted/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-foreground" />
          <h3 className="text-xs font-bold text-foreground">Code Traceability</h3>
        </div>
        <div className="flex items-center gap-2">
          {!isAdding && (
            <Button size="sm" variant="outline" onClick={() => setIsAdding(true)} className="h-7 text-[10px] px-2 py-0">
              <GitCommit className="w-3 h-3 mr-1" />
              Link Commit
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Suggested Branch Generator */}
        <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-secondary/20 rounded-lg border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground flex-shrink-0">
            <GitBranch className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Suggested Branch:</span>
          </div>
          <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded truncate flex-1 w-full text-center sm:text-left">
            {suggestedBranchName}
          </code>
          <Button size="sm" variant="ghost" onClick={copyToClipboard} className="h-7 px-2 shrink-0">
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
          </Button>
        </div>

        {isAdding && (
          <div className="p-3 border border-border bg-muted/5 rounded-md flex flex-col gap-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Manual Link</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Repository URL *</label>
                <Input 
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/org/repo"
                  className="text-xs h-8"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Commit Hash *</label>
                <Input 
                  value={commitHash}
                  onChange={(e) => setCommitHash(e.target.value)}
                  placeholder="e.g. 7f8a9b0"
                  className="text-xs h-8"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Commit Message</label>
              <Input 
                value={commitMsg}
                onChange={(e) => setCommitMsg(e.target.value)}
                placeholder="Fix issue with..."
                className="text-xs h-8"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Branch Name</label>
                <Input 
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="feature/auth"
                  className="text-xs h-8"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">PR URL</label>
                <Input 
                  value={prUrl}
                  onChange={(e) => setPrUrl(e.target.value)}
                  placeholder="https://github.com/.../pull/1"
                  className="text-xs h-8"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-1">
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)} className="h-7 text-xs">Cancel</Button>
              <Button size="sm" onClick={handleAttach} disabled={saving || !repoUrl || !commitHash} className="h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
                {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                Save Link
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : commits.length === 0 ? (
          <div className="text-center py-4 text-xs text-muted-foreground font-semibold italic">
            No commits linked to this requirement yet.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {commits.map(commit => (
              <div key={commit.id} className="p-3 border border-border rounded-lg bg-card flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <GitCommit className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-bold font-mono text-foreground">{commit.commit_hash.substring(0, 7)}</span>
                  </div>
                  <a 
                    href={`${commit.repository_url}/commit/${commit.commit_hash}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[10px] text-blue-500 hover:underline font-semibold"
                  >
                    View Commit
                  </a>
                </div>
                {commit.commit_message && (
                  <p className="text-xs text-muted-foreground">{commit.commit_message}</p>
                )}
                <div className="flex items-center gap-4 mt-1 border-t border-border/50 pt-2">
                  {commit.branch_name && (
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
                      <GitBranch className="w-3 h-3" />
                      {commit.branch_name}
                    </div>
                  )}
                  {commit.pr_url && (
                    <a href={commit.pr_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[10px] text-blue-500 hover:underline font-semibold">
                      <GitPullRequest className="w-3 h-3" />
                      PR Linked
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
