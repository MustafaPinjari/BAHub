import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../services/api";
import { useProject } from "../projects/ProjectContext";
import { Card, Badge, Button, Input, Alert } from "../../components/common/UIComponents";
import {
  Bug,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Loader2,
  ClipboardList
} from "lucide-react";

// Types matching Django models
interface Requirement {
  id: string;
  req_id: string;
  title: string;
}

interface TestCase {
  id: string;
  project: string;
  requirement: string | null;
  requirement_detail?: Requirement;
  title: string;
  scenario: string;
  acceptance_criteria: string;
  status: "PENDING" | "PASSED" | "FAILED";
  created_by_username?: string;
  created_at: string;
}

interface Defect {
  id: string;
  project: string;
  test_case: string | null;
  test_case_title?: string;
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  created_by_username?: string;
  created_at: string;
}

export const UatPage: React.FC = () => {
  const { activeProject } = useProject();

  // Tab state
  const [activeTab, setActiveTab] = useState<"cases" | "defects">("cases");

  // Data states
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal forms
  const [caseModalOpen, setCaseModalOpen] = useState(false);
  const [defectModalOpen, setDefectModalOpen] = useState(false);

  // Form states - Test Case
  const [newCaseTitle, setNewCaseTitle] = useState("");
  const [newCaseScenario, setNewCaseScenario] = useState("");
  const [newCaseCriteria, setNewCaseCriteria] = useState("");
  const [newCaseReqId, setNewCaseReqId] = useState("");

  // Form states - Defect
  const [newDefectTitle, setNewDefectTitle] = useState("");
  const [newDefectDesc, setNewDefectDesc] = useState("");
  const [newDefectSeverity, setNewDefectSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [newDefectCaseId, setNewDefectCaseId] = useState("");

  const fetchData = useCallback(async () => {
    if (!activeProject?.id) return;
    setLoading(true);
    setError(null);
    try {
      const pid = activeProject.id;
      const [casesRes, defectsRes, reqsRes] = await Promise.all([
        api.get<any, { data: TestCase[] }>(`/uat/test-cases/?project=${pid}`),
        api.get<any, { data: Defect[] }>(`/uat/defects/?project=${pid}`),
        api.get<any, { data: Requirement[] }>(`/requirements/?project=${pid}`),
      ]);
      setTestCases(casesRes.data || []);
      setDefects(defectsRes.data || []);
      setRequirements(reqsRes.data || []);
    } catch (err) {
      setError("Failed to load UAT workspace data. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  }, [activeProject?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Quick Execution toggles
  const handleExecute = async (caseId: string, newStatus: "PASSED" | "FAILED") => {
    try {
      await api.patch(`/uat/test-cases/${caseId}/`, { status: newStatus });
      
      // Update local state
      setTestCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, status: newStatus } : c))
      );

      // If failed, auto-prompt/open defect dialog with prefilled details
      if (newStatus === "FAILED") {
        const failedCase = testCases.find((c) => c.id === caseId);
        if (failedCase) {
          setNewDefectTitle(`Defect: ${failedCase.title} execution failure`);
          setNewDefectDesc(`Test scenario failed:\n${failedCase.scenario}\n\nExpected criteria:\n${failedCase.acceptance_criteria}`);
          setNewDefectCaseId(caseId);
          setDefectModalOpen(true);
        }
      }
    } catch (err) {
      console.error("Failed to execute test case:", err);
    }
  };

  // Create Test Case
  const handleCreateTestCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject?.id || !newCaseTitle) return;

    try {
      const payload = {
        project: activeProject.id,
        title: newCaseTitle,
        scenario: newCaseScenario,
        acceptance_criteria: newCaseCriteria,
        requirement: newCaseReqId || null,
        status: "PENDING",
      };
      await api.post("/uat/test-cases/", payload);
      setCaseModalOpen(false);
      setNewCaseTitle("");
      setNewCaseScenario("");
      setNewCaseCriteria("");
      setNewCaseReqId("");
      fetchData();
    } catch (err) {
      console.error("Failed to create test case", err);
    }
  };

  // Create Defect
  const handleCreateDefect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject?.id || !newDefectTitle) return;

    try {
      const payload = {
        project: activeProject.id,
        title: newDefectTitle,
        description: newDefectDesc,
        severity: newDefectSeverity,
        test_case: newDefectCaseId || null,
        status: "OPEN",
      };
      await api.post("/uat/defects/", payload);
      setDefectModalOpen(false);
      setNewDefectTitle("");
      setNewDefectDesc("");
      setNewDefectSeverity("MEDIUM");
      setNewDefectCaseId("");
      fetchData();
    } catch (err) {
      console.error("Failed to create defect", err);
    }
  };

  // Update Defect status
  const handleUpdateDefectStatus = async (defectId: string, newStatus: string) => {
    try {
      await api.patch(`/uat/defects/${defectId}/`, { status: newStatus });
      setDefects((prev) =>
        prev.map((d) => (d.id === defectId ? { ...d, status: newStatus as any } : d))
      );
    } catch (err) {
      console.error("Failed to update defect status:", err);
    }
  };

  // Delete Test Case
  const handleDeleteCase = async (id: string) => {
    if (!confirm("Delete this test case?")) return;
    try {
      await api.delete(`/uat/test-cases/${id}/`);
      setTestCases((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Failed to delete test case", err);
    }
  };

  // Delete Defect
  const handleDeleteDefect = async (id: string) => {
    if (!confirm("Delete this defect report?")) return;
    try {
      await api.delete(`/uat/defects/${id}/`);
      setDefects((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error("Failed to delete defect", err);
    }
  };

  if (!activeProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <Bug className="w-6 h-6 text-purple-400" />
        </div>
        <h2 className="text-base font-bold text-white">No Active Project Selected</h2>
        <p className="text-xs text-gray-500 max-w-sm">
          Select or create a workspace project to build test cases and log UAT defects.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center">
              <Bug className="w-4 h-4 text-purple-400" />
            </div>
            <h1 className="text-sm font-bold text-white tracking-tight">UAT & Testing</h1>
          </div>
          <p className="text-[10px] text-gray-500 pl-10 font-semibold tracking-wide">
            VERIFY FUNCTIONAL IMPLEMENTATIONS AND LOG PROJECT DEFECTS
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "cases" ? (
            <Button size="sm" onClick={() => setCaseModalOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> New Test Case
            </Button>
          ) : (
            <Button size="sm" onClick={() => setDefectModalOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Log Defect
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-white/[0.08] gap-6">
        <button
          onClick={() => setActiveTab("cases")}
          className={`pb-2.5 text-xs font-semibold relative cursor-pointer outline-none bg-transparent border-none ${
            activeTab === "cases" ? "text-purple-400" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Test Scenarios ({testCases.length})
          {activeTab === "cases" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("defects")}
          className={`pb-2.5 text-xs font-semibold relative cursor-pointer outline-none bg-transparent border-none ${
            activeTab === "defects" ? "text-red-400" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Defect Register ({defects.length})
          {activeTab === "defects" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
          )}
        </button>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      {/* Data loading spinner */}
      {loading && (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
      )}

      {!loading && (
        <>
          {/* Test Cases Tab Content */}
          {activeTab === "cases" && (
            <div className="grid grid-cols-1 gap-4">
              {testCases.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500 border border-dashed border-white/[0.08] rounded-2xl">
                  No test scenarios written yet. Click "New Test Case" to begin mapping criteria.
                </div>
              ) : (
                testCases.map((tc) => (
                  <Card key={tc.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-2 max-w-2xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white">{tc.title}</span>
                        {tc.requirement_detail && (
                          <Badge variant="outline" className="text-[9px]">
                            {tc.requirement_detail.req_id} · {tc.requirement_detail.title}
                          </Badge>
                        )}
                        <Badge
                          variant={
                            tc.status === "PASSED"
                              ? "success"
                              : tc.status === "FAILED"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {tc.status}
                        </Badge>
                      </div>

                      <div className="space-y-1 pl-1">
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                          <strong className="text-gray-500 text-[10px] uppercase font-bold mr-1">Scenario:</strong>
                          {tc.scenario || "None provided"}
                        </p>
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                          <strong className="text-gray-500 text-[10px] uppercase font-bold mr-1">Criteria:</strong>
                          {tc.acceptance_criteria || "None provided"}
                        </p>
                      </div>
                      
                      <div className="text-[9px] text-gray-600 pl-1 font-medium">
                        Created by {tc.created_by_username || "unknown"} on {new Date(tc.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                      <Button
                        size="sm"
                        variant="minimal"
                        className="text-green-500 hover:bg-green-500/10 hover:text-green-400 border-green-500/20"
                        onClick={() => handleExecute(tc.id, "PASSED")}
                        title="Mark scenario as Passed"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Pass
                      </Button>
                      <Button
                        size="sm"
                        variant="minimal"
                        className="text-red-500 hover:bg-red-500/10 hover:text-red-400 border-red-500/20"
                        onClick={() => handleExecute(tc.id, "FAILED")}
                        title="Mark scenario as Failed and log a defect"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Fail
                      </Button>
                      <button
                        onClick={() => handleDeleteCase(tc.id)}
                        className="text-gray-700 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors border-none bg-transparent cursor-pointer"
                        title="Delete test case"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Defects Tab Content */}
          {activeTab === "defects" && (
            <div className="grid grid-cols-1 gap-4">
              {defects.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500 border border-dashed border-white/[0.08] rounded-2xl">
                  No defects logged. UAT verification is currently clear!
                </div>
              ) : (
                defects.map((df) => (
                  <Card key={df.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-2 max-w-2xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white">{df.title}</span>
                        {df.test_case_title && (
                          <Badge variant="outline" className="text-[9px]">
                            TC: {df.test_case_title}
                          </Badge>
                        )}
                        <Badge
                          variant={
                            df.severity === "CRITICAL" || df.severity === "HIGH"
                              ? "destructive"
                              : df.severity === "MEDIUM"
                              ? "warning"
                              : "secondary"
                          }
                        >
                          {df.severity}
                        </Badge>
                        <Badge
                          variant={
                            df.status === "CLOSED"
                              ? "success"
                              : df.status === "RESOLVED"
                              ? "default"
                              : "warning"
                          }
                        >
                          {df.status.replace("_", " ")}
                        </Badge>
                      </div>

                      <p className="text-[11px] text-gray-400 leading-relaxed pl-1">
                        <strong className="text-gray-500 text-[10px] uppercase font-bold mr-1">Description:</strong>
                        {df.description || "No description"}
                      </p>
                      
                      <div className="text-[9px] text-gray-600 pl-1 font-medium">
                        Reported by {df.created_by_username || "unknown"} on {new Date(df.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-start md:self-center shrink-0">
                      <div className="flex flex-col gap-1 text-[10px]">
                        <span className="text-gray-600 font-bold uppercase text-[8px] pl-0.5">Change Status:</span>
                        <select
                          value={df.status}
                          onChange={(e) => handleUpdateDefectStatus(df.id, e.target.value)}
                          className="bg-gray-900 border border-white/[0.08] text-gray-200 text-xs rounded-md px-2.5 py-1 outline-none cursor-pointer focus:border-purple-500"
                        >
                          <option value="OPEN">Open</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="CLOSED">Closed</option>
                        </select>
                      </div>
                      <button
                        onClick={() => handleDeleteDefect(df.id)}
                        className="text-gray-700 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors border-none bg-transparent cursor-pointer mt-4"
                        title="Delete defect"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Modal Dialogs */}
      {/* ── TestCase Modal ── */}
      {caseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCaseModalOpen(false)} />
          <div className="relative w-full max-w-md bg-gray-950 border border-white/[0.10] rounded-2xl p-6 shadow-2xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <ClipboardList className="w-4 h-4 text-purple-400" /> Write Test Scenario
            </h2>
            <form onSubmit={handleCreateTestCase} className="flex flex-col gap-4">
              <Input
                label="Scenario Title"
                placeholder="e.g. Verify user can check out as guest"
                value={newCaseTitle}
                onChange={(e) => setNewCaseTitle(e.target.value)}
                required
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Test Scenario Steps</label>
                <textarea
                  value={newCaseScenario}
                  onChange={(e) => setNewCaseScenario(e.target.value)}
                  placeholder="Step-by-step navigation process..."
                  className="w-full min-h-[70px] text-xs bg-gray-900 border border-white/[0.08] text-gray-200 rounded-md p-2.5 outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Expected Acceptance Criteria</label>
                <textarea
                  value={newCaseCriteria}
                  onChange={(e) => setNewCaseCriteria(e.target.value)}
                  placeholder="Outcome that verifies completion..."
                  className="w-full min-h-[70px] text-xs bg-gray-900 border border-white/[0.08] text-gray-200 rounded-md p-2.5 outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Trace to Requirement</label>
                <select
                  value={newCaseReqId}
                  onChange={(e) => setNewCaseReqId(e.target.value)}
                  className="bg-gray-900 border border-white/[0.08] text-gray-200 text-xs rounded-md p-2 outline-none cursor-pointer focus:border-purple-500"
                >
                  <option value="">General Project Scenario (No Link)</option>
                  {requirements.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.req_id || "REQ"}: {r.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 mt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setCaseModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Create Test Case
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Defect Modal ── */}
      {defectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDefectModalOpen(false)} />
          <div className="relative w-full max-w-md bg-gray-950 border border-white/[0.10] rounded-2xl p-6 shadow-2xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4 text-red-400">
              <Bug className="w-4 h-4" /> Log Workspace Defect
            </h2>
            <form onSubmit={handleCreateDefect} className="flex flex-col gap-4">
              <Input
                label="Defect Title"
                placeholder="e.g. Page crash during card details validation"
                value={newDefectTitle}
                onChange={(e) => setNewDefectTitle(e.target.value)}
                required
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Detailed Description</label>
                <textarea
                  value={newDefectDesc}
                  onChange={(e) => setNewDefectDesc(e.target.value)}
                  placeholder="Include steps to reproduce, actual vs expected outcomes, or crash logs..."
                  className="w-full min-h-[90px] text-xs bg-gray-900 border border-white/[0.08] text-gray-200 rounded-md p-2.5 outline-none focus:border-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Severity</label>
                  <select
                    value={newDefectSeverity}
                    onChange={(e) => setNewDefectSeverity(e.target.value as any)}
                    className="bg-gray-900 border border-white/[0.08] text-gray-200 text-xs rounded-md p-2 outline-none cursor-pointer focus:border-purple-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Linked Test Case</label>
                  <select
                    value={newDefectCaseId}
                    onChange={(e) => setNewDefectCaseId(e.target.value)}
                    className="bg-gray-900 border border-white/[0.08] text-gray-200 text-xs rounded-md p-2 outline-none cursor-pointer focus:border-purple-500"
                  >
                    <option value="">None (Ad-Hoc Defect)</option>
                    {testCases.map((tc) => (
                      <option key={tc.id} value={tc.id}>
                        {tc.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setDefectModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-red-600 hover:bg-red-500 text-white border-none">
                  Log Defect
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
