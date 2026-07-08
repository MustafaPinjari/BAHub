import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useAuth } from "./AuthContext";
import { Card, Badge, Button, Alert } from "../../components/common/UIComponents";
import {
  Sparkles,
  Check,
  Users,
  Cpu,
  ArrowRight,
  Shield,
  Zap,
  Loader2,
  FileText,
  History,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

interface SubscriptionDetail {
  plan_tier: "FREE" | "PRO" | "ENTERPRISE";
  seats_limit: number;
  is_active: boolean;
  ai_credits_used: number;
  ai_credits_limit: number;
  active_seats_count: number;
  plan_verified: boolean;
}

interface InvoiceDetail {
  id: string;
  receipt_number: string;
  date: string;
  amount: string;
  description: string;
  status: string;
  transaction_id: string;
}

export const BillingPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sub, setSub] = useState<SubscriptionDetail | null>(null);
  const [invoices, setInvoices] = useState<InvoiceDetail[]>([]);
  const [adminStats, setAdminStats] = useState<any | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "warning";
    message: string;
  } | null>(null);

  const isAdmin = user?.role === "ADMIN";
  const isPlatformAdmin = user?.is_superuser || user?.is_staff;

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await api.get<any, { data: SubscriptionDetail }>("/billing/subscription/");
      setSub(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load subscription details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await api.get<any, { data: InvoiceDetail[] }>("/billing/invoices/");
      setInvoices(response.data || []);
    } catch (err) {
      console.error("Failed to load invoice history", err);
    }
  };

  const fetchAdminStats = async () => {
    if (isPlatformAdmin || (isAdmin && sub?.plan_tier !== "FREE")) {
      try {
        setAdminLoading(true);
        const res = await api.get<any, { data: any }>("/billing/admin-dashboard/");
        setAdminStats(res.data);
      } catch (err) {
        console.error("Failed to load billing metrics", err);
      } finally {
        setAdminLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchSubscription();
    fetchInvoices();

    const params = new URLSearchParams(location.search);
    if (params.get("success") === "true") {
      setNotification({
        type: "success",
        message: "Congratulations! Your workspace has been upgraded successfully."
      });
      if (refreshProfile) {
        refreshProfile();
      }
      navigate(location.pathname, { replace: true });
    } else if (params.get("cancelled") === "true") {
      setNotification({
        type: "warning",
        message: "Subscription checkout flow was cancelled."
      });
      navigate(location.pathname, { replace: true });
    } else if (params.get("verified") === "true") {
      setNotification({
        type: "success",
        message: "Your subscription upgrade has been verified successfully! AI features are now unlocked."
      });
      if (refreshProfile) {
        refreshProfile();
      }
      fetchSubscription();
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (sub) {
      fetchAdminStats();
    }
  }, [sub]);

  const handleUpgrade = async (plan: "PRO" | "ENTERPRISE") => {
    if (!isAdmin) {
      setError("Only workspace administrators can manage billing subscription plans.");
      return;
    }
    try {
      setActionLoading(plan);
      setError(null);
      const response = await api.post<any, { data: { checkout_url: string; mode: string } }>("/billing/checkout/", { plan });
      if (response.data?.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        setError("Failed to initialize checkout redirection.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || `Failed to initiate checkout for the ${plan} tier.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadInvoice = async (paymentId: string, receiptNumber: string) => {
    try {
      const response = await api.get(`/billing/invoices/${paymentId}/download/`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${receiptNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download invoice pdf", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
          Retrieving subscription records...
        </p>
      </div>
    );
  }

  const seatPercentage = sub ? Math.min(100, (sub.active_seats_count / sub.seats_limit) * 100) : 0;
  const creditPercentage = sub ? Math.min(100, (sub.ai_credits_used / sub.ai_credits_limit) * 100) : 0;

  return (
    <div className="container mx-auto p-6 max-w-6xl flex flex-col gap-6 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Billing & Subscriptions
          </h1>
          <p className="text-xs text-muted-foreground font-medium mt-1">
            Manage your workspace limits, seat allocation, monthly AI credit usage, and SaaS monetization status.
          </p>
        </div>
        {sub && (
          <Badge
            variant={sub.plan_tier === "FREE" ? "secondary" : sub.plan_tier === "PRO" ? "default" : "success"}
            className="text-[11px] px-3 py-1 uppercase tracking-wider font-bold"
          >
            {sub.plan_tier} Tier {sub.plan_verified ? "Active" : "Unverified"}
          </Badge>
        )}
      </div>

      {/* Notifications and Errors */}
      {notification && (
        <Alert
          variant={notification.type === "success" ? "success" : "warning"}
          title={notification.type === "success" ? "Upgrade Successful!" : "Checkout Cancelled"}
        >
          {notification.message}
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" title="Billing Operation Error">
          {error}
        </Alert>
      )}

      {sub && sub.plan_tier !== "FREE" && !sub.plan_verified && (
        <Alert
          variant="warning"
          title="Verification Pending"
        >
          Your workspace has been upgraded to the <strong>{sub.plan_tier}</strong> plan, but it is currently pending email verification or checkout payment confirmation. premium seats will remain locked until verified.
        </Alert>
      )}

      {/* platform-level metrics dashboard */}
      {isPlatformAdmin && adminStats && adminStats.scope === "platform" && (
        <div className="flex flex-col gap-4 border border-white/[0.08] bg-black/40 rounded-2xl p-5">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400" /> Platform Billing Administration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 flex flex-col justify-between">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Revenue</span>
              <span className="text-lg font-black text-white mt-1">{adminStats.total_revenue}</span>
            </Card>
            <Card className="p-4 flex flex-col justify-between">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Payments</span>
              <span className="text-lg font-black text-white mt-1">{adminStats.total_payments}</span>
            </Card>
            <Card className="p-4 flex flex-col justify-between">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Failed Payments</span>
              <span className="text-lg font-black text-red-400 mt-1">{adminStats.failed_payments}</span>
            </Card>
            <Card className="p-4 flex flex-col justify-between">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Pending Upgrades</span>
              <span className="text-lg font-black text-yellow-500 mt-1">{adminStats.pending_payments}</span>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <Card className="p-4 flex flex-col gap-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-white/[0.06] pb-1.5 mb-1">
                Recent Stripe Webhooks
              </h4>
              <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto font-mono text-[9px] text-gray-400">
                {adminStats.webhook_logs.length === 0 ? (
                  <span>No recent webhook logs.</span>
                ) : (
                  adminStats.webhook_logs.map((w: any) => (
                    <div key={w.event_id} className="flex justify-between border-b border-white/[0.02] pb-0.5">
                      <span className="text-white truncate max-w-[200px]">{w.event_id}</span>
                      <span className="text-gray-600">{w.processed_at}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-4 flex flex-col gap-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-white/[0.06] pb-1.5 mb-1">
                Payment Audit Logs
              </h4>
              <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto font-mono text-[9px] text-gray-400">
                {adminStats.audit_logs.length === 0 ? (
                  <span>No recent audit logs.</span>
                ) : (
                  adminStats.audit_logs.map((a: any, idx: number) => (
                    <div key={idx} className="flex justify-between border-b border-white/[0.02] pb-0.5">
                      <span className="text-white truncate max-w-[200px]">{a.org_name} - {a.event}</span>
                      <span className="text-gray-600">{a.date}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Usage Analytics Grid */}
      {sub && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Seat Allocation Card */}
          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> Workspace Seat Allocation
                </h3>
                <Badge variant={sub.active_seats_count >= sub.seats_limit ? "warning" : "default"}>
                  {sub.active_seats_count} / {sub.seats_limit} Seats
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-semibold mb-4">
                Total seats allocated by administrators and team members in your workspace directory. Clean up unused accounts or upgrade your plan to increase limits.
              </p>
            </div>
            <div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    seatPercentage >= 90 ? "bg-destructive" : seatPercentage >= 75 ? "bg-amber-500" : "bg-primary"
                  }`}
                  style={{ width: `${seatPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                <span>0%</span>
                <span>{Math.round(seatPercentage)}% Capacity</span>
                <span>100%</span>
              </div>
            </div>
          </Card>

          {/* AI Credit Usage Card */}
          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary" /> AI Credit Balance
                </h3>
                <Badge variant={sub.ai_credits_used >= sub.ai_credits_limit ? "destructive" : "default"}>
                  {sub.ai_credits_used} / {sub.ai_credits_limit} Credits
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-semibold mb-4">
                AI credits reset on the first day of each calendar month. Each specification compile job or conversational AI chat session consumes 1 credit.
              </p>
            </div>
            <div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    creditPercentage >= 90 ? "bg-destructive" : creditPercentage >= 75 ? "bg-amber-500" : "bg-primary"
                  }`}
                  style={{ width: `${creditPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                <span>0%</span>
                <span>{Math.round(creditPercentage)}% Consumed</span>
                <span>100%</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Pricing and Tier Upgrades */}
      <div className="mt-4">
        <div className="text-center md:text-left mb-6">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Upgrade Your BAHub Workspace
          </h2>
          <p className="text-xs text-muted-foreground font-semibold mt-1">
            Choose a plan tailored to scale your B2B specification work, business requirements generation, and strategic roadmap modeling.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plan 1: Free */}
          <Card className={`relative flex flex-col justify-between ${sub?.plan_tier === "FREE" ? "border-primary ring-2 ring-primary/10" : ""}`}>
            {sub?.plan_tier === "FREE" && (
              <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                Current Plan
              </span>
            )}
            <div>
              <div className="mb-4">
                <h4 className="font-bold text-base text-foreground">Free Starter</h4>
                <div className="mt-2 flex items-baseline">
                  <span className="text-2xl font-black text-foreground">$0</span>
                  <span className="text-xs font-semibold text-muted-foreground ml-1">/ month</span>
                </div>
                <p className="text-[11px] text-muted-foreground font-semibold mt-2">
                  Perfect for individual analysts exploring requirements generation and SWOT analyses.
                </p>
              </div>

              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex items-start gap-2 text-xs font-semibold text-foreground/80">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Up to 5 Workspace Seats</span>
                </div>
                <div className="flex items-start gap-2 text-xs font-semibold text-foreground/80">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>100 AI Credits per Month</span>
                </div>
                <div className="flex items-start gap-2 text-xs font-semibold text-foreground/80">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Basic SWOT & Gap Analysis</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/50">
              <Button
                variant="outline"
                className="w-full text-xs font-bold py-2"
                disabled={true}
              >
                {sub?.plan_tier === "FREE" ? "Active" : "Included"}
              </Button>
            </div>
          </Card>

          {/* Plan 2: Pro */}
          <Card className={`relative flex flex-col justify-between ${sub?.plan_tier === "PRO" ? "border-primary ring-2 ring-primary/10" : ""}`}>
            {sub?.plan_tier === "PRO" && (
              <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                Current Plan
              </span>
            )}
            <div className="absolute -top-3 left-6">
              <Badge variant="default" className="text-[9px] px-2 py-0.5 font-extrabold uppercase bg-primary text-primary-foreground border-transparent shadow">
                Popular
              </Badge>
            </div>
            <div>
              <div className="mb-4">
                <h4 className="font-bold text-base text-foreground flex items-center gap-1.5">
                  Pro Growth <Zap className="w-3.5 h-3.5 text-primary fill-primary" />
                </h4>
                <div className="mt-2 flex items-baseline">
                  <span className="text-2xl font-black text-foreground">$49</span>
                  <span className="text-xs font-semibold text-muted-foreground ml-1">/ month</span>
                </div>
                <p className="text-[11px] text-muted-foreground font-semibold mt-2">
                  Accelerated design suite for teams that compile documents and run heavy AI chat audits.
                </p>
              </div>

              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex items-start gap-2 text-xs font-semibold text-foreground/80">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Up to 20 Workspace Seats</span>
                </div>
                <div className="flex items-start gap-2 text-xs font-semibold text-foreground/80">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>1,000 AI Credits per Month</span>
                </div>
                <div className="flex items-start gap-2 text-xs font-semibold text-foreground/80">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Advanced SWOT/Gap strategic models</span>
                </div>
                <div className="flex items-start gap-2 text-xs font-semibold text-foreground/80">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Priority Document Compile Jobs</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/50">
              <Button
                variant={(sub?.plan_tier === "PRO" && !sub.plan_verified) ? "primary" : (sub?.plan_tier === "PRO" ? "secondary" : "primary")}
                className="w-full text-xs font-bold py-2 flex items-center justify-center gap-1"
                onClick={() => handleUpgrade("PRO")}
                isLoading={actionLoading === "PRO"}
                disabled={(sub?.plan_tier === "PRO" && sub.plan_verified) || sub?.plan_tier === "ENTERPRISE" || !isAdmin}
              >
                {sub?.plan_tier === "PRO" ? (
                  sub.plan_verified ? "Active Plan" : "Complete Payment"
                ) : sub?.plan_tier === "ENTERPRISE" ? (
                  "Upgraded"
                ) : !isAdmin ? (
                  "Admin Access Required"
                ) : (
                  <>
                    Upgrade Workspace <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Plan 3: Enterprise */}
          <Card className={`relative flex flex-col justify-between ${sub?.plan_tier === "ENTERPRISE" ? "border-primary ring-2 ring-primary/10" : ""}`}>
            {sub?.plan_tier === "ENTERPRISE" && (
              <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                Current Plan
              </span>
            )}
            <div>
              <div className="mb-4">
                <h4 className="font-bold text-base text-foreground flex items-center gap-1.5">
                  Enterprise Core <Shield className="w-3.5 h-3.5 text-primary" />
                </h4>
                <div className="mt-2 flex items-baseline">
                  <span className="text-2xl font-black text-foreground">$299</span>
                  <span className="text-xs font-semibold text-muted-foreground ml-1">/ month</span>
                </div>
                <p className="text-[11px] text-muted-foreground font-semibold mt-2">
                  Designed for global consulting agencies needing deep limits and customizable systems.
                </p>
              </div>

              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex items-start gap-2 text-xs font-semibold text-foreground/80">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Up to 1,000 Workspace Seats</span>
                </div>
                <div className="flex items-start gap-2 text-xs font-semibold text-foreground/80">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>10,000 AI Credits per Month</span>
                </div>
                <div className="flex items-start gap-2 text-xs font-semibold text-foreground/80">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Configurable AI prompt templates</span>
                </div>
                <div className="flex items-start gap-2 text-xs font-semibold text-foreground/80">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>SSO integration roadmap, custom integrations & audit trails</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/50">
              <Button
                variant={(sub?.plan_tier === "ENTERPRISE" && !sub.plan_verified) ? "primary" : (sub?.plan_tier === "ENTERPRISE" ? "secondary" : "primary")}
                className="w-full text-xs font-bold py-2 flex items-center justify-center gap-1"
                onClick={() => handleUpgrade("ENTERPRISE")}
                isLoading={actionLoading === "ENTERPRISE"}
                disabled={(sub?.plan_tier === "ENTERPRISE" && sub.plan_verified) || !isAdmin}
              >
                {sub?.plan_tier === "ENTERPRISE" ? (
                  sub.plan_verified ? "Active Plan" : "Complete Payment"
                ) : !isAdmin ? (
                  "Admin Access Required"
                ) : (
                  <>
                    Upgrade Workspace <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Invoice & Receipt History Section */}
      <div className="mt-4">
        <Card className="p-5 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/[0.06] pb-2 flex items-center gap-2">
            <History className="w-4 h-4 text-purple-400" /> Subscription Payment History
          </h3>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-600 font-medium">
              No payments recorded. Free subscription tier billing history is empty.
            </div>
          ) : (
            <div className="w-full overflow-x-auto rounded-xl border border-white/[0.06] bg-gray-950/40">
              <table className="w-full text-left border-collapse table-fixed text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[9px] font-bold uppercase tracking-wider text-gray-500">
                    <th className="p-3">Invoice / Receipt</th>
                    <th className="p-3">Billing Date</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Paid Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 w-28 text-center font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-gray-300 font-semibold">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3 font-mono font-bold text-white">{inv.receipt_number}</td>
                      <td className="p-3 text-gray-400 font-medium">{inv.date}</td>
                      <td className="p-3 text-gray-300 truncate">{inv.description}</td>
                      <td className="p-3 text-white font-bold">{inv.amount}</td>
                      <td className="p-3">
                        <Badge variant={inv.status === "SUCCESS" ? "success" : "warning"}>
                          {inv.status === "SUCCESS" ? "Paid" : inv.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDownloadInvoice(inv.id, inv.receipt_number)}
                          className="px-2.5 py-1 text-[10px] bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-bold rounded border border-purple-500/20 transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
