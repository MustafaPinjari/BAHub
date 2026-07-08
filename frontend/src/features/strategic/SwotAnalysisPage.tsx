import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Card, Button, Alert, Textarea } from "../../components/common/UIComponents";
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
        <div className="text-left">
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
            className="text-xs font-bold py-1.5 px-4 self-start sm:self-auto flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150"
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
          <Card className="relative overflow-hidden border border-white/[0.06] bg-secondary/30 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-950/5 transition-all duration-300 p-6 flex flex-col gap-4 group">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-emerald-500/[0.02] blur-2xl pointer-events-none group-hover:bg-emerald-500/[0.05] transition-colors" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4 shrink-0 animate-in fade-in" />
              </div>
              <div className="flex flex-col text-left">
                <h3 className="font-bold text-xs uppercase tracking-wider text-white">Strengths</h3>
                <span className="text-[9px] font-bold text-emerald-500/80 uppercase tracking-widest mt-0.5">Internal Capability</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed text-left">
              What does the business do exceptionally well? What advantages do you possess?
            </p>
            <Textarea
              value={strengths}
              disabled={!canManage}
              onChange={(e) => setStrengths(e.target.value)}
              rows={6}
              className="resize-none font-semibold leading-relaxed border-white/[0.06] focus:border-emerald-500/40 bg-black/40"
              placeholder="e.g. • Fast responsive React UI&#10;• Direct client partnerships&#10;• Flexible microservice backend"
            />
          </Card>

          {/* WEAKNESSES - Quadrant 2 */}
          <Card className="relative overflow-hidden border border-white/[0.06] bg-secondary/30 hover:border-rose-500/30 hover:shadow-lg hover:shadow-rose-950/5 transition-all duration-300 p-6 flex flex-col gap-4 group">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-rose-500/[0.02] blur-2xl pointer-events-none group-hover:bg-rose-500/[0.05] transition-colors" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400">
                <AlertOctagon className="w-4 h-4 shrink-0" />
              </div>
              <div className="flex flex-col text-left">
                <h3 className="font-bold text-xs uppercase tracking-wider text-white">Weaknesses</h3>
                <span className="text-[9px] font-bold text-rose-500/80 uppercase tracking-widest mt-0.5">Internal Limitations</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed text-left">
              Where can the business improve? What limitations are hindering team progress?
            </p>
            <Textarea
              value={weaknesses}
              disabled={!canManage}
              onChange={(e) => setWeaknesses(e.target.value)}
              rows={6}
              className="resize-none font-semibold leading-relaxed border-white/[0.06] focus:border-rose-500/40 bg-black/40"
              placeholder="e.g. • Small engineering team&#10;• Legacy databases architecture&#10;• Limited marketing budget"
            />
          </Card>

          {/* OPPORTUNITIES - Quadrant 3 */}
          <Card className="relative overflow-hidden border border-white/[0.06] bg-secondary/30 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-950/5 transition-all duration-300 p-6 flex flex-col gap-4 group">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-blue-500/[0.02] blur-2xl pointer-events-none group-hover:bg-blue-500/[0.05] transition-colors" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
                <TrendingUp className="w-4 h-4 shrink-0" />
              </div>
              <div className="flex flex-col text-left">
                <h3 className="font-bold text-xs uppercase tracking-wider text-white">Opportunities</h3>
                <span className="text-[9px] font-bold text-blue-500/80 uppercase tracking-widest mt-0.5">External Factors</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed text-left">
              What external trends or target demographics can the business leverage to expand?
            </p>
            <Textarea
              value={opportunities}
              disabled={!canManage}
              onChange={(e) => setOpportunities(e.target.value)}
              rows={6}
              className="resize-none font-semibold leading-relaxed border-white/[0.06] focus:border-blue-500/40 bg-black/40"
              placeholder="e.g. • Expanding into EU mobile markets&#10;• Automated document scanning AI feature&#10;• Integrations with Stripe Checkout"
            />
          </Card>

          {/* THREATS - Quadrant 4 */}
          <Card className="relative overflow-hidden border border-white/[0.06] bg-secondary/30 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-950/5 transition-all duration-300 p-6 flex flex-col gap-4 group">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-amber-500/[0.02] blur-2xl pointer-events-none group-hover:bg-amber-500/[0.05] transition-colors" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                <HelpCircle className="w-4 h-4 shrink-0" />
              </div>
              <div className="flex flex-col text-left">
                <h3 className="font-bold text-xs uppercase tracking-wider text-white">Threats</h3>
                <span className="text-[9px] font-bold text-amber-500/80 uppercase tracking-widest mt-0.5">External Risks</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed text-left">
              What external factors, competitors, or supply-chain bottlenecks present risks?
            </p>
            <Textarea
              value={threats}
              disabled={!canManage}
              onChange={(e) => setThreats(e.target.value)}
              rows={6}
              className="resize-none font-semibold leading-relaxed border-white/[0.06] focus:border-amber-500/40 bg-black/40"
              placeholder="e.g. • Agile competitors copying features&#10;• Changing GDPR data retention rules&#10;• Unstable cloud hosting services"
            />
          </Card>

        </div>
      )}
    </div>
  );
};
