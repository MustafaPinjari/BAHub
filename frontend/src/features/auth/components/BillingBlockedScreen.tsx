import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { api } from "../../../services/api";
import { Card, Button } from "../../../components/common/UIComponents";
import { Sparkles, Cpu, Users, BarChart2, FileText, ArrowRight, Loader2, LogOut } from "lucide-react";

export const BillingBlockedScreen: React.FC = () => {
  const { user, logout, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError(null);
      const plan = user?.plan_tier || "PRO";
      const response = await api.post<any, { data: { checkout_url: string } }>("/billing/checkout/", { plan });
      if (response?.data?.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        setError("Failed to generate checkout session.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error initiating checkout session.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      if (refreshProfile) {
        await refreshProfile();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Poll for checkout success while component is active
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (user && user.plan_tier !== "FREE" && !user.plan_verified) {
      interval = setInterval(async () => {
        try {
          if (refreshProfile) {
            await refreshProfile();
          }
        } catch (e) {
          console.error("Auto-polling subscription verification failed", e);
        }
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, refreshProfile]);

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-black text-white relative overflow-hidden select-none">
      {/* Background glow effects */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[120px] -top-52 -left-52 pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] -bottom-52 -right-52 pointer-events-none" />
      
      <div className="max-w-md w-full px-6 relative z-10">
        <Card className="border border-white/[0.08] bg-black/60 backdrop-blur-2xl p-8 flex flex-col gap-6 text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/5 animate-pulse">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">Welcome to BAHub {user?.plan_tier || "Pro"}</h1>
            <p className="text-xs text-gray-400 leading-relaxed">
              Your account has been created successfully, but your organization's subscription is currently pending payment.
            </p>
          </div>

          {error && (
            <div className="text-[11px] font-bold text-red-400 bg-red-950/20 border border-red-500/10 rounded-lg py-2.5 px-3">
              {error}
            </div>
          )}

          <div className="space-y-3.5 text-left border-y border-white/[0.06] py-5">
            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2">Complete payment to unlock:</p>
            <div className="flex items-center gap-2.5 text-xs text-gray-300">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>AI Strategic Assistant & Audits</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-gray-300">
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span>Premium BRD & FRD Compilers</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-gray-300">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>Workspace Collaboration Seats</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-gray-300">
              <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Analytics, Reports & Traceability</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              className="w-full text-xs font-bold py-2.5 flex items-center justify-center gap-1.5"
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  Complete Payment <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
            
            <div className="grid grid-cols-2 gap-2 mt-1">
              <Button
                variant="outline"
                className="w-full text-xs font-semibold py-1.5 text-gray-400 hover:text-white"
                onClick={handleRefresh}
                disabled={loading}
              >
                Refresh Status
              </Button>
              <Button
                variant="outline"
                className="w-full text-xs font-semibold py-1.5 text-red-400 hover:text-red-300 border-red-950/20 hover:bg-red-500/5 flex items-center justify-center gap-1"
                onClick={logout}
              >
                <LogOut className="w-3 h-3" />
                Sign Out
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
