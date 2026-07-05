import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Workflow,
  FileText,
  CheckCircle,
  Lock,
  ArrowRight,
  GitBranch,
  FileCheck,
  AlertTriangle,
  Heart,
  Link2,
  Terminal,
  Settings,
  Layers,
  Zap,
  RefreshCw,
  Check,
  Star,
  Shield,
  Clock,
  Globe,
  Plus
} from "lucide-react";
import logo from "../../assets/logo.png";

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

// Preset datasets for the live AI synthesis playground simulator
const PRESETS = {
  checkout: {
    prompt: "Generate an E-Commerce checkout flow with compliance validation",
    nodes: [
      { id: "c1", label: "Cart Checkout", type: "process", desc: "User triggers checkout workflow.", x: 20, y: 35 },
      { id: "c2", label: "Risk Scan", type: "ai", desc: "AI fraud scoring checks IP, email, & history.", x: 190, y: 35, warning: "Missing retry handler" },
      { id: "c3", label: "Payment Route", type: "gateway", desc: "Selects stripe vs. local fallback bank.", x: 360, y: 35 },
      { id: "c4", label: "Fulfill Order", type: "document", desc: "Triggers order confirmation emails & logs.", x: 530, y: 35 }
    ],
    brd: `# Business Requirements Document (BRD-2026-92)
## E-Commerce Checkout & Payment Routing Engine

### 1. Executive Summary
This document specifies the integration of risk scanning and intelligent payment routing systems to minimize credit card transaction chargebacks while optimizing authorization rates.

### 2. Functional Requirements
- **FR-1**: System must evaluate transactions using dynamic risk scores (0-100) before presenting final settlement.
- **FR-2**: Integration with secondary backup gateways must handle automatic failovers in less than 500ms.
- **FR-3**: Order confirmation records must be posted to internal audit logs.`,
    stories: [
      { id: "US-101", title: "Automated pre-fraud transaction analysis", pts: 5, role: "Risk Officer" },
      { id: "US-102", title: "Graceful payment routing failover checks", pts: 8, role: "Customer" },
      { id: "US-103", title: "Automated invoice receipt generation", pts: 3, role: "System Manager" }
    ]
  },
  sso: {
    prompt: "SAML 2.0 Single Sign-On flow with JIT user provisioning",
    nodes: [
      { id: "s1", label: "Login Request", type: "process", desc: "User visits corporate sub-domain portal.", x: 20, y: 35 },
      { id: "s2", label: "SAML assertion", type: "gateway", desc: "Validates digital signatures (SHA-256).", x: 190, y: 35 },
      { id: "s3", label: "JIT Provisioning", type: "ai", desc: "AI checks attributes & maps to workspace.", x: 360, y: 35, warning: "Unencrypted token store" },
      { id: "s4", label: "Session Grant", type: "document", desc: "Generates authorization tokens and scopes.", x: 530, y: 35 }
    ],
    brd: `# Business Requirements Document (BRD-2026-08)
## SAML 2.0 Identity Federation & JIT Account Provisioning

### 1. Project Background
To reduce enterprise employee access overhead, this project enables direct connection between organizational active directories and BAHub workspace domains using SAML tokens.

### 2. Security Mandates
- **SEC-1**: Assertions must be signed using X.509 certificates with minimum SHA-256 algorithms.
- **SEC-2**: The Identity Provider (IdP) assertion consumer URL must reject requests older than 120 seconds.
- **SEC-3**: Workspace role profiles must be parsed and synced to permissions DB during JIT execution.`,
    stories: [
      { id: "US-201", title: "Directory verification assertion mappings", pts: 5, role: "IT Engineer" },
      { id: "US-202", title: "Seamless sign-in with active sessions", pts: 2, role: "Employee" },
      { id: "US-203", title: "JIT automatic workspace creation logs", pts: 8, role: "Administrator" }
    ]
  },
  compliance: {
    prompt: "Vendor compliance audit workflow and risk analysis",
    nodes: [
      { id: "v1", label: "Upload KYC", type: "process", desc: "Vendor submits incorporation and tax papers.", x: 20, y: 35 },
      { id: "v2", label: "AI OCR Scan", type: "ai", desc: "AI extracts registry details and flags gaps.", x: 190, y: 35 },
      { id: "v3", label: "Registry Check", type: "gateway", desc: "Compares flags to international compliance guidelines.", x: 360, y: 35, warning: "No fallback human gate" },
      { id: "v4", label: "Onboard Partner", type: "document", desc: "Vendor status set to active, billing webhook fired.", x: 530, y: 35 }
    ],
    brd: `# Business Requirements Document (BRD-2026-44)
## Automated Third-Party Vendor Compliance & OCR Verification

### 1. Overview
Automates the capture, reading, and legal compliance verification of newly registered business suppliers using OCR document parsing engines.

### 2. Regulatory Compliance
- **COMP-1**: Verify tax identifications (EIN/W8) against active federal registers.
- **COMP-2**: All uploads must undergo automated malware and metadata scrubbing protocols.
- **COMP-3**: Any non-matching database entries must immediately flag as suspended and alert internal legal teams.`,
    stories: [
      { id: "US-301", title: "Automated tax identification OCR reading", pts: 8, role: "Supplier Partner" },
      { id: "US-302", title: "Security scan checking of files", pts: 5, role: "Compliance Officer" },
      { id: "US-303", title: "Workspace activation status triggers", pts: 3, role: "Billing System" }
    ]
  }
};

// Testimonials data for the 3D marquee
const TESTIMONIALS = [
  { name: "Priya Sharma", role: "Lead BA, FinTech Corp", text: "BAHub transformed our requirements process. The AI canvas generates BRDs in minutes instead of weeks. Game-changing.", stars: 5 },
  { name: "Alex Chen", role: "Product Manager, SaaS Co", text: "The bidirectional trace linkage is phenomenal. Change a requirement, watch it update everywhere instantly.", stars: 5 },
  { name: "Mohammed Al-Rashid", role: "Systems Architect", text: "Finally a tool that understands the BA workflow. IEEE compliance checks save us hours of manual review.", stars: 5 },
  { name: "Sarah Williams", role: "Agile Coach, Consulting", text: "Our clients are impressed with the professional BRDs. The Dracula-themed export is a nice touch for devs.", stars: 5 },
  { name: "Raj Patel", role: "CTO, Product Studio", text: "Replaced Lucidchart + Confluence + Jira with one platform. The integration webhooks are seamless.", stars: 5 },
  { name: "Elena Kowalski", role: "Senior BA, Insurance", text: "The SWOT and Gap Analysis modules alone justify the subscription. Absolutely essential tooling.", stars: 5 },
  { name: "David Kim", role: "Tech Lead, E-Commerce", text: "Process canvas to BPMN XML export works flawlessly. Our execution engine ingests it directly.", stars: 5 },
  { name: "Fatima Al-Zahra", role: "Project Director", text: "Stakeholder management has never been cleaner. The risk radar keeps executives happy at board level.", stars: 5 },
  { name: "Tom Nguyen", role: "DevOps Lead, Scale-up", text: "The audit log feature is a compliance dream. Full traceability from conversation to deployment.", stars: 5 },
  { name: "Ishaan Gupta", role: "Solution Architect", text: "PlantUML and Mermaid.js exports pair perfectly with our docs-as-code pipeline. Love it.", stars: 5 },
];

const FAQS = [
  {
    q: "What makes BAHub different from Lucidchart, Visio, or Miro?",
    a: "Traditional tools treat flowchart diagrams as simple visual drawings. In BAHub, every node represents a real database entity with properties, priority, description, and link constraints. If you edit a requirement text inside the document view, it automatically updates in the process flow nodes, preventing specifications and charts from drifting out of sync."
  },
  {
    q: "How does the AI process diagram synthesis work?",
    a: "You simply paste unstructured transcripts from meetings, user feedback files, or raw briefs. Our LLM-powered parser evaluates the logical tasks, actors, and events, assigns layout coordinates, and renders editable process canvases (BPMN, UML, Sequence, Use Case) instantly."
  },
  {
    q: "Can I export BAHub models to draw.io or other modeling apps?",
    a: "Yes. BAHub supports multiple exporters. You can download your diagram structures as draw.io XML, BPMN 2.0 XML (fully compatible with execution engines like Camunda), PlantUML syntax, or Mermaid.js markdown blocks."
  },
  {
    q: "Do you support SAML Single Sign-On (SSO)?",
    a: "Yes, our Enterprise and Custom packages support full SAML 2.0 Identity Provider assertions, mapping directory permissions dynamically onto local workspace profiles during JIT logins."
  },
  {
    q: "Is there an on-premise deployment option?",
    a: "Enterprise tier includes Docker Compose and Kubernetes Helm chart packaging for self-hosted deployments with full data sovereignty, BYOK encryption, and VPN-gated access controls."
  }
];

// ─── Testimonial Card ────────────────────────────────────────────────────────
const TestimonialCard: React.FC<{ t: typeof TESTIMONIALS[0] }> = ({ t }) => (
  <div className="w-72 rounded-2xl border border-white/[0.08] bg-gray-950/60 p-5 flex flex-col gap-3 shrink-0 my-2">
    <div className="flex gap-0.5">
      {Array.from({ length: t.stars }).map((_, i) => (
        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
      ))}
    </div>
    <p className="text-[11px] text-gray-400 leading-relaxed font-medium flex-1">"{t.text}"</p>
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[10px] font-bold text-purple-400 shrink-0">
        {t.name[0]}
      </div>
      <div>
        <p className="text-[11px] font-bold text-white leading-tight">{t.name}</p>
        <p className="text-[9px] text-gray-600">{t.role}</p>
      </div>
    </div>
  </div>
);

// ─── Marquee Column ───────────────────────────────────────────────────────────
const MarqueeColumn: React.FC<{ items: typeof TESTIMONIALS; reverse?: boolean; duration?: string }> = ({
  items, reverse = false, duration = "20s"
}) => (
  <div className="flex flex-col overflow-hidden h-[600px] relative">
    <div
      className={reverse ? "animate-marquee-up" : "animate-marquee-down"}
      style={{ "--duration": duration } as React.CSSProperties}
    >
      {[...items, ...items].map((t, i) => (
        <TestimonialCard key={i} t={t} />
      ))}
    </div>
  </div>
);

// ─── Main LandingPage ─────────────────────────────────────────────────────────
export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToLogin,
  onNavigateToRegister
}) => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [teamSize, setTeamSize] = useState<number>(5);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activePresetKey, setActivePresetKey] = useState<"checkout" | "sso" | "compliance">("checkout");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<number>(4);
  const [selectedNode, setSelectedNode] = useState<string>("c1");
  const [nodesList, setNodesList] = useState<any[]>(PRESETS.checkout.nodes);
  const [workspaceTab, setWorkspaceTab] = useState<"canvas" | "brd" | "backlog">("canvas");

  useEffect(() => {
    setNodesList(PRESETS[activePresetKey].nodes);
    setSelectedNode(PRESETS[activePresetKey].nodes[0].id);
  }, [activePresetKey]);

  const handleTriggerGenerator = (key: "checkout" | "sso" | "compliance") => {
    setActivePresetKey(key);
    setIsGenerating(true);
    setGenerationStep(0);
    setWorkspaceTab("canvas");
    const interval = setInterval(() => {
      setGenerationStep(prev => {
        if (prev >= 3) { clearInterval(interval); setIsGenerating(false); return 4; }
        return prev + 1;
      });
    }, 850);
  };

  const handleAutoFix = (nodeId: string) => {
    setNodesList(prev => prev.map(n => {
      if (n.id === nodeId) {
        const { warning, ...rest } = n;
        return { ...rest, label: n.label + " [Fixed]", desc: n.desc + " (Compliance issue resolved by AI)." };
      }
      return n;
    }));
  };

  const activePreset = PRESETS[activePresetKey];
  const activeNode = nodesList.find(n => n.id === selectedNode) || nodesList[0];

  const calculatePrice = () => {
    const basePrice = billingCycle === "monthly" ? 2500 : 2000;
    return basePrice * teamSize;
  };

  // Split testimonials into 3 columns
  const col1 = TESTIMONIALS.slice(0, 4);
  const col2 = TESTIMONIALS.slice(3, 7);
  const col3 = TESTIMONIALS.slice(6, 10);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/25 selection:text-white overflow-x-hidden antialiased">

      {/* ── Atmospheric BG ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-200px] left-[30%] w-[600px] h-[600px] rounded-full bg-purple-600/[0.07] blur-[120px]" />
        <div className="absolute top-[600px] right-[-100px] w-[500px] h-[500px] rounded-full bg-blue-600/[0.05] blur-[150px]" />
        <div className="absolute bottom-[200px] left-[-100px] w-[600px] h-[600px] rounded-full bg-violet-500/[0.04] blur-[180px]" />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          NAVBAR — DNA Floating Pill
          ══════════════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-50 px-4 pt-4">
        <nav className="max-w-6xl mx-auto bg-black/40 backdrop-blur-2xl border border-white/[0.08] rounded-2xl px-5 py-3 flex items-center justify-between shadow-2xl shadow-black/50">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-white/[0.06] rounded-lg flex items-center justify-center border border-white/[0.10]">
              <img src={logo} alt="BAHub Logo" className="w-4 h-4 object-contain" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-[11px] tracking-widest uppercase text-white/90">BAHub</span>
              <span className="text-[7px] font-bold text-purple-400 uppercase tracking-widest">Workspace Platform</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-[11px] font-semibold tracking-wide text-gray-500">
            <a href="#features" className="hover:text-white transition-colors duration-150">Features</a>
            <a href="#sandbox" className="hover:text-white transition-colors duration-150">Sandbox</a>
            <a href="#testimonials" className="hover:text-white transition-colors duration-150">Reviews</a>
            <a href="#pricing" className="hover:text-white transition-colors duration-150">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors duration-150">FAQ</a>
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToLogin}
              className="px-3.5 py-1.5 rounded-lg text-[11px] font-semibold text-gray-500 hover:text-white transition-colors duration-150 cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={onNavigateToRegister}
              className="px-4 py-1.5 rounded-lg text-[11px] font-bold bg-white text-black hover:bg-gray-100 transition-all duration-150 shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </nav>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          HERO SECTION
          ══════════════════════════════════════════════════════════════════ */}
      <section className="relative pt-20 pb-16 px-6 md:px-12 max-w-6xl mx-auto z-10">

        {/* Badge pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/[0.08] bg-gray-950/60 text-[10px] font-bold uppercase tracking-wider mb-8 animate-fade-in-up">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-gray-400">BAHub V2.0</span>
          <span className="text-gray-700">·</span>
          <span className="text-purple-400">Dual Canvas & AI Compliance Engine</span>
        </div>

        {/* Left-aligned hero headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[0.95] mb-6 max-w-5xl animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          The Traceable Specifications &{" "}
          <span className="text-gradient-blue-purple">
            Process Engineering Platform
          </span>
        </h1>

        <p className="text-gray-500 text-sm md:text-base font-normal max-w-2xl leading-relaxed mb-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          Synthesize complex client conversations into compliant flowcharts, compile fully audited Business Requirements Documents, and sync traceable backlogs directly to engineering workflows.
        </p>

        {/* CTA Row */}
        <div className="flex flex-wrap items-center gap-3 mb-10 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <button
            onClick={onNavigateToRegister}
            className="px-6 py-3 rounded-xl text-sm font-bold bg-white text-black hover:bg-gray-100 transition-all duration-200 shadow-glow-white cursor-pointer flex items-center gap-2"
          >
            Start Free Trial
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onNavigateToLogin}
            className="px-6 py-3 rounded-xl text-sm font-semibold bg-transparent border border-white/[0.12] text-gray-400 hover:text-white hover:border-white/[0.25] transition-all duration-200 cursor-pointer"
          >
            View Live Demo
          </button>
        </div>

        {/* Proof-point row */}
        <div className="flex flex-wrap gap-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <Shield className="w-3 h-3 text-green-500" />
            </div>
            <span className="text-[11px] font-medium text-gray-500">SOC 2 Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Zap className="w-3 h-3 text-blue-400" />
            </div>
            <span className="text-[11px] font-medium text-gray-500">Real-time Sync</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Globe className="w-3 h-3 text-purple-400" />
            </div>
            <span className="text-[11px] font-medium text-gray-500">GDPR Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Clock className="w-3 h-3 text-amber-400" />
            </div>
            <span className="text-[11px] font-medium text-gray-500">99.9% Uptime</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          AI PLAYGROUND PROMPT SELECTOR
          ══════════════════════════════════════════════════════════════════ */}
      <section className="relative px-6 md:px-12 max-w-6xl mx-auto pb-4 z-10">
        <div className="w-full rounded-2xl border border-white/[0.07] bg-gray-950/40 p-4 backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md" style={{ background: '#282a36', border: '1px solid #44475a' }}>
                <Terminal className="w-3 h-3 m-0.5" style={{ color: '#8be9fd' }} />
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">AI Generation Playground</span>
            </div>
            <span className="text-[9px] font-medium text-gray-700">Select a prompt template:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {(["checkout", "sso", "compliance"] as const).map((key) => (
              <button
                key={key}
                disabled={isGenerating}
                onClick={() => handleTriggerGenerator(key)}
                className={`p-3 rounded-xl text-left border transition-all duration-200 cursor-pointer flex flex-col gap-1 ${
                  activePresetKey === key
                    ? "bg-purple-600/10 border-purple-500/30"
                    : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                }`}
              >
                <span className="text-[10px] font-bold text-white">
                  {key === "checkout" ? "E-Commerce Checkouts" : key === "sso" ? "SAML 2.0 SSO Portal" : "Supplier Audit Compliance"}
                </span>
                <span className="text-[8px] font-medium text-gray-600 line-clamp-1">
                  {key === "checkout" ? "With multi-gateway failure fallbacks" : key === "sso" ? "With dynamic JIT mappings" : "Automated tax & registry check flow"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          INTERACTIVE SANDBOX
          ══════════════════════════════════════════════════════════════════ */}
      <section id="sandbox" className="py-8 px-6 md:px-12 max-w-6xl mx-auto z-10 relative">
        {/* Dracula-chrome sandbox container */}
        <div className="w-full rounded-2xl overflow-hidden shadow-2xl border" style={{ background: '#0d0f17', borderColor: 'rgba(255,255,255,0.07)' }}>
          {/* Browser chrome header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(10,10,10,0.8)' }}>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff5555' }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f1fa8c' }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#50fa7b' }} />
              <span className="text-[9px] font-mono ml-3" style={{ color: '#6272a4' }}>Workspace Preview (Interactive Sandbox)</span>
            </div>
            {isGenerating && (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md border text-[9px] font-bold animate-pulse" style={{ background: 'rgba(80,250,123,0.05)', borderColor: 'rgba(80,250,123,0.2)', color: '#50fa7b' }}>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>AI Synthesis Running... Step {generationStep + 1}/4</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">Active Server</span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-0 h-auto min-h-[480px]">
            {/* Mock sidebar */}
            <div className="w-full lg:w-44 border-r flex flex-col gap-0 shrink-0" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 px-3 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <Layers className="w-3.5 h-3.5" style={{ color: '#8be9fd' }} />
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Workspace</span>
              </div>
              {(["canvas", "brd", "backlog"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setWorkspaceTab(tab)}
                  className={`w-full px-3 py-2.5 text-left text-[9px] font-bold flex items-center gap-2 transition-all cursor-pointer border-l-2 ${
                    workspaceTab === tab
                      ? "border-l-purple-500 bg-purple-500/5 text-white"
                      : "border-l-transparent text-gray-600 hover:text-gray-400"
                  }`}
                >
                  {tab === "canvas" && <Workflow className="w-3 h-3" />}
                  {tab === "brd" && <FileText className="w-3 h-3" />}
                  {tab === "backlog" && <GitBranch className="w-3 h-3" />}
                  {tab === "canvas" ? "Process Canvas" : tab === "brd" ? "BRD Specs" : "Req. Backlog"}
                </button>
              ))}
              <div className="mt-auto border-t px-3 py-3 flex flex-col gap-2 text-[9px] font-semibold text-gray-600" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <span className="uppercase text-[8px] font-extrabold text-gray-600 tracking-wider">Traceability</span>
                <div className="flex justify-between"><span>Linked Nodes</span><span className="text-white font-bold">100%</span></div>
                <div className="flex justify-between"><span>IEEE Checks</span><span className="text-green-500 font-bold">Passed</span></div>
              </div>
            </div>

            {/* Center canvas */}
            <div className="flex-1 relative overflow-hidden flex flex-col" style={{ background: '#050709' }}>
              {isGenerating && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6" style={{ background: 'rgba(5,7,9,0.9)', backdropFilter: 'blur(8px)' }}>
                  <div className="w-64 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-500">
                      <span>Deconstructing Prompt Specification</span>
                      <span className="animate-pulse" style={{ color: '#bd93f9' }}>Running</span>
                    </div>
                    <div className="flex flex-col gap-2 text-[9px] font-semibold">
                      {["Parsed lexical structures & actors", "Auto-arranged 4 sequence modeling coordinates", "Generated dynamic markdown documentation", "Created 3 trace-linked user story backlog items"].map((step, i) => (
                        <div key={i} className={`flex items-center gap-2 ${generationStep >= i ? "text-green-400" : "text-gray-600"}`}>
                          {generationStep >= i ? <Check className="w-3 h-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-700 animate-ping" />}
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                    <div className="w-full bg-gray-900 h-0.5 rounded-full overflow-hidden mt-2">
                      <div className="h-full transition-all duration-700 rounded-full" style={{ width: `${(generationStep / 3) * 100}%`, background: '#bd93f9' }} />
                    </div>
                  </div>
                </div>
              )}

              {workspaceTab === "canvas" && (
                <div className="flex-1 flex flex-col h-full">
                  <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                  <div className="h-8 border-b flex items-center justify-between px-3 z-10 select-none shrink-0" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)' }}>
                    <span className="text-[9px] font-bold text-gray-600">Interactive Canvas Board</span>
                    <span className="text-[8px] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(189,147,249,0.1)', color: '#bd93f9', border: '1px solid rgba(189,147,249,0.2)' }}>BPMN Flowchart</span>
                  </div>
                  <div className="flex-1 relative flex items-center justify-center p-6">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                      <defs>
                        <marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="#44475a" />
                        </marker>
                        <marker id="arr-sel" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="#bd93f9" />
                        </marker>
                      </defs>
                      <path d="M 120 75 L 180 75" fill="none" stroke={["c1","c2","s1","s2","v1","v2"].includes(selectedNode) ? "#bd93f9" : "#44475a"} strokeWidth="1.5" strokeDasharray="3,3" markerEnd="url(#arr)" />
                      <path d="M 290 75 L 350 75" fill="none" stroke={["c2","c3","s2","s3","v2","v3"].includes(selectedNode) ? "#bd93f9" : "#44475a"} strokeWidth="1.5" strokeDasharray="3,3" markerEnd="url(#arr)" />
                      <path d="M 460 75 L 520 75" fill="none" stroke={["c3","c4","s3","s4","v3","v4"].includes(selectedNode) ? "#bd93f9" : "#44475a"} strokeWidth="1.5" strokeDasharray="3,3" markerEnd="url(#arr)" />
                    </svg>
                    <div className="relative w-full flex items-center justify-between z-10 px-4">
                      {nodesList.map((node) => (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNode(node.id)}
                          className="w-36 p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer relative"
                          style={{
                            background: selectedNode === node.id ? 'rgba(189,147,249,0.08)' : 'rgba(255,255,255,0.02)',
                            borderColor: selectedNode === node.id ? '#bd93f9' : '#44475a',
                            transform: selectedNode === node.id ? 'translateY(-2px)' : undefined,
                          }}
                        >
                          {node.warning && (
                            <div className="absolute -top-2 -right-1 flex items-center gap-1 px-1.5 py-0.5 rounded text-[7px] font-black uppercase" style={{ background: 'rgba(255,184,108,0.12)', border: '1px solid rgba(255,184,108,0.25)', color: '#ffb86c' }}>
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>Lacks Gate</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: selectedNode === node.id ? 'rgba(189,147,249,0.15)' : 'rgba(255,255,255,0.04)' }}>
                              {node.type === "process" && <Workflow className="w-3 h-3" style={{ color: selectedNode === node.id ? '#bd93f9' : '#6272a4' }} />}
                              {node.type === "ai" && <Sparkles className="w-3 h-3" style={{ color: selectedNode === node.id ? '#bd93f9' : '#6272a4' }} />}
                              {node.type === "gateway" && <Layers className="w-3 h-3" style={{ color: selectedNode === node.id ? '#bd93f9' : '#6272a4' }} />}
                              {node.type === "document" && <FileText className="w-3 h-3" style={{ color: selectedNode === node.id ? '#bd93f9' : '#6272a4' }} />}
                            </div>
                            <span className="text-[7px] font-black uppercase tracking-wider" style={{ color: '#6272a4' }}>{node.type}</span>
                          </div>
                          <h5 className="font-extrabold text-[10px] text-white tracking-tight">{node.label}</h5>
                          <p className="text-[8px] leading-normal line-clamp-2 font-medium" style={{ color: '#6272a4' }}>{node.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {workspaceTab === "brd" && (
                <div className="flex-1 flex flex-col h-full">
                  <div className="h-8 border-b flex items-center justify-between px-3 select-none shrink-0" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)' }}>
                    <span className="text-[9px] font-bold text-gray-600">Spec Document Preview</span>
                    <span className="text-[8px] font-bold text-gray-700">IEEE Standard Format</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 text-left text-[11px] font-mono leading-relaxed" style={{ color: '#f8f8f2', whiteSpace: 'pre-wrap' }}>
                    {activePreset.brd}
                  </div>
                </div>
              )}

              {workspaceTab === "backlog" && (
                <div className="flex-1 flex flex-col h-full">
                  <div className="h-8 border-b flex items-center justify-between px-3 select-none shrink-0" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)' }}>
                    <span className="text-[9px] font-bold text-gray-600">Backlog Stories Traceability</span>
                    <span className="text-[8px] font-bold" style={{ color: '#50fa7b' }}>Synced to Canvas Nodes</span>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b text-[9px] font-bold uppercase tracking-wider" style={{ borderColor: 'rgba(255,255,255,0.05)', color: '#6272a4' }}>
                          <th className="pb-2">Story ID</th>
                          <th className="pb-2">Persona</th>
                          <th className="pb-2">Description</th>
                          <th className="pb-2 text-right">Points</th>
                        </tr>
                      </thead>
                      <tbody style={{ color: '#f8f8f2' }}>
                        {activePreset.stories.map((story) => (
                          <tr key={story.id} className="border-b hover:bg-white/[0.02] text-[10px] font-semibold" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                            <td className="py-2.5 font-mono font-bold" style={{ color: '#8be9fd' }}>{story.id}</td>
                            <td className="py-2.5" style={{ color: '#6272a4' }}>{story.role}</td>
                            <td className="py-2.5">{story.title}</td>
                            <td className="py-2.5 text-right font-mono" style={{ color: '#bd93f9' }}>{story.pts} SP</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Right Inspector */}
            <div className="w-full lg:w-64 border-l flex flex-col gap-4 p-4 text-left shrink-0" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex justify-between items-center pb-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5" style={{ color: '#8be9fd' }} />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Inspector</span>
                </div>
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded capitalize" style={{ background: 'rgba(189,147,249,0.1)', color: '#bd93f9', border: '1px solid rgba(189,147,249,0.2)' }}>
                  {activeNode.type}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: '#6272a4' }}>Label</span>
                  <p className="text-[11px] font-bold text-white mt-1">{activeNode.label}</p>
                </div>
                <div>
                  <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: '#6272a4' }}>Description</span>
                  <p className="text-[10px] leading-normal font-medium mt-1" style={{ color: '#6272a4' }}>{activeNode.desc}</p>
                </div>
                <div className="border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: '#6272a4' }}>Trace Link</span>
                  <div className="flex items-center gap-1.5 mt-1.5 p-2 rounded-lg text-[9px] font-bold" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6272a4' }}>
                    <Link2 className="w-3 h-3" />
                    <span>REQ-{activeNode.id}</span>
                  </div>
                </div>
              </div>
              {activeNode.warning ? (
                <div className="mt-auto rounded-xl p-3 flex flex-col gap-2" style={{ border: '1px solid rgba(255,184,108,0.2)', background: 'rgba(255,184,108,0.05)' }}>
                  <div className="flex gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#ffb86c' }} />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#ffb86c' }}>Compliance Warning</span>
                      <p className="text-[9px] leading-tight font-semibold mt-1" style={{ color: 'rgba(255,184,108,0.7)' }}>"{activeNode.warning}" — violates IEEE loop checking.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAutoFix(activeNode.id)}
                    className="w-full mt-1 py-1.5 px-3 rounded-lg font-black text-[9px] uppercase tracking-wider text-center cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                    style={{ background: '#ffb86c', color: '#1e1e2e' }}
                  >
                    <Zap className="w-3 h-3" />
                    <span>Run AI Loop Fixer</span>
                  </button>
                </div>
              ) : (
                <div className="mt-auto rounded-xl p-3 flex items-center gap-2" style={{ border: '1px solid rgba(80,250,123,0.15)', background: 'rgba(80,250,123,0.05)' }}>
                  <CheckCircle className="w-4 h-4 shrink-0" style={{ color: '#50fa7b' }} />
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#50fa7b' }}>Node Logic Validated Clean</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          TRUST BANNER
          ══════════════════════════════════════════════════════════════════ */}
      <section className="py-10 border-t border-b border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-[9px] font-bold text-gray-700 uppercase tracking-widest mb-5">Trusted by engineering teams at</p>
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-16 opacity-25 select-none font-bold text-sm tracking-widest text-gray-500">
            <span>A P E X &nbsp; A N A L Y T I C S</span>
            <span>H O R I Z O N &nbsp; D E V S</span>
            <span>B L U E &nbsp; S T R E A M</span>
            <span>V O R T E X &nbsp; P M</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FEATURES GRID
          ══════════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-28 px-6 md:px-12 max-w-6xl mx-auto text-left z-10 relative">
        <div className="flex flex-col md:flex-row items-baseline justify-between mb-16 gap-6">
          <div className="flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-gray-950/50 text-[10px] font-bold uppercase tracking-wider text-purple-400 self-start">
              Platform Core Architecture
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
              Designed for System<br />
              <span className="text-gradient-blue-purple">Analysts & PMs</span>
            </h2>
          </div>
          <p className="text-gray-500 text-sm font-normal max-w-md leading-relaxed">
            BAHub treats diagrams not as simple drawings, but as relational schemas synced in real-time. Link shapes, evaluate compliance, and export artifacts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Sparkles className="w-5 h-5 text-blue-400" />,
              iconBg: "bg-blue-500/10 border-blue-500/20",
              title: "AI Flow Diagram Synthesis",
              desc: "Paste unstructured transcripts or briefs. Our layout parser extracts actors, states, and logic paths, building sequence structures automatically."
            },
            {
              icon: <Link2 className="w-5 h-5 text-green-400" />,
              iconBg: "bg-green-500/10 border-green-500/20",
              title: "Bidirectional Trace Linkage",
              desc: "Modify a requirement in the database view and witness the linked flowchart node properties and exported spec documents update instantly."
            },
            {
              icon: <FileCheck className="w-5 h-5 text-purple-400" />,
              iconBg: "bg-purple-500/10 border-purple-500/20",
              title: "IEEE Logic Compliance Engine",
              desc: "Scan diagram structures for inconsistencies. Warnings highlight loose endpoints, broken branches, and missing gateways with one-click AI resolution."
            },
          ].map((feat, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-white/[0.07] bg-gray-950/40 p-6 flex flex-col gap-4 hover:border-white/[0.15] hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 relative overflow-hidden cursor-default"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/[0.02] transition-all duration-300 rounded-2xl" />
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${feat.iconBg}`}>
                {feat.icon}
              </div>
              <h3 className="font-extrabold text-sm text-white tracking-tight">{feat.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          INTEGRATIONS
          ══════════════════════════════════════════════════════════════════ */}
      <section id="integrations" className="py-20 px-6 md:px-12 border-t border-b border-white/[0.05]">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16 text-left">
          <div className="flex-1 flex flex-col gap-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-gray-950/50 text-[10px] font-bold uppercase tracking-wider text-blue-400 self-start">
              Engineering Sync
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              Bi-directional Sync with<br />
              <span className="text-gradient-blue-purple">Existing Tools</span>
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Do not disrupt your engineering team. BAHub includes real-time synchronization webhooks. Write specs in BAHub, draw process lines, and watch them push directly to Jira, Confluence, and GitHub.
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              {["Jira Sync", "Confluence PDF", "PlantUML", "Mermaid.js", "Draw.io XML"].map((tag) => (
                <span key={tag} className="text-[9px] font-bold bg-white/[0.04] border border-white/[0.08] text-gray-400 px-3 py-1 rounded-full uppercase tracking-wider">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex-1 rounded-2xl border border-white/[0.07] h-[280px] w-full relative overflow-hidden flex items-center justify-center" style={{ background: '#050709' }}>
            <div className="w-16 h-16 rounded-2xl border flex items-center justify-center relative z-10 animate-pulse" style={{ background: 'rgba(189,147,249,0.08)', borderColor: 'rgba(189,147,249,0.25)' }}>
              <Layers className="w-8 h-8" style={{ color: '#bd93f9' }} />
              <div className="absolute inset-0 rounded-2xl blur-xl animate-ping" style={{ background: 'rgba(189,147,249,0.1)' }} />
            </div>
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {[["50 50","140 100"],["450 50","320 100"],["50 230","140 180"],["450 230","320 180"]].map(([s,e],i)=>(
                <path key={i} d={`M ${s} L ${e}`} stroke="#44475a" strokeWidth="1" strokeDasharray="3,3" />
              ))}
            </svg>
            {[["top-6 left-12","Jira"],["top-6 right-12","Confluence"],["bottom-6 left-10","Slack"],["bottom-6 right-10","GitHub"]].map(([pos, label]) => (
              <div key={label} className={`absolute ${pos} rounded-lg px-2.5 py-1.5 text-[9px] font-bold tracking-wider uppercase`} style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', color: '#6272a4' }}>
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          TESTIMONIALS — 3D Marquee
          ══════════════════════════════════════════════════════════════════ */}
      <section id="testimonials" className="py-28 relative overflow-hidden">
        <div className="text-center mb-14 px-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-gray-950/50 text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-5">
            <Star className="w-3 h-3 fill-amber-400" />
            Customer Reviews
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
            Loved by <span className="text-gradient-blue-purple">Business Analysts</span>
          </h2>
        </div>

        {/* 3D marquee container */}
        <div
          className="relative"
          style={{ perspective: '400px', perspectiveOrigin: '50% 50%' }}
        >
          {/* Gradient fade masks */}
          <div className="absolute inset-x-0 top-0 h-32 z-10 pointer-events-none" style={{ background: 'linear-gradient(to bottom, #000 0%, transparent 100%)' }} />
          <div className="absolute inset-x-0 bottom-0 h-32 z-10 pointer-events-none" style={{ background: 'linear-gradient(to top, #000 0%, transparent 100%)' }} />
          <div className="absolute inset-y-0 left-0 w-32 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #000 0%, transparent 100%)' }} />
          <div className="absolute inset-y-0 right-0 w-32 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, #000 0%, transparent 100%)' }} />

          <div className="flex gap-4 justify-center px-8" style={{ transform: 'rotateX(8deg)', transformStyle: 'preserve-3d' }}>
            <MarqueeColumn items={col1} duration="22s" />
            <MarqueeColumn items={col2} reverse duration="28s" />
            <MarqueeColumn items={col3} duration="24s" />
            <div className="hidden xl:block">
              <MarqueeColumn items={[...TESTIMONIALS].reverse().slice(0, 4)} reverse duration="26s" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PRICING
          ══════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-28 px-6 md:px-12 max-w-6xl mx-auto text-center z-10 relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-gray-950/50 text-[10px] font-bold uppercase tracking-wider text-green-400 mb-5">
          Subscription Models
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
          Transparent, Team-Adjustable <span className="text-gradient-blue-purple">Pricing</span>
        </h2>
        <p className="text-gray-500 text-sm max-w-md mx-auto mb-10">
          Scale your pricing dynamically. Get substantial savings with yearly plans.
        </p>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-[11px] font-semibold ${billingCycle === "monthly" ? "text-white" : "text-gray-600"}`}>Monthly</span>
          <button
            onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
            className="w-11 h-6 rounded-full relative transition-all border cursor-pointer"
            style={{ background: '#111', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <div className={`w-4 h-4 rounded-full absolute top-1 transition-all ${billingCycle === "yearly" ? "left-6" : "left-1"}`} style={{ background: '#a78bfa' }} />
          </button>
          <span className={`text-[11px] font-semibold flex items-center gap-1.5 ${billingCycle === "yearly" ? "text-white" : "text-gray-600"}`}>
            Annual
            <span className="text-[8px] font-black px-2 py-0.5 rounded uppercase" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)' }}>Save 20%</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Starter */}
          <div className="rounded-2xl border border-white/[0.07] bg-gray-950/40 p-7 flex flex-col justify-between text-left hover:border-white/[0.14] hover:scale-[1.02] transition-all duration-300">
            <div className="flex flex-col gap-5">
              <div>
                <span className="text-[9px] font-bold uppercase text-gray-600 tracking-wider">Starter Tier</span>
                <h4 className="text-xl font-extrabold text-white mt-1">Core Analyst</h4>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">Ideal for individual analysts compiling requirements and logic maps.</p>
              <div className="flex items-baseline gap-1 py-3 border-t border-b border-white/[0.06]">
                <span className="text-4xl font-extrabold text-white">₹0</span>
                <span className="text-[10px] text-gray-600 font-medium">/ user / forever</span>
              </div>
              <ul className="flex flex-col gap-3 text-[11px] text-gray-500">
                {["1 Active Project workspace", "5 trace backlog requirements", "Basic AI prompt capabilities"].map(f => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />{f}</li>
                ))}
                <li className="flex items-center gap-2 text-gray-700"><Lock className="w-3 h-3 shrink-0" />No logical validation checking</li>
              </ul>
            </div>
            <button onClick={onNavigateToRegister} className="w-full mt-8 py-2.5 px-4 rounded-xl text-[11px] font-bold text-center border border-white/[0.08] hover:bg-white/[0.05] text-gray-400 hover:text-white transition-all cursor-pointer uppercase tracking-wider">
              Get started free
            </button>
          </div>

          {/* Pro — gradient card */}
          <div className="rounded-2xl p-7 flex flex-col justify-between text-left relative overflow-hidden hover:scale-[1.02] transition-all duration-300 shadow-glow-purple" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(109,40,217,0.20) 100%)', border: '1px solid rgba(167,139,250,0.25)' }}>
            <div className="absolute top-0 right-0 text-[7.5px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-widest" style={{ background: '#a78bfa', color: '#0a0a0a' }}>Most Popular</div>
            <div className="flex flex-col gap-5">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#a78bfa' }}>Premium Tier</span>
                <h4 className="text-xl font-extrabold text-white mt-1">Apex Professional</h4>
              </div>
              <div className="p-3 rounded-xl border border-white/[0.08] flex flex-col gap-2 select-none" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-gray-400">Team Size</span>
                  <span className="text-white px-2 py-0.5 rounded text-[9px]" style={{ background: 'rgba(167,139,250,0.2)', color: '#a78bfa' }}>{teamSize} Users</span>
                </div>
                <input type="range" min="1" max="30" value={teamSize} onChange={(e) => setTeamSize(Number(e.target.value))} className="w-full h-1 rounded-lg cursor-pointer" style={{ accentColor: '#a78bfa', background: '#333' }} />
                <span className="text-[8px] text-gray-600 text-center">Adjust slider to update price</span>
              </div>
              <div className="flex items-baseline gap-1 py-3 border-t border-b border-white/[0.08]">
                <span className="text-4xl font-extrabold" style={{ color: '#c4b5fd' }}>₹{calculatePrice().toLocaleString("en-IN")}</span>
                <span className="text-[10px] text-gray-600 font-medium">/ total / month</span>
              </div>
              <ul className="flex flex-col gap-3 text-[11px] text-gray-400">
                {["Unlimited Project workspaces", "Full Interactive Flow Canvas", "Dynamic compliance checking", "50 AI synthesis credits/month"].map(f => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: '#50fa7b' }} />{f}</li>
                ))}
              </ul>
            </div>
            <button onClick={onNavigateToRegister} className="w-full mt-8 py-2.5 px-4 rounded-xl text-[11px] font-bold text-center text-white transition-all cursor-pointer uppercase tracking-wider shadow-glow-purple" style={{ background: '#7c3aed' }}>
              Start 14-day free trial
            </button>
          </div>

          {/* Enterprise */}
          <div className="rounded-2xl border border-white/[0.07] bg-gray-950/40 p-7 flex flex-col justify-between text-left hover:border-white/[0.14] hover:scale-[1.02] transition-all duration-300">
            <div className="flex flex-col gap-5">
              <div>
                <span className="text-[9px] font-bold uppercase text-gray-600 tracking-wider">Agency Tier</span>
                <h4 className="text-xl font-extrabold text-white mt-1">Enterprise Org</h4>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">For complete consultancies running complex, concurrent system scoping.</p>
              <div className="flex items-baseline gap-1 py-3 border-t border-b border-white/[0.06]">
                <span className="text-4xl font-extrabold text-white">{billingCycle === "monthly" ? "₹6,500" : "₹5,200"}</span>
                <span className="text-[10px] text-gray-600 font-medium">/ user / month</span>
              </div>
              <ul className="flex flex-col gap-3 text-[11px] text-gray-500">
                {["Bi-directional Jira & Confluence", "Exporters: Draw.io, BPMN, PlantUML", "Concurrent editor collaboration locks", "Unlimited priority AI generations"].map(f => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />{f}</li>
                ))}
              </ul>
            </div>
            <button onClick={onNavigateToRegister} className="w-full mt-8 py-2.5 px-4 rounded-xl text-[11px] font-bold text-center border border-white/[0.08] hover:bg-white/[0.05] text-gray-400 hover:text-white transition-all cursor-pointer uppercase tracking-wider">
              Contact Sales team
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FAQ — DNA Accordion
          ══════════════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-28 px-6 md:px-12 border-t border-white/[0.05]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-gray-950/50 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-5">
              Support FAQ
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Frequently Asked <span className="text-gradient-blue-purple">Questions</span>
            </h2>
          </div>

          <div className="rounded-2xl border border-white/[0.08] overflow-hidden" style={{ background: 'rgba(10,10,10,0.6)' }}>
            {FAQS.map((faq, idx) => (
              <div key={idx} className={`border-b border-white/[0.06] last:border-0`}>
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="flex justify-between items-center text-left w-full px-6 py-5 cursor-pointer font-semibold text-sm text-white gap-4 hover:bg-white/[0.02] transition-colors"
                >
                  <span>{faq.q}</span>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${openFaq === idx ? "bg-purple-600 rotate-45" : "bg-white/[0.06] border border-white/[0.10]"}`}>
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === idx ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}`}>
                  <p className="text-[12px] text-gray-500 leading-relaxed px-6 pb-5 font-normal">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          CTA SECTION — Purple Gradient Card
          ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-6 md:px-12 max-w-6xl mx-auto">
        <div
          className="rounded-3xl p-12 text-center relative overflow-hidden cursor-default hover:scale-[1.01] transition-all duration-500"
          style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)' }}
        >
          {/* Dot-grid texture */}
          <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          {/* Glow */}
          <div className="absolute top-[-60px] left-[40%] w-80 h-80 rounded-full blur-[80px] pointer-events-none" style={{ background: 'rgba(192,132,252,0.25)' }} />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-white/10 text-[10px] font-bold uppercase tracking-wider text-white/80 mb-6">
              <Zap className="w-3 h-3 fill-white" />
              Start Your Free Trial
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
              Ready to Transform Your<br />BA Workflow?
            </h2>
            <p className="text-purple-200 text-sm font-normal max-w-lg mx-auto mb-8 leading-relaxed">
              Join thousands of business analysts using BAHub to synthesize requirements, manage stakeholders, and ship better specs faster.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={onNavigateToRegister}
                className="px-8 py-3 rounded-xl text-sm font-bold bg-white text-purple-900 hover:bg-gray-100 transition-all duration-200 shadow-lg cursor-pointer flex items-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onNavigateToLogin}
                className="px-8 py-3 rounded-xl text-sm font-semibold bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200 cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FOOTER — DNA 5-column grid
          ══════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/[0.06] py-16 px-6 md:px-12" style={{ background: '#000' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            {/* Brand col — span 2 */}
            <div className="col-span-2 flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  <img src={logo} alt="BAHub Logo" className="w-4 h-4 object-contain" />
                </div>
                <div>
                  <span className="font-extrabold text-[11px] tracking-widest uppercase text-white/90">BAHub</span>
                  <p className="text-[8px] font-bold text-purple-400 uppercase tracking-widest">Workspace Platform</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed max-w-[180px]">
                The AI-powered BA workspace for traceable specifications and process engineering.
              </p>
              <div className="flex items-center gap-2">
                {["GH", "TW", "LI"].map((s) => (
                  <div key={s} className="w-8 h-8 rounded-lg border flex items-center justify-center text-[9px] font-bold text-gray-600 hover:text-white hover:border-white/20 transition-colors cursor-pointer" style={{ background: '#0a0a0a', borderColor: 'rgba(255,255,255,0.08)' }}>
                    {s}
                  </div>
                ))}
              </div>
            </div>

            {/* Nav cols */}
            {[
              { title: "Product", links: ["Features", "Sandbox", "Integrations", "Changelog"] },
              { title: "Resources", links: ["Documentation", "API Ref", "Tutorials", "Status"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
            ].map((col) => (
              <div key={col.title} className="flex flex-col gap-4">
                <h4 className="text-[9px] font-bold uppercase tracking-widest text-gray-500">{col.title}</h4>
                <ul className="flex flex-col gap-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-[11px] text-gray-600 hover:text-white transition-colors duration-150">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Legal bar */}
          <div className="border-t border-white/[0.06] pt-6 flex flex-col lg:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-700">
              <span>Made with</span>
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
              <span>for Business Analysts & Product Engineers</span>
            </div>
            <span className="text-[10px] text-gray-700">© {new Date().getFullYear()} BAHub Contributors. MIT Licensed.</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
export default LandingPage;
