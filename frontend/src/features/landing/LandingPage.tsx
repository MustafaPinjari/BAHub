import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Workflow,
  FileText,
  CheckCircle,
  ArrowRight,
  GitBranch,
  FileCheck,
  Heart,
  Link2,
  Terminal,
  Zap,
  RefreshCw,
  Star,
  Shield,
  Clock,
  Globe,
  Plus
} from "lucide-react";
import logo from "../../assets/logo.png";
import sectionPng from "../../assets/section_png.png";
import sandboxPng from "../../assets/sandbox.png";

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

// Testimonials data for the 3D marquee
const TESTIMONIALS = [
  { name: "Priya Sharma", role: "Lead BA, FinTech Corp", text: "BAHub transformed our requirements process. The AI canvas generates BRDs in minutes instead of weeks. Game-changing.", stars: 5 },
  { name: "Alex Chen", role: "Product Manager, SaaS Co", text: "The bidirectional trace linkage is phenomenal. Change a requirement, watch it update everywhere instantly.", stars: 5 },
  { name: "Mohammed Al-Rashid", role: "Systems Architect", text: "Finally a tool that understands the BA workflow. Structured quality checks save us hours of manual review.", stars: 5 },
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
    a: "Enterprise SSO scaffolding is available for configured workspaces. Production IdP onboarding should be completed during enterprise setup."
  },
  {
    q: "Is there an on-premise deployment option?",
    a: "Self-hosted deployment is a roadmap item for enterprise customers. Today, BAHub is designed for cloud deployment with environment-based configuration."
  }
];

// Magic UI style GridPattern component
const GridPattern = () => (
  <div className="absolute inset-0 -z-10 h-full w-full bg-black bg-[linear-gradient(to_right,#1f29370e_1px,transparent_1px),linear-gradient(to_bottom,#1f29370e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />
);

// Magic UI style Meteors component
const Meteors: React.FC<{ number?: number }> = ({ number = 20 }) => {
  const [meteorStyles, setMeteorStyles] = useState<React.CSSProperties[]>([]);

  useEffect(() => {
    const styles = [...Array(number)].map(() => ({
      top: Math.floor(Math.random() * -20) + "px",
      left: Math.floor(Math.random() * 300) + "px",
      animationDelay: Math.random() * 8 + 0.2 + "s",
      animationDuration: Math.floor(Math.random() * 8 + 2) + "s",
    }));
    setMeteorStyles(styles);
  }, [number]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {meteorStyles.map((style, idx) => (
        <span
          key={idx}
          className="absolute h-0.5 w-0.5 rotate-[215deg] animate-meteor rounded-full bg-purple-400 shadow-[0_0_0_1px_#ffffff10] before:absolute before:top-1/2 before:w-[50px] before:-translate-y-1/2 before:bg-gradient-to-r before:from-purple-500 before:to-transparent before:content-['']"
          style={style}
        />
      ))}
    </div>
  );
};

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
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
      <GridPattern />

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
            <span className="text-[11px] font-medium text-gray-500">Audit trails</span>
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
            <span className="text-[11px] font-medium text-gray-500">Data controls planned</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Clock className="w-3 h-3 text-amber-400" />
            </div>
            <span className="text-[11px] font-medium text-gray-500">Status monitoring planned</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          INTERACTIVE SANDBOX
          ══════════════════════════════════════════════════════════════════ */}
      <section id="sandbox" className="py-16 px-6 md:px-12 max-w-6xl mx-auto z-10 relative">
        <div className="text-center mb-10 flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-gray-950/50 text-[10px] font-bold uppercase tracking-wider text-purple-400">
            Interactive Modeling Sandbox
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            No-Code Process <span className="text-gradient-blue-purple">Playground</span>
          </h2>
          <p className="text-gray-500 text-sm max-w-xl">
            Experience our workspace in action. Model functional relationships, trigger AI verification loops, and keep your documentation in lockstep.
          </p>
        </div>

        {/* Dracula-chrome sandbox container with Border Beam */}
        <div className="w-full rounded-2xl overflow-hidden shadow-2xl border relative group" style={{ background: '#0d0f17', borderColor: 'rgba(255,255,255,0.07)' }}>
          {/* Magic UI Border Beam */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none z-20 overflow-hidden">
            <div className="absolute -inset-[200%] animate-border-beam [background:linear-gradient(to_right,transparent_50%,rgba(168,85,247,0.4)_70%,rgba(168,85,247,0.7)_80%,transparent_100%)] [mask-image:linear-gradient(transparent_0%,#000_100%)]" />
          </div>

          {/* Browser chrome header */}
          <div className="flex items-center justify-between px-4 py-3 border-b relative z-10" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(10,10,10,0.8)' }}>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-[9px] font-mono ml-3 text-gray-500">Workspace Preview (Interactive Sandbox)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">Active Server</span>
            </div>
          </div>

          {/* Image sandbox */}
          <div className="relative w-full aspect-[16/9] lg:aspect-[16/8.8] overflow-hidden bg-black flex items-center justify-center">
            <img 
              src={sandboxPng} 
              alt="BAHub Interactive Sandbox Workspace" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.01]" 
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          TRUST BANNER
          ══════════════════════════════════════════════════════════════════ */}
      <section className="py-10 border-t border-b border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-[9px] font-bold text-gray-700 uppercase tracking-widest mb-5">In active use by early-access teams</p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 select-none">
            {[
              { label: "Free Early Access", detail: "No credit card required" },
              { label: "BA-Focused", detail: "Built for analysts & PMs" },
              { label: "MIT Licensed", detail: "Open & transparent" },
              { label: "Live Sandbox", detail: "Try it without signing up" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1">
                <span className="text-[11px] font-bold text-gray-500">{item.label}</span>
                <span className="text-[9px] text-gray-700 font-medium">{item.detail}</span>
              </div>
            ))}
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
            BAHub treats diagrams not as simple drawings, but as relational schemas synced in real-time. Link shapes, run quality checks, and export artifacts.
          </p>
        </div>

        {/* Row 1 — Requirements & Documentation */}
        <div className="mb-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-700 mb-4">Requirements &amp; Documentation</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: <FileCheck className="w-4 h-4 text-blue-400" />, bg: "bg-blue-500/10 border-blue-500/20", title: "Requirements Manager", desc: "Capture Functional, Non-Functional, Technical, and UI requirements with priority levels, versioning, and stakeholder source links. AI-generates drafts from raw text." },
              { icon: <FileText className="w-4 h-4 text-indigo-400" />, bg: "bg-indigo-500/10 border-indigo-500/20", title: "BRD Generator", desc: "AI-compiles Business Requirements Documents from your project data with one click. Supports draft → review → approved → signed-off workflow and PDF download." },
              { icon: <FileText className="w-4 h-4 text-violet-400" />, bg: "bg-violet-500/10 border-violet-500/20", title: "FRD Generator", desc: "Functional Requirements Documents with full versioning, sign-off tracking, and downloadable export. Linked directly to your requirements backlog." },
            ].map((f, i) => (
              <div key={i} className="group rounded-xl border border-white/[0.07] bg-gray-950/40 p-5 flex flex-col gap-3 hover:border-white/[0.15] hover:bg-gray-900/60 transition-all duration-200 cursor-default">
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${f.bg}`}>{f.icon}</div>
                <h3 className="font-bold text-[13px] text-white tracking-tight">{f.title}</h3>
                <p className="text-gray-600 text-[11px] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 — Diagrams & Analysis */}
        <div className="mb-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-700 mb-4">Diagrams &amp; Process Modeling</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: <Workflow className="w-4 h-4 text-green-400" />, bg: "bg-green-500/10 border-green-500/20", title: "Interactive Flow Canvas", desc: "Build BPMN 2.0, UML Use Case, Sequence, ERD, System Context, and Customer Journey diagrams. 12+ industry starter templates (E-Commerce, Banking, Healthcare, ERP…)." },
              { icon: <Sparkles className="w-4 h-4 text-yellow-400" />, bg: "bg-yellow-500/10 border-yellow-500/20", title: "AI Assistant", desc: "Context-aware BA chat powered by LLMs. Drafts user stories, audits project risks, writes QA scripts, and answers questions about your active project database." },
              { icon: <GitBranch className="w-4 h-4 text-cyan-400" />, bg: "bg-cyan-500/10 border-cyan-500/20", title: "User Stories Backlog", desc: "Generate As a [role] / I want / So that user stories with AI. Tracks status (TODO → In Progress → QA → Done), story points, and acceptance criteria." },
            ].map((f, i) => (
              <div key={i} className="group rounded-xl border border-white/[0.07] bg-gray-950/40 p-5 flex flex-col gap-3 hover:border-white/[0.15] hover:bg-gray-900/60 transition-all duration-200 cursor-default">
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${f.bg}`}>{f.icon}</div>
                <h3 className="font-bold text-[13px] text-white tracking-tight">{f.title}</h3>
                <p className="text-gray-600 text-[11px] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Row 3 — Strategic & Risk */}
        <div className="mb-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-700 mb-4">Strategic Analysis &amp; Risk</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: <Shield className="w-4 h-4 text-red-400" />, bg: "bg-red-500/10 border-red-500/20", title: "Risk Register", desc: "Log risks with probability (High/Medium/Low), impact scoring, mitigation plans, and lifecycle status (Identified → Mitigated → Occurred → Closed)." },
              { icon: <Zap className="w-4 h-4 text-amber-400" />, bg: "bg-amber-500/10 border-amber-500/20", title: "SWOT Analysis", desc: "Structured Strengths, Weaknesses, Opportunities, and Threats workspace per project. Save, load, and compare SWOT models across project iterations." },
              { icon: <Link2 className="w-4 h-4 text-pink-400" />, bg: "bg-pink-500/10 border-pink-500/20", title: "Gap Analysis", desc: "Map current state vs. future state for each identified gap. Tracks action plans and resolution status (Identified → In Progress → Resolved)." },
            ].map((f, i) => (
              <div key={i} className="group rounded-xl border border-white/[0.07] bg-gray-950/40 p-5 flex flex-col gap-3 hover:border-white/[0.15] hover:bg-gray-900/60 transition-all duration-200 cursor-default">
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${f.bg}`}>{f.icon}</div>
                <h3 className="font-bold text-[13px] text-white tracking-tight">{f.title}</h3>
                <p className="text-gray-600 text-[11px] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Row 4 — Governance & Collaboration */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-700 mb-4">Governance &amp; Collaboration</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: <Clock className="w-4 h-4 text-teal-400" />, bg: "bg-teal-500/10 border-teal-500/20", title: "Meeting Notes & Action Items", desc: "Log meetings with objectives, attendees, and notes. Track open action items with assignees, due dates, and completion status from a single dashboard." },
              { icon: <RefreshCw className="w-4 h-4 text-orange-400" />, bg: "bg-orange-500/10 border-orange-500/20", title: "Change Request Manager", desc: "Formal change request workflow: Draft → Review → Approved/Rejected. Includes reason, impact analysis, and reviewer sign-off with timestamps." },
              { icon: <Terminal className="w-4 h-4 text-purple-400" />, bg: "bg-purple-500/10 border-purple-500/20", title: "Full Audit Log", desc: "Every CREATE, UPDATE, DELETE, LOGIN, and LOGOUT event is recorded with IP address, user agent, field-level change diffs, and paginated search." },
            ].map((f, i) => (
              <div key={i} className="group rounded-xl border border-white/[0.07] bg-gray-950/40 p-5 flex flex-col gap-3 hover:border-white/[0.15] hover:bg-gray-900/60 transition-all duration-200 cursor-default">
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${f.bg}`}>{f.icon}</div>
                <h3 className="font-bold text-[13px] text-white tracking-tight">{f.title}</h3>
                <p className="text-gray-600 text-[11px] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
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
          <div className="flex-1 w-full flex items-center justify-center relative">
            <div className="absolute -inset-4 bg-purple-500/10 rounded-3xl filter blur-2xl opacity-40 z-0 pointer-events-none" />
            <img 
              src={sectionPng} 
              alt="Engineering Integration Sync Map" 
              className="w-full max-w-[500px] h-auto object-contain rounded-2xl relative z-10" 
            />
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
          PRICING — exact match to BillingPage.tsx & RegisterForm.tsx
          ══════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-28 px-6 md:px-12 max-w-6xl mx-auto text-center z-10 relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-gray-950/50 text-[10px] font-bold uppercase tracking-wider text-green-400 mb-5">
          Subscription Plans
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
          Simple, Transparent <span className="text-gradient-blue-purple">Pricing</span>
        </h2>
        <p className="text-gray-500 text-sm max-w-lg mx-auto mb-12">
          Choose a plan tailored to scale your B2B specification work, BRD/FRD generation, and strategic roadmap modelling.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

          {/* FREE STARTER — exact from BillingPage */}
          <div className="rounded-2xl border border-white/[0.07] bg-gray-950/40 p-7 flex flex-col justify-between text-left hover:border-white/[0.14] hover:shadow-2xl transition-all duration-300">
            <div className="flex flex-col gap-5">
              <div>
                <h4 className="text-xl font-bold text-white">Free Starter</h4>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">$0</span>
                  <span className="text-[11px] text-gray-600 font-medium ml-1">/ month</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed mt-2">
                  Perfect for individual analysts exploring requirements generation and SWOT analyses.
                </p>
              </div>
              <div className="border-t border-white/[0.06] pt-4 flex flex-col gap-2.5">
                {[
                  "Up to 5 Workspace Seats",
                  "100 AI Credits per Month",
                  "Basic SWOT & Gap Analysis",
                ].map(f => (
                  <div key={f} className="flex items-start gap-2 text-[11px] text-gray-400">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={onNavigateToRegister}
              className="w-full mt-8 py-2.5 px-4 rounded-xl text-[11px] font-bold text-center border border-white/[0.08] hover:bg-white/[0.05] text-gray-400 hover:text-white transition-all cursor-pointer uppercase tracking-wider"
            >
              Get Started Free
            </button>
          </div>

          {/* PRO GROWTH — exact from BillingPage, highlighted */}
          <div
            className="rounded-2xl p-7 flex flex-col justify-between text-left relative overflow-hidden hover:shadow-2xl transition-all duration-300"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(109,40,217,0.22) 100%)', border: '1px solid rgba(167,139,250,0.30)' }}
          >
            <Meteors number={12} />
            <div className="absolute top-0 right-0 text-[7.5px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-widest z-10" style={{ background: '#a78bfa', color: '#0a0a0a' }}>Popular</div>
            <div className="flex flex-col gap-5">
              <div>
                <h4 className="text-xl font-bold text-white flex items-center gap-2">
                  Pro Growth
                  <Zap className="w-4 h-4" style={{ color: '#a78bfa' }} />
                </h4>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-black" style={{ color: '#c4b5fd' }}>$49</span>
                  <span className="text-[11px] text-gray-500 font-medium ml-1">/ month</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed mt-2">
                  Accelerated design suite for teams that compile documents and run heavy AI chat audits.
                </p>
              </div>
              <div className="border-t border-white/[0.10] pt-4 flex flex-col gap-2.5">
                {[
                  "Up to 20 Workspace Seats",
                  "1,000 AI Credits per Month",
                  "Advanced SWOT/Gap strategic models",
                  "Priority Document Compile Jobs",
                ].map(f => (
                  <div key={f} className="flex items-start gap-2 text-[11px] text-gray-300">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#50fa7b' }} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={onNavigateToRegister}
              className="w-full mt-8 py-2.5 px-4 rounded-xl text-[11px] font-bold text-center text-white transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2"
              style={{ background: '#7c3aed' }}
            >
              Upgrade Workspace <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ENTERPRISE CORE — exact from BillingPage */}
          <div className="rounded-2xl border border-white/[0.07] bg-gray-950/40 p-7 flex flex-col justify-between text-left hover:border-white/[0.14] hover:shadow-2xl transition-all duration-300">
            <div className="flex flex-col gap-5">
              <div>
                <h4 className="text-xl font-bold text-white flex items-center gap-2">
                  Enterprise Core
                  <Shield className="w-4 h-4 text-purple-400" />
                </h4>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">$299</span>
                  <span className="text-[11px] text-gray-600 font-medium ml-1">/ month</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed mt-2">
                  Designed for global consulting agencies needing deep limits and customisable systems.
                </p>
              </div>
              <div className="border-t border-white/[0.06] pt-4 flex flex-col gap-2.5">
                {[
                  "Up to 1,000 Workspace Seats",
                  "10,000 AI Credits per Month",
                  "Configurable AI prompt templates",
                  "SSO, custom integrations & Audit trails",
                ].map(f => (
                  <div key={f} className="flex items-start gap-2 text-[11px] text-gray-400">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={onNavigateToRegister}
              className="w-full mt-8 py-2.5 px-4 rounded-xl text-[11px] font-bold text-center border border-white/[0.08] hover:bg-white/[0.05] text-gray-400 hover:text-white transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2"
            >
              Contact Sales / Upgrade <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Comparison note */}
        <p className="text-[10px] text-gray-700 mt-8">
          Free Starter does not require a paid subscription. Trial and checkout availability depends on billing configuration.
          Workspace Admin required to upgrade plans.
        </p>
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
