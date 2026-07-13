import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Card, Button, Alert, Input, Select, Badge } from "../../components/common/UIComponents";
import { useAuth } from "../auth/AuthContext";
import { useProject } from "../projects/ProjectContext";
import { FeatureLock } from "../../components/common/FeatureLock";
import {
  FolderGit,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Database,
  Link2,
  FileText,
  AlertTriangle,
  Info
} from "lucide-react";


interface IntegrationConfig {
  id?: string;
  project: string;
  jira_url: string;
  jira_username: string;
  jira_api_token: string;
  jira_project_key: string;
  confluence_url: string;
  confluence_username: string;
  confluence_api_token: string;
  confluence_space_key: string;
}

interface SyncLog {
  id: string;
  sync_type: "JIRA_STORIES" | "CONFLUENCE_DOC";
  status: "SUCCESS" | "FAILED";
  message: string;
  triggered_by_username: string;
  created_at: string;
}

interface BusinessDocument {
  id: string;
  title: string;
  doc_type: string;
  status: string;
}

export const IntegrationsPage: React.FC = () => {
  const { user } = useAuth();
  const { activeProject } = useProject();

  // Connection Configurations
  const [jiraUrl, setJiraUrl] = useState("");
  const [jiraUser, setJiraUser] = useState("");
  const [jiraToken, setJiraToken] = useState("");
  const [jiraKey, setJiraKey] = useState("");

  const [confUrl, setConfUrl] = useState("");
  const [confUser, setConfUser] = useState("");
  const [confToken, setConfToken] = useState("");
  const [confKey, setConfKey] = useState("");

  // System status
  const [jiraConnected, setJiraConnected] = useState<boolean | null>(null);
  const [confConnected, setConfConnected] = useState<boolean | null>(null);

  // Lists & selections
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [documents, setDocuments] = useState<BusinessDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState("");

  // Loading flags
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingJira, setSavingJira] = useState(false);
  const [savingConf, setSavingConf] = useState(false);
  const [testingJira, setTestingJira] = useState(false);
  const [testingConfluence, setTestingConfluence] = useState(false);
  const [syncingStories, setSyncingStories] = useState(false);
  const [syncingDoc, setSyncingDoc] = useState(false);

  // Alert/Notif feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canManage = user ? ["ADMIN", "BUSINESS_ANALYST", "PRODUCT_OWNER"].includes(user.role) : false;

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setErrorMessage(null);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setSuccessMessage(null);
    setTimeout(() => setErrorMessage(null), 6000);
  };

  // 1. Fetch config, sync logs, and generated docs
  const fetchIntegrationData = async () => {
    if (!activeProject) return;
    setLoadingConfig(true);
    setJiraConnected(null);
    setConfConnected(null);
    try {
      // Config setup
      const configRes = await api.get<any, { data: IntegrationConfig }>(
        `/integrations/config/by-project/?project=${activeProject.id}`
      );
      const conf = configRes.data;
      setJiraUrl(conf.jira_url || "");
      setJiraUser(conf.jira_username || "");
      setJiraToken(conf.jira_api_token || "");
      setJiraKey(conf.jira_project_key || "");

      setConfUrl(conf.confluence_url || "");
      setConfUser(conf.confluence_username || "");
      setConfToken(conf.confluence_api_token || "");
      setConfKey(conf.confluence_space_key || "");

      if (conf.jira_url && conf.jira_username && conf.jira_api_token && conf.jira_project_key) {
        setJiraConnected(true);
      }
      if (conf.confluence_url && conf.confluence_username && conf.confluence_api_token && conf.confluence_space_key) {
        setConfConnected(true);
      }

      // Sync Logs
      const logsRes = await api.get<any, { data: SyncLog[] }>(
        `/integrations/sync-logs/?project=${activeProject.id}`
      );
      setSyncLogs(logsRes.data || []);

      // Generated Documents
      const docsRes = await api.get<any, { data: BusinessDocument[] }>(
        `/documents/?project=${activeProject.id}`
      );
      const docList = docsRes.data || [];
      setDocuments(docList);
      if (docList.length > 0) {
        const firstDoc = docList[0];
        if (firstDoc) {
          setSelectedDocId(firstDoc.id);
        }
      } else {
        setSelectedDocId("");
      }
    } catch (err: any) {
      console.error("Failed to load integration configurations:", err);
      showError(err.message || "Failed to load integration credentials.");
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    fetchIntegrationData();
  }, [activeProject]);

  // 2. Save Jira configuration
  const handleSaveJira = async () => {
    if (!activeProject) return;
    setSavingJira(true);
    try {
      await api.post("/integrations/config/save-config/", {
        project: activeProject.id,
        jira_url: jiraUrl,
        jira_username: jiraUser,
        jira_api_token: jiraToken,
        jira_project_key: jiraKey
      });
      showSuccess("Jira integration settings saved successfully.");
      setJiraConnected(jiraUrl && jiraUser && jiraToken && jiraKey ? true : null);
      fetchIntegrationData();
    } catch (err: any) {
      showError(err.message || "Failed to save Jira configuration.");
    } finally {
      setSavingJira(false);
    }
  };

  // 3. Save Confluence configuration
  const handleSaveConfluence = async () => {
    if (!activeProject) return;
    setSavingConf(true);
    try {
      await api.post("/integrations/config/save-config/", {
        project: activeProject.id,
        confluence_url: confUrl,
        confluence_username: confUser,
        confluence_api_token: confToken,
        confluence_space_key: confKey
      });
      showSuccess("Confluence integration settings saved successfully.");
      setConfConnected(confUrl && confUser && confToken && confKey ? true : null);
      fetchIntegrationData();
    } catch (err: any) {
      showError(err.message || "Failed to save Confluence configuration.");
    } finally {
      setSavingConf(false);
    }
  };

  // 4. Connection testing
  const handleTestJira = async () => {
    setTestingJira(true);
    try {
      const res = await api.post<any, { data: { connected: boolean } }>(
        "/integrations/test-connection/",
        {
          system: "jira",
          url: jiraUrl,
          username: jiraUser,
          token: jiraToken,
          key: jiraKey
        }
      );
      if (res.data?.connected) {
        setJiraConnected(true);
        showSuccess("Successfully connected to Jira server!");
      }
    } catch (err: any) {
      setJiraConnected(false);
      showError(err.message || "Jira connection handshake failed.");
    } finally {
      setTestingJira(false);
    }
  };

  const handleTestConfluence = async () => {
    setTestingConfluence(true);
    try {
      const res = await api.post<any, { data: { connected: boolean } }>(
        "/integrations/test-connection/",
        {
          system: "confluence",
          url: confUrl,
          username: confUser,
          token: confToken,
          key: confKey
        }
      );
      if (res.data?.connected) {
        setConfConnected(true);
        showSuccess("Successfully connected to Confluence space!");
      }
    } catch (err: any) {
      setConfConnected(false);
      showError(err.message || "Confluence connection handshake failed.");
    } finally {
      setTestingConfluence(false);
    }
  };

  // 5. Trigger backlogs stories sync to Jira
  const handleSyncStories = async () => {
    if (!activeProject) return;
    setSyncingStories(true);
    try {
      const res = await api.post<any, { message: string }>(
        "/integrations/jira/sync-stories/",
        { project_id: activeProject.id }
      );
      showSuccess(res.message || "User stories synchronized successfully.");
      fetchIntegrationData();
    } catch (err: any) {
      showError(err.message || "User story synchronization failed.");
      fetchIntegrationData();
    } finally {
      setSyncingStories(false);
    }
  };

  // 6. Trigger document publishing to Confluence
  const handleSyncDocument = async () => {
    if (!activeProject || !selectedDocId) return;
    setSyncingDoc(true);
    try {
      const res = await api.post<any, { message: string }>(
        "/integrations/confluence/sync-document/",
        {
          project_id: activeProject.id,
          document_id: selectedDocId
        }
      );
      showSuccess(res.message || "Document published successfully.");
      fetchIntegrationData();
    } catch (err: any) {
      showError(err.message || "Document publishing failed.");
      fetchIntegrationData();
    } finally {
      setSyncingDoc(false);
    }
  };

  if (user?.plan_tier !== "ENTERPRISE") {
    return (
      <FeatureLock
        requiredTier="ENTERPRISE"
        featureName="Jira & Confluence Sync"
        featureDescription="Integrate your workspace with external tracking systems. Synchronize requirement backlogs, compile reports, and publish specs directly to Atlassian tools."
      />
    );
  }

  // Placeholder if no project context
  if (!activeProject) {
    return (
      <Card className="flex flex-col items-center justify-center text-center p-12 py-16 max-w-lg mx-auto gap-4 mt-12 select-none text-foreground font-semibold">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 shrink-0">
          <FolderGit className="w-6 h-6 animate-pulse" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-bold uppercase tracking-wider">No Active Project selected</h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
            Select a project context from the Projects list page before configuring sync integrations.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 select-none text-foreground">
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-border pb-5 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Database className="w-5.5 h-5.5 text-[#2563EB]" />
            Jira & Confluence Integration
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure project connections to sync drafted user stories and publish specifications for {activeProject.name}.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchIntegrationData}
          isLoading={loadingConfig}
          className="text-xs font-bold py-1.5 px-3 self-start sm:self-auto flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reload settings
        </Button>
      </div>

      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      {errorMessage && <Alert variant="destructive">{errorMessage}</Alert>}

      {loadingConfig ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-7 h-7 text-primary animate-spin mb-2" />
          <span className="text-xs text-muted-foreground font-semibold">Loading configurations...</span>
        </div>
      ) : (
        <>
          {/* Row 1: Configurations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Jira Connection Config */}
            <Card className="flex flex-col gap-4">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-slate-800">
                  <Link2 className="w-4 h-4 text-blue-500" />
                  Jira Backlog Integration
                </h3>
                {jiraConnected === true ? (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle className="w-3 h-3" /> Connected
                  </Badge>
                ) : jiraConnected === false ? (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="w-3 h-3" /> Failed
                  </Badge>
                ) : (
                  <Badge variant="outline">Not Configured</Badge>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <Input
                  label="Jira Host URL"
                  placeholder="e.g. https://your-domain.atlassian.net"
                  value={jiraUrl}
                  disabled={!canManage}
                  onChange={(e) => setJiraUrl(e.target.value)}
                />
                <Input
                  label="Jira User Account (Email)"
                  placeholder="e.g. business-analyst@company.com"
                  value={jiraUser}
                  disabled={!canManage}
                  onChange={(e) => setJiraUser(e.target.value)}
                />
                <Input
                  label="Atlassian API Token"
                  type="password"
                  placeholder="••••••••••••••••••••••••"
                  value={jiraToken}
                  disabled={!canManage}
                  onChange={(e) => setJiraToken(e.target.value)}
                  helperText="Generated under Account Settings -> Security -> API Tokens"
                />
                <Input
                  label="Jira Project Key"
                  placeholder="e.g. PROJ"
                  value={jiraKey}
                  disabled={!canManage}
                  onChange={(e) => setJiraKey(e.target.value)}
                />
              </div>

              {canManage && (
                <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestJira}
                    isLoading={testingJira}
                    disabled={!jiraUrl || !jiraUser || !jiraToken || !jiraKey}
                  >
                    Test Connection
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveJira}
                    isLoading={savingJira}
                  >
                    Save Configuration
                  </Button>
                </div>
              )}
            </Card>

            {/* Confluence Spaces Config */}
            <Card className="flex flex-col gap-4">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-slate-800">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  Confluence Wiki Publishing
                </h3>
                {confConnected === true ? (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle className="w-3 h-3" /> Connected
                  </Badge>
                ) : confConnected === false ? (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="w-3 h-3" /> Failed
                  </Badge>
                ) : (
                  <Badge variant="outline">Not Configured</Badge>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <Input
                  label="Confluence URL"
                  placeholder="e.g. https://your-domain.atlassian.net/wiki"
                  value={confUrl}
                  disabled={!canManage}
                  onChange={(e) => setConfUrl(e.target.value)}
                />
                <Input
                  label="Confluence User (Email)"
                  placeholder="e.g. business-analyst@company.com"
                  value={confUser}
                  disabled={!canManage}
                  onChange={(e) => setConfUser(e.target.value)}
                />
                <Input
                  label="Atlassian API Token"
                  type="password"
                  placeholder="••••••••••••••••••••••••"
                  value={confToken}
                  disabled={!canManage}
                  onChange={(e) => setConfToken(e.target.value)}
                  helperText="Shares credentials API token with Jira in Atlassian profiles"
                />
                <Input
                  label="Confluence Space Key"
                  placeholder="e.g. DS"
                  value={confKey}
                  disabled={!canManage}
                  onChange={(e) => setConfKey(e.target.value)}
                />
              </div>

              {canManage && (
                <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestConfluence}
                    isLoading={testingConfluence}
                    disabled={!confUrl || !confUser || !confToken || !confKey}
                  >
                    Test Connection
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveConfluence}
                    isLoading={savingConf}
                  >
                    Save Configuration
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Row 2: Actions & History */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sync Triggers */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              {/* Jira Sync trigger card */}
              <Card className="flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Jira Backlog Launcher
                </h3>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Synchronize the stories in this project backlog to Jira. Newly generated specification sheets are exported to active backlogs automatically.
                </p>
                <Button
                  variant="primary"
                  className="w-full text-xs font-bold"
                  onClick={handleSyncStories}
                  isLoading={syncingStories}
                  disabled={!jiraConnected || !canManage}
                >
                  <Link2 className="w-3.5 h-3.5 mr-1.5" />
                  Sync Stories to Jira
                </Button>
                {!jiraConnected && (
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-600 bg-amber-50 border border-amber-200/50 p-2 rounded-lg font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Configure connection to enable sync launcher
                  </div>
                )}
              </Card>

              {/* Confluence document sync card */}
              <Card className="flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Confluence Space Publisher
                </h3>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Select a signed-off or drafted BRD/FRD requirements catalog from your local workspace repository and publish it directly.
                </p>

                {documents.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    <Select
                      label="Select Document"
                      options={documents.map((d) => ({
                        value: d.id,
                        label: `[${d.doc_type}] ${d.title} (${d.status})`
                      }))}
                      value={selectedDocId}
                      onChange={(e) => setSelectedDocId(e.target.value)}
                    />
                    <Button
                      variant="primary"
                      className="w-full text-xs font-bold bg-[#16A34A] hover:bg-[#15803D]"
                      onClick={handleSyncDocument}
                      isLoading={syncingDoc}
                      disabled={!confConnected || !selectedDocId || !canManage}
                    >
                      <FileText className="w-3.5 h-3.5 mr-1.5" />
                      Publish to Confluence
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-50 border border-slate-200 p-2 rounded-lg font-semibold">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    No generated specifications found. Generate a BRD/FRD first.
                  </div>
                )}

                {!confConnected && (
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-600 bg-amber-50 border border-amber-200/50 p-2 rounded-lg font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Configure connection to enable publishing
                  </div>
                )}
              </Card>
            </div>

            {/* Sync Auditing logs */}
            <Card className="lg:col-span-2 flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-border pb-2">
                Sync Logs & Auditing History
              </h3>
              
              <div className="overflow-x-auto flex-1 min-h-[300px]">
                {syncLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs py-16 gap-2">
                    <Database className="w-8 h-8 opacity-25" />
                    No synchronization events logged for this project.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-[11px] font-semibold text-slate-700">
                    <thead>
                      <tr className="border-b border-border text-slate-400 uppercase tracking-wider text-[9px] font-bold">
                        <th className="py-2.5 px-2">Timestamp</th>
                        <th className="py-2.5 px-2">Operation Type</th>
                        <th className="py-2.5 px-2">Status</th>
                        <th className="py-2.5 px-2">Event Summary</th>
                        <th className="py-2.5 px-2">Triggered By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {syncLogs.map((log) => (
                        <tr key={log.id} className="border-b border-border hover:bg-slate-50/40">
                          <td className="py-2.5 px-2 text-slate-400 whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-2 font-bold text-slate-600">
                            {log.sync_type === "JIRA_STORIES" ? (
                              <span className="flex items-center gap-1">
                                <Link2 className="w-3 h-3 text-blue-500" /> Jira Sync
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3 text-emerald-500" /> Confluence Sync
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-2">
                            {log.status === "SUCCESS" ? (
                              <Badge variant="success">SUCCESS</Badge>
                            ) : (
                              <Badge variant="destructive">FAILED</Badge>
                            )}
                          </td>
                          <td className="py-2.5 px-2 max-w-xs truncate" title={log.message}>
                            {log.message}
                          </td>
                          <td className="py-2.5 px-2 text-slate-500">
                            @{log.triggered_by_username}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
