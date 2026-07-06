import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Card, Button, Alert } from "../../components/common/UIComponents";
import { useAuth } from "../auth/AuthContext";
import { useProject } from "../projects/ProjectContext";
import { 
  Save, 
  Loader2, 
  FolderGit, 
  TrendingUp, 
  AlertOctagon, 
  HelpCircle, 
  ShieldCheck 
} from "lucide-react";


interface SWOT {
  id: string;
  project: string;
  project_name: string;
  strengths: string;
  weaknesses: string;
  opportunities: string;
  threats: string;
}

export const SwotAnalysisPage: React.FC = () => {
  const { user } = useAuth();
  const { activeProject } = useProject();

  // States
  const [swot, setSwot] = useState<SWOT | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [opportunities, setOpportunities] = useState("");
  const [threats, setThreats] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canManage = user ? ["ADMIN", "BUSINESS_ANALYST", "PRODUCT_OWNER"].includes(user.role) : false;

  const fetchSwot = async () => {
    if (!activeProject) return;
    setLoading(true);
    setFormError(null);
    setSuccessMessage(null);
    try {
      const res = await api.get<any, { data: SWOT }>(`/strategic/swot/?project=${activeProject.id}`);
      setSwot(res.data);
      setStrengths(res.data.strengths || "");
      setWeaknesses(res.data.weaknesses || "");
      setOpportunities(res.data.opportunities || "");
      setThreats(res.data.threats || "");
    } catch (err: any) {
      console.error("Failed to load SWOT analysis:", err);
      setFormError("Failed to load SWOT analysis data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSwot();
  }, [activeProject]);


  const handleSave = async () => {
    if (!swot) return;
    setSaving(true);
    setFormError(null);
    setSuccessMessage(null);

    const payload = {
      project: swot.project,
      strengths,
      weaknesses,
      opportunities,
      threats
    };

    try {
      const res = await api.put<any, { data: SWOT }>(`/strategic/swot/${swot.id}/`, payload);
      setSuccessMessage("SWOT Matrix saved successfully.");
      setSwot(res.data);
    } catch (err: any) {
      setFormError(err.message || "Failed to update SWOT matrix.");
    } finally {
      setSaving(false);
    }
  };

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
            Select a project context from the Projects list page before creating SWOT grids.
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
          <h1 className="text-xl font-bold tracking-tight text-foreground">SWOT Analysis</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Analyze the internal Strengths/Weaknesses and external Opportunities/Threats of {activeProject.name}.
          </p>
        </div>

        {canManage && swot && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={saving}
            className="text-xs font-bold py-1.5 px-4 self-start sm:self-auto flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Save SWOT Grid
          </Button>
        )}
      </div>

      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      {formError && <Alert variant="destructive">{formError}</Alert>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-7 h-7 text-primary animate-spin mb-2" />
          <span className="text-xs text-muted-foreground font-semibold">Loading strategic map...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          
          {/* STRENGTHS - Quadrant 1 */}
          <Card className="border-l-4 border-l-emerald-500 bg-emerald-500/5 p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-emerald-700">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-xs uppercase tracking-wider">Strengths (Internal)</h3>
            </div>
            <p className="text-[10px] text-emerald-800/80 font-semibold leading-relaxed">
              What does the business do exceptionally well? What advantages do you possess?
            </p>
            <textarea
              value={strengths}
              disabled={!canManage}
              onChange={(e) => setStrengths(e.target.value)}
              rows={6}
              className="w-full text-xs font-semibold border border-emerald-500/20 bg-background rounded-lg p-3 outline-none text-foreground leading-relaxed resize-none focus:border-emerald-500"
              placeholder="e.g. • Fast responsive React UI&#10;• Direct client partnerships&#10;• Flexible microservice backend"
            />
          </Card>

          {/* WEAKNESSES - Quadrant 2 */}
          <Card className="border-l-4 border-l-rose-500 bg-rose-500/5 p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertOctagon className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-xs uppercase tracking-wider">Weaknesses (Internal)</h3>
            </div>
            <p className="text-[10px] text-rose-800/80 font-semibold leading-relaxed">
              Where can the business improve? What limitations are hindering team progress?
            </p>
            <textarea
              value={weaknesses}
              disabled={!canManage}
              onChange={(e) => setWeaknesses(e.target.value)}
              rows={6}
              className="w-full text-xs font-semibold border border-rose-500/20 bg-background rounded-lg p-3 outline-none text-foreground leading-relaxed resize-none focus:border-rose-500"
              placeholder="e.g. • Small engineering team&#10;• Legacy databases architecture&#10;• Limited marketing budget"
            />
          </Card>

          {/* OPPORTUNITIES - Quadrant 3 */}
          <Card className="border-l-4 border-l-blue-500 bg-blue-500/5 p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-blue-700">
              <TrendingUp className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-xs uppercase tracking-wider">Opportunities (External)</h3>
            </div>
            <p className="text-[10px] text-blue-800/80 font-semibold leading-relaxed">
              What external trends or target demographics can the business leverage to expand?
            </p>
            <textarea
              value={opportunities}
              disabled={!canManage}
              onChange={(e) => setOpportunities(e.target.value)}
              rows={6}
              className="w-full text-xs font-semibold border border-blue-500/20 bg-background rounded-lg p-3 outline-none text-foreground leading-relaxed resize-none focus:border-blue-500"
              placeholder="e.g. • Expanding into EU mobile markets&#10;• Automated document scanning AI feature&#10;• Integrations with Stripe Checkout"
            />
          </Card>

          {/* THREATS - Quadrant 4 */}
          <Card className="border-l-4 border-l-amber-500 bg-amber-500/5 p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-amber-700">
              <HelpCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-xs uppercase tracking-wider">Threats (External)</h3>
            </div>
            <p className="text-[10px] text-amber-800/80 font-semibold leading-relaxed">
              What external factors, competitors, or supply-chain bottlenecks present risks?
            </p>
            <textarea
              value={threats}
              disabled={!canManage}
              onChange={(e) => setThreats(e.target.value)}
              rows={6}
              className="w-full text-xs font-semibold border border-amber-500/20 bg-background rounded-lg p-3 outline-none text-foreground leading-relaxed resize-none focus:border-amber-500"
              placeholder="e.g. • Agile competitors copying features&#10;• Changing GDPR data retention rules&#10;• Unstable cloud hosting services"
            />
          </Card>

        </div>
      )}
    </div>
  );
};
