"use client";
import React, { useState, useEffect, useRef, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Workflow, FileText, ArrowRight, GitBranch,
  FileCheck, Heart, Terminal, Zap, Star, Shield, Clock, Plus,
  Users, ChevronRight, Check, X, BarChart2,
  Layers, Lock, Folder, UserCheck, Activity, Paperclip, ListChecks,
} from "lucide-react";
import { AnimatedBeam } from "../../components/ui/AnimatedBeam";
import { Marquee } from "../../components/ui/Marquee";
import { BentoGrid, BentoGridItem } from "../../components/ui/BentoGrid";
import {
  RequirementsHeader, BRDHeader, DiagramHeader, AIHeader,
  RiskHeader, SwotHeader, StoriesHeader, AuditHeader,
} from "../../components/ui/BentoHeaders";
import logo from "../../assets/logo.png";
import { LaunchCountdown } from "./LaunchCountdown";
import { usePublicSettings } from "./usePublicSettings";
import { ExitIntentModal } from "../../components/common/ExitIntentModal";

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
  onTryDemo: () => void;
}

// ─── Static Data ─────────────────────────────────────────────────────────────
const CUSTOMER_LOGOS = [
  { name: "FinTech Corp", gradient: "from-blue-500 to-cyan-500" },
  { name: "Scale-up.io", gradient: "from-purple-500 to-pink-500" },
  { name: "Global Consulting", gradient: "from-emerald-500 to-teal-500" },
  { name: "TechVentures", gradient: "from-orange-500 to-red-500" },
  { name: "DataDriven Inc", gradient: "from-indigo-500 to-blue-500" },
  { name: "AgileFirst", gradient: "from-yellow-500 to-orange-500" },
];

const TESTIMONIALS = [
  { name: "Priya Sharma", role: "Lead BA, FinTech Corp", text: "BAHub cut our BRD cycle from 3 weeks to 2 days. The requirements-to-diagram trace is genuinely game-changing.", stars: 5 },
  { name: "Alex Chen", role: "Product Manager, SaaS Co", text: "Change a requirement and every linked story, diagram, and document updates instantly. No more drift between artifacts.", stars: 5 },
  { name: "Mohammed Al-Rashid", role: "Systems Architect", text: "The BPMN export drops straight into our Camunda execution engine. First BA tool that actually fits an architect's workflow.", stars: 5 },
  { name: "Sarah Williams", role: "Agile Coach, Consulting", text: "My clients get polished BRDs in hours. The sign-off workflow alone saves a week of email chains.", stars: 5 },
  { name: "Raj Patel", role: "CTO, Product Studio", text: "Replaced Lucidchart + Confluence + Jira with one platform. The Jira sync is rock solid.", stars: 5 },
  { name: "Elena Kowalski", role: "Senior BA, Insurance", text: "SWOT and Gap Analysis modules in the same tool as my requirements. No more spreadsheet juggling.", stars: 5 },
  { name: "David Kim", role: "Tech Lead, E-Commerce", text: "Process canvas to BPMN XML export works flawlessly. Our execution engine ingests it directly.", stars: 5 },
  { name: "Fatima Al-Zahra", role: "Project Director", text: "Risk register with owner assignment and mitigation tracking — finally a BA tool that takes governance seriously.", stars: 5 },
  { name: "Tom Nguyen", role: "DevOps Lead, Scale-up", text: "The audit log feature is a compliance dream. Full traceability from conversation to deployment.", stars: 5 },
  { name: "Ishaan Gupta", role: "Solution Architect", text: "PlantUML and Mermaid.js exports pair perfectly with our docs-as-code pipeline.", stars: 5 },
];

const FAQS = [
  { q: "What makes BAHub different from Confluence, Jira, or Notion?", a: "BAHub is purpose-built for Business Analysts. Every piece of data — requirements, diagrams, risks, stories, documents — is linked. Edit a requirement and its trace propagates everywhere. Jira and Confluence are generic tools; BAHub is a structured specification engineering platform." },
  { q: "How does the AI diagram generation work?", a: "Paste a meeting transcript, process description, or raw brief into the Analysis Models canvas. The AI parser identifies actors, events, decisions, and flow paths, then renders a structured BPMN, UML Sequence, or Use Case diagram you can edit node-by-node." },
  { q: "What export formats are supported?", a: "BRD and FRD documents export as PDF and Word (.docx). Diagrams export as BPMN 2.0 XML (Camunda-compatible), draw.io XML, PlantUML, and Mermaid.js. User stories push directly to Jira via bidirectional sync." },
  { q: "Does BAHub support enterprise SSO?", a: "Yes. Enterprise plans include SAML 2.0 Identity Provider integration with JIT user provisioning. Employee directory roles map automatically to workspace permission levels on first login." },
  { q: "Is my data secure?", a: "BAHub runs on isolated multi-tenant infrastructure. Audit logs provide immutable trails for SOC 2 and GDPR compliance evidence packages. Every action is recorded with user, IP, and field-level diffs." },
];

const PRICING = [
  {
    name: "Free Starter",
    monthlyPrice: 0,
    yearlyPrice: 0,
    desc: "For individual analysts getting started.",
    color: "border-white/[0.08]",
    badge: null,
    features: [
      { text: "5 Workspace Seats", ok: true },
      { text: "100 AI Credits / month", ok: true },
      { text: "Requirements Manager", ok: true },
      { text: "Basic SWOT & Gap Analysis", ok: true },
      { text: "BRD / FRD Generator", ok: false },
      { text: "Jira & Confluence Sync", ok: false },
      { text: "Audit Logs", ok: false },
    ],
    cta: "Generate Your First BRD in 60 Seconds →",
    ctaStyle: "border border-white/[0.12] text-gray-400 hover:text-white hover:border-white/25",
  },
  {
    name: "Pro Growth",
    monthlyPrice: 49,
    yearlyPrice: 39,
    desc: "For teams compiling documents and running AI audits.",
    color: "border-purple-500/40",
    badge: "Most Popular",
    features: [
      { text: "20 Workspace Seats", ok: true },
      { text: "1,000 AI Credits / month", ok: true },
      { text: "All Free features", ok: true },
      { text: "BRD / FRD Generator (PDF & Word)", ok: true },
      { text: "Interactive Flow Canvas", ok: true },
      { text: "Jira & Confluence Sync", ok: true },
      { text: "Audit Logs", ok: false },
    ],
    cta: "Start 14-day Trial",
    ctaStyle: "bg-purple-600 hover:bg-purple-500 text-white",
  },
  {
    name: "Enterprise",
    monthlyPrice: 299,
    yearlyPrice: 239,
    desc: "For consulting agencies needing full governance.",
    color: "border-white/[0.08]",
    badge: null,
    features: [
      { text: "1,000 Workspace Seats", ok: true },
      { text: "10,000 AI Credits / month", ok: true },
      { text: "All Pro features", ok: true },
      { text: "SAML 2.0 SSO + JIT Provisioning", ok: true },
      { text: "Full Audit Logs & SOC 2 Reports", ok: true },
      { text: "Custom AI prompt templates", ok: true },
      { text: "Priority SLA + Dedicated Support", ok: true },
    ],
    cta: "Contact Sales",
    ctaStyle: "border border-white/[0.12] text-gray-400 hover:text-white hover:border-white/25",
  },
];

const HOW_IT_WORKS = [
  { step: "01", icon: <Terminal className="w-4 h-4 text-white/40" />, title: "Paste raw input", desc: "Drop in meeting transcripts, client emails, voice notes, or raw requirement briefs — any unstructured text works." },
  { step: "02", icon: <Sparkles className="w-4 h-4 text-white/40" />, title: "AI synthesizes", desc: "The engine extracts actors, events, and logic paths — generating annotated flow diagrams, requirement drafts, and user stories instantly." },
  { step: "03", icon: <FileCheck className="w-4 h-4 text-white/40" />, title: "Review & link", desc: "Edit nodes, resolve compliance warnings, link stories to requirements, and route your BRD through the approval workflow." },
  { step: "04", icon: <ArrowRight className="w-4 h-4 text-white/40" />, title: "Export & sync", desc: "Push to Jira, export BPMN / PDF / Word, push Confluence pages, or download PlantUML — all from one click." },
];

// ─── Shared micro-components ──────────────────────────────────────────────────
const GridPattern = () => (
  <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_60%,transparent_100%)]" />
);

const Meteors: React.FC<{ number?: number }> = ({ number = 14 }) => {
  const [styles, setStyles] = useState<React.CSSProperties[]>([]);
  useEffect(() => {
    setStyles([...Array(number)].map(() => ({
      top: `${Math.floor(Math.random() * -20)}px`,
      left: `${Math.floor(Math.random() * 360)}px`,
      animationDelay: `${(Math.random() * 8 + 0.2).toFixed(2)}s`,
      animationDuration: `${Math.floor(Math.random() * 8 + 2)}s`,
    })));
  }, [number]);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {styles.map((s, i) => (
        <span key={i} className="absolute h-0.5 w-0.5 rotate-[215deg] animate-meteor rounded-full bg-purple-400 shadow-[0_0_0_1px_#ffffff08] before:absolute before:top-1/2 before:w-[50px] before:-translate-y-1/2 before:bg-gradient-to-r before:from-purple-500 before:to-transparent before:content-['']" style={s} />
      ))}
    </div>
  );
};

// ─── Brand icons ──────────────────────────────────────────────────────────────
const JiraIcon = () => (
  <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none"><path d="M16 2.667S8.89 9.333 8.89 14.222c0 3.93 3.178 7.11 7.112 7.11s7.111-3.18 7.111-7.11C23.113 9.333 16 2.667 16 2.667Z" fill="#2684FF" /><path d="M16 21.333c-3.934 0-7.112-3.18-7.112-7.11 0-.986.203-1.925.571-2.779L4.446 16.47c-.89 2.22-.89 4.89 0 7.11C6.224 28 11.113 30.222 16 30.222c4.889 0 9.778-2.221 11.556-6.666.89-2.221.89-4.89 0-7.111l-5.015-5.027c.368.854.571 1.793.571 2.778 0 3.93-3.178 7.111-7.112 7.111Z" fill="#0052CC" /></svg>
);
const ConfluenceIcon = () => (
  <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none"><path d="M3.2 23.04c-.32.48-.08 1.12.48 1.28l5.44 1.76c.48.16 1.04-.08 1.28-.56.96-1.92 2.08-3.84 4-4.64 2.24-.96 4.64-.48 6.88.32 1.28.48 2.56 1.12 3.84 1.76.48.24 1.04.08 1.28-.4l2.56-4.64c.24-.48 0-1.04-.48-1.28C25.28 15.6 21.28 13.6 17.12 13.6c-4.16 0-7.52 2.08-9.92 5.28L3.2 23.04Z" fill="#0052CC" /><path d="M28.8 8.96c.32-.48.08-1.12-.48-1.28L22.88 5.92c-.48-.16-1.04.08-1.28.56-.96 1.92-2.08 3.84-4 4.64-2.24.96-4.64.48-6.88-.32-1.28-.48-2.56-1.12-3.84-1.76-.48-.24-1.04-.08-1.28.4L3.04 13.92c-.24.48 0 1.04.48 1.28 3.2 1.76 7.2 3.76 11.36 3.76 4.16 0 7.52-2.08 9.92-5.28L28.8 8.96Z" fill="#2684FF" /></svg>
);
const SlackIcon = () => (
  <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none"><path d="M13.333 4a2.667 2.667 0 1 0 0 5.333H16V6.667A2.667 2.667 0 0 0 13.333 4Z" fill="#E01E5A" /><path d="M4 13.333a2.667 2.667 0 0 0 5.333 0V10.667H6.667A2.667 2.667 0 0 0 4 13.333Z" fill="#36C5F0" /><path d="M18.667 28a2.667 2.667 0 1 0 0-5.333H16V25.333A2.667 2.667 0 0 0 18.667 28Z" fill="#2EB67D" /><path d="M28 18.667a2.667 2.667 0 0 0-5.333 0V21.333H25.333A2.667 2.667 0 0 0 28 18.667Z" fill="#ECB22E" /><path d="M18.667 4a2.667 2.667 0 0 0 0 5.333H21.333V6.667A2.667 2.667 0 0 0 18.667 4Z" fill="#ECB22E" /><path d="M28 13.333a2.667 2.667 0 0 0-2.667-2.666H22.667v2.666a2.667 2.667 0 1 0 5.333 0Z" fill="#2EB67D" /><path d="M13.333 28a2.667 2.667 0 0 0 0-5.333H10.667V25.333A2.667 2.667 0 0 0 13.333 28Z" fill="#36C5F0" /><path d="M4 18.667a2.667 2.667 0 0 0 2.667 2.666H9.333v-2.666a2.667 2.667 0 1 0-5.333 0Z" fill="#E01E5A" /></svg>
);
const GitHubIcon = () => (
  <svg viewBox="0 0 32 32" className="w-5 h-5 fill-white/70"><path d="M16 2C8.27 2 2 8.27 2 16c0 6.19 4.01 11.43 9.57 13.29.7.13.96-.3.96-.67v-2.35c-3.89.85-4.72-1.87-4.72-1.87-.63-1.62-1.55-2.05-1.55-2.05-1.27-.87.1-.85.1-.85 1.4.1 2.14 1.44 2.14 1.44 1.25 2.14 3.27 1.52 4.07 1.16.13-.9.49-1.52.89-1.87-3.1-.35-6.36-1.55-6.36-6.9 0-1.52.54-2.77 1.44-3.74-.14-.36-.62-1.77.14-3.68 0 0 1.17-.37 3.84 1.43A13.38 13.38 0 0 1 16 8.73c1.19.01 2.38.16 3.5.47 2.67-1.8 3.84-1.43 3.84-1.43.76 1.91.28 3.32.14 3.68.9.97 1.44 2.22 1.44 3.74 0 5.36-3.27 6.54-6.39 6.89.5.43.95 1.29.95 2.6v3.86c0 .37.25.8.96.67A14.01 14.01 0 0 0 30 16C30 8.27 23.73 2 16 2Z" /></svg>
);
const NotionIcon = () => (
  <svg viewBox="0 0 32 32" className="w-5 h-5"><path d="M6.2 5.76c.88.72 1.22.66 2.88.56l15.66-.94c.33 0 .06-.33-.06-.38l-2.6-1.88c-.5-.38-1.16-.78-2.44-.67L4.98 3.6c-.55.06-.66.33-.44.55l1.66 1.6Z" fill="white" /><path d="M7.08 8.4v16.44c0 .88.44 1.22 1.44 1.16l17.22-1c1-.06 1.11-.61 1.11-1.27V7.36c0-.66-.27-1-.83-.94l-18 1.05c-.61.06-.94.4-.94 1Z" fill="white" /><path d="M23.18 9.12l-11.44.67v10.88l4.27-.25V14.3l3.95-.22v6.1l3.22-.19V9.12Z" fill="#1A1A1A" /></svg>
);

// ─── Testimonial card ─────────────────────────────────────────────────────────
const TestimonialCard: React.FC<{ t: typeof TESTIMONIALS[0] }> = ({ t }) => (
  <figure className="w-[272px] shrink-0 my-2 rounded-2xl border border-white/[0.07] bg-[#0a0a0a] p-5 flex flex-col gap-3 hover:border-white/[0.14] transition-colors cursor-default">
    <div className="flex gap-0.5">{Array.from({ length: t.stars }).map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-[#8B3DFF]" />)}</div>
    <blockquote className="text-[11px] text-gray-400 leading-relaxed flex-1">"{t.text}"</blockquote>
    <figcaption className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[10px] font-bold text-[#8B3DFF] shrink-0">{t.name[0]}</div>
      <div>
        <p className="text-[11px] font-semibold text-white leading-tight">{t.name}</p>
        <p className="text-[9px] text-gray-600">{t.role} · Early access user</p>
      </div>
    </figcaption>
  </figure>
);

// ─── Beam node ────────────────────────────────────────────────────────────────
const BeamNode = forwardRef<HTMLDivElement, { children: React.ReactNode; label: string; size?: "sm" | "md"; glow?: boolean }>(
  ({ children, label, size = "sm", glow = false }, ref) => (
    <div ref={ref} className="flex flex-col items-center gap-2">
      <div className={`${size === "md" ? "w-14 h-14" : "w-11 h-11"} rounded-full border-2 bg-[#0d0d0d] flex items-center justify-center shadow-xl ${glow ? "border-purple-500/50" : "border-white/10"}`} style={glow ? { boxShadow: "0 0 24px rgba(167,139,250,0.3)" } : {}}>
        {children}
      </div>
      <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest whitespace-nowrap">{label}</span>
    </div>
  )
);
BeamNode.displayName = "BeamNode";

// ─── Beam Diagram ─────────────────────────────────────────────────────────────
const BeamDiagram: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const jiraRef = useRef<HTMLDivElement>(null);
  const confRef = useRef<HTMLDivElement>(null);
  const slackRef = useRef<HTMLDivElement>(null);
  const ghRef = useRef<HTMLDivElement>(null);
  const notionRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const brdRef = useRef<HTMLDivElement>(null);
  const backlogRef = useRef<HTMLDivElement>(null);

  const sources = [
    { ref: jiraRef, icon: <JiraIcon />, label: "Jira" },
    { ref: confRef, icon: <ConfluenceIcon />, label: "Confluence" },
    { ref: slackRef, icon: <SlackIcon />, label: "Slack" },
    { ref: ghRef, icon: <GitHubIcon />, label: "GitHub" },
    { ref: notionRef, icon: <NotionIcon />, label: "Notion" },
  ];

  return (
    <div ref={containerRef} className="relative w-full max-w-[500px] h-[340px] flex items-center justify-between px-4">
      <div className="flex flex-col gap-4 z-10">
        {sources.map(({ ref, icon, label }) => <BeamNode key={label} ref={ref} label={label}>{icon}</BeamNode>)}
      </div>
      <div className="flex flex-col items-center gap-1 z-10">
        <BeamNode ref={centerRef} label="BAHub" size="md" glow>
          <img src={logo} alt="BAHub" className="w-7 h-7 object-contain" />
        </BeamNode>
      </div>
      <div className="flex flex-col gap-8 z-10">
        <BeamNode ref={brdRef} label="BRD / FRD"><FileText className="w-4 h-4 text-white/70" /></BeamNode>
        <BeamNode ref={backlogRef} label="Backlog"  ><GitBranch className="w-4 h-4 text-white/70" /></BeamNode>
      </div>
      {sources.map(({ ref, label }, i) => (
        <AnimatedBeam key={label} containerRef={containerRef} fromRef={ref} toRef={centerRef}
          curvature={[30, 15, 0, -15, -30][i]} duration={2.5} delay={i * 0.4}
          gradientStartColor="rgba(255,255,255,0.18)" gradientStopColor="rgba(255,255,255,0.03)" />
      ))}
      <AnimatedBeam containerRef={containerRef} fromRef={centerRef} toRef={brdRef} curvature={-20} duration={2.5} delay={0.2} gradientStartColor="rgba(255,255,255,0.18)" gradientStopColor="rgba(255,255,255,0.03)" />
      <AnimatedBeam containerRef={containerRef} fromRef={centerRef} toRef={backlogRef} curvature={20} duration={2.5} delay={0.9} gradientStartColor="rgba(255,255,255,0.18)" gradientStopColor="rgba(255,255,255,0.03)" />
    </div>
  );
};

// ─── Premium Glass Card with Cursor Glow ─────────────────────────────────────────
interface PremiumGlassCardProps extends React.ComponentPropsWithoutRef<typeof motion.div> {
  children: React.ReactNode;
  accentColor?: string;
}

export const PremiumGlassCard: React.FC<PremiumGlassCardProps> = ({
  children,
  className,
  accentColor,
  ...props
}) => {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.002 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative rounded-2xl border border-white/[0.08] bg-[#0a0a0a]/80 backdrop-blur-md overflow-hidden hover:border-white/[0.18] hover:shadow-2xl hover:shadow-black/70 transition-colors duration-300 ${className || ""}`}
      {...props}
    >
      {hovered && (
        <div
          className="absolute pointer-events-none transition-opacity duration-300 z-0"
          style={{
            width: "350px",
            height: "350px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.035) 0%, transparent 70%)",
            left: `${coords.x - 175}px`,
            top: `${coords.y - 175}px`,
            filter: "blur(30px)",
          }}
        />
      )}
      <div className="relative z-10 w-full h-full flex flex-col">
        {children}
      </div>
    </motion.div>
  );
};

// ─── Feature Showcase Component (Slanted Cards) ──────────────────────────────
export const FeatureShowcase: React.FC = () => {
  return (
    <div className="relative w-full overflow-hidden py-32 sm:py-48 z-20 flex items-center justify-center min-h-[1100px] bg-transparent">
      
      {/* Background ambient light */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(109,40,217,0.05)_0%,transparent_70%)]" />

      {/* Infinite Overflow Container */}
      <div className="absolute inset-0 flex items-center justify-center opacity-90 md:hover:opacity-100 transition-opacity duration-700 pointer-events-none w-full h-full">
        
        {/* Rotated Canvas Wrapper */}
        <div 
          className="flex gap-6 sm:gap-8 justify-center origin-center transform transition-transform duration-1000 ease-out rotate-[-12deg] scale-110 md:hover:scale-115 pointer-events-auto"
          style={{ width: "250vw" }}
        >
          {/* We repeat the columns to ensure it fills ultra-wide monitors */}
          {[...Array(3)].map((_, i) => (
            <React.Fragment key={i}>
              {/* Column 1 (Staggered up) */}
              <div className="flex flex-col gap-6 sm:gap-8 -mt-24 sm:-mt-32">
                <FeatureCard 
                  icon={<Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#8B3DFF]" />}
                  title="AI Requirements"
                  desc="Transform meeting transcripts into structured requirements with AI-powered extraction and categorization."
                  cta="Try AI Extraction"
                  ctaColor="text-[#8B3DFF]"
                  header={<RequirementsHeader />}
                />
                <FeatureCard 
                  icon={<Shield className="w-5 h-5 sm:w-6 sm:h-6 text-[#8B3DFF]" />}
                  title="Compliance Inspector"
                  desc="Automated compliance checks with SOC 2 audit trails and risk assessment workflows."
                  cta="View Compliance"
                  ctaColor="text-[#8B3DFF]"
                  header={<AuditHeader />}
                />
                <FeatureCard 
                  icon={<Folder className="w-5 h-5 sm:w-6 sm:h-6 text-[#8B3DFF]" />}
                  title="Artifact Repository"
                  desc="Centralized, version-controlled storage for all project artifacts and specifications."
                  cta="View Repo"
                  ctaColor="text-[#8B3DFF]"
                  header={<div className="w-full h-full bg-gradient-to-br from-[#1A1028] to-[#08080C] flex items-center justify-center"><Folder className="w-16 h-16 text-[#8B3DFF]/20" /></div>}
                />
              </div>

              {/* Column 2 (Center) */}
              <div className="flex flex-col gap-6 sm:gap-8 mt-12 sm:mt-16">
                <FeatureCard 
                  icon={<Workflow className="w-5 h-5 sm:w-6 sm:h-6 text-[#8B3DFF]" />}
                  title="BPMN Designer"
                  desc="Build interactive BPMN 2.0 process diagrams with drag-and-drop nodes and real-time collaboration."
                  cta="Explore Canvas"
                  ctaColor="text-[#8B3DFF]"
                  header={<DiagramHeader />}
                />
                <FeatureCard 
                  icon={<Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#8B3DFF]" />}
                  title="Stakeholder Portal"
                  desc="A dedicated zero-login portal for stakeholders to review, approve, and sign-off on requirements."
                  cta="View Portal"
                  ctaColor="text-[#8B3DFF]"
                  header={<AIHeader />}
                />
                <FeatureCard 
                  icon={<Activity className="w-5 h-5 sm:w-6 sm:h-6 text-[#8B3DFF]" />}
                  title="Traceability Matrix"
                  desc="Auto-generated, end-to-end trace matrix linking requirements to epics, stories, and tests."
                  cta="View Matrix"
                  ctaColor="text-[#8B3DFF]"
                  header={<RiskHeader />}
                />
                <FeatureCard 
                  icon={<ListChecks className="w-5 h-5 sm:w-6 sm:h-6 text-[#8B3DFF]" />}
                  title="Test Case Generator"
                  desc="AI automatically generates comprehensive test cases from your approved user stories."
                  cta="Generate Tests"
                  ctaColor="text-[#8B3DFF]"
                  header={<div className="w-full h-full bg-gradient-to-br from-[#1A1028] to-[#08080C] flex items-center justify-center"><ListChecks className="w-16 h-16 text-[#8B3DFF]/20" /></div>}
                />
              </div>

              {/* Column 3 (Staggered up) */}
              <div className="flex flex-col gap-6 sm:gap-8 -mt-12 sm:-mt-16">
                <FeatureCard 
                  icon={<FileText className="w-5 h-5 sm:w-6 sm:h-6 text-[#8B3DFF]" />}
                  title="BRD Generator"
                  desc="Compile IEEE-structured Business Requirements Documents with one-click PDF and Word export."
                  cta="Generate BRD"
                  ctaColor="text-[#8B3DFF]"
                  header={<BRDHeader />}
                />
                <FeatureCard 
                  icon={<GitBranch className="w-5 h-5 sm:w-6 sm:h-6 text-[#8B3DFF]" />}
                  title="AI User Stories"
                  desc="Generate Jira-ready user stories with acceptance criteria from requirements automatically."
                  cta="Create Stories"
                  ctaColor="text-[#8B3DFF]"
                  header={<StoriesHeader />}
                />
                <FeatureCard 
                  icon={<Clock className="w-5 h-5 sm:w-6 sm:h-6 text-[#8B3DFF]" />}
                  title="Version History"
                  desc="Time-travel through requirement changes with exact diffs and author attribution."
                  cta="View History"
                  ctaColor="text-[#8B3DFF]"
                  header={<div className="w-full h-full bg-gradient-to-br from-[#1A1028] to-[#08080C] flex items-center justify-center"><Clock className="w-16 h-16 text-[#6D28D9]/40" /></div>}
                />
              </div>

              {/* Column 4 (Staggered far down) */}
              <div className="flex flex-col gap-6 sm:gap-8 mt-32 sm:mt-48">
                <FeatureCard 
                  icon={<BarChart2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#8B3DFF]" />}
                  title="Jira Integration"
                  desc="Bidirectional sync with Jira for seamless workflow between BA and engineering teams."
                  cta="Connect Jira"
                  ctaColor="text-[#8B3DFF]"
                  header={<SwotHeader />}
                />
                <FeatureCard 
                  icon={<Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#8B3DFF]" />}
                  title="Mindmap Visualizer"
                  desc="Instantly convert complex requirement hierarchies into interactive, zoomable mindmaps."
                  cta="Visualize"
                  ctaColor="text-[#8B3DFF]"
                  header={<div className="w-full h-full bg-gradient-to-br from-[#1A1028] to-[#08080C] flex items-center justify-center"><Sparkles className="w-16 h-16 text-[#6D28D9]/40" /></div>}
                />
                <FeatureCard 
                  icon={<Lock className="w-5 h-5 sm:w-6 sm:h-6 text-[#8B3DFF]" />}
                  title="RBAC Security"
                  desc="Enterprise-grade role-based access control for granular permission management."
                  cta="Manage Access"
                  ctaColor="text-[#8B3DFF]"
                  header={<div className="w-full h-full bg-gradient-to-br from-[#1A1028] to-[#08080C] flex items-center justify-center"><Lock className="w-16 h-16 text-[#6D28D9]/40" /></div>}
                />
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, cta, ctaColor, header }: any) => (
  <div className="w-[300px] sm:w-[350px] lg:w-[420px] group relative h-[320px] sm:h-[380px] rounded-[2rem] overflow-hidden bg-[#12111A] border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 md:hover:-translate-y-4 hover:shadow-[0_30px_60px_rgba(139,61,255,0.15)] flex-shrink-0">
    <div className="absolute inset-x-0 -top-10 h-[65%] opacity-60 group-hover:opacity-100 pointer-events-none group-hover:scale-105 transition-all duration-700 ease-out origin-top flex items-center justify-center">
      {header}
    </div>
    <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 bg-gradient-to-t from-[#08080C] via-[#08080C]/95 to-transparent flex flex-col justify-end h-[60%] z-10">
       <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">{icon} {title}</h3>
       <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6 leading-relaxed line-clamp-2">{desc}</p>
       <button className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${ctaColor} flex items-center gap-2 group-hover:gap-4 transition-all w-fit bg-white/[0.03] hover:bg-white/[0.08] py-2 px-4 rounded-full border border-white/[0.05]`}>{cta} <ArrowRight className="w-3 h-3" /></button>
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin, onNavigateToRegister, onTryDemo }) => {
  const { waitlist_countdown_enabled } = usePublicSettings();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [yearly, setYearly] = useState(false);
  const [isExitIntentOpen, setIsExitIntentOpen] = useState(false);

  // Tagline rotating state
  const [taglineIndex, setTaglineIndex] = useState(0);
  const taglines = [
    "Software Requirements (SRS)",
    "System Architecture Docs",
    "API Contracts & Specs",
    "Jira-Ready User Stories",
    "BPMN Process Flows",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % taglines.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Cursor radial glow tracking
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Interactive Workspace Simulator state
  const [simTab, setSimTab] = useState<"chat" | "canvas" | "trace" | "doc">("chat");
  const [typedPrompt, setTypedPrompt] = useState("");
  const [aiReplyVisible, setAiReplyVisible] = useState(false);
  const [hoveredReq, setHoveredReq] = useState<string | null>(null);

  useEffect(() => {
    if (simTab !== "chat") {
      setTypedPrompt("");
      setAiReplyVisible(false);
      return;
    }

    const text = "Extract a process flow diagram and user stories from checkout meeting notes...";
    let i = 0;
    setTypedPrompt("");
    setAiReplyVisible(false);

    const timer = setInterval(() => {
      if (i < text.length) {
        setTypedPrompt((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
        setTimeout(() => setAiReplyVisible(true), 600);
      }
    }, 30);

    return () => clearInterval(timer);
  }, [simTab]);

  const col1 = TESTIMONIALS.slice(0, 4);
  const col2 = TESTIMONIALS.slice(2, 7);
  const col3 = TESTIMONIALS.slice(5, 10);

  // Exit intent event listener
  useEffect(() => {
    const handleExitIntent = () => setIsExitIntentOpen(true);
    window.addEventListener("show-exit-intent", handleExitIntent);
    return () => window.removeEventListener("show-exit-intent", handleExitIntent);
  }, []);

  return (
    <div className="min-h-screen bg-[#08080C] text-white font-sans selection:bg-purple-500/25 selection:text-white overflow-x-hidden antialiased">
      {/* Atmospheric orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-180px] left-[28%] w-[700px] h-[700px] rounded-full bg-purple-600/[0.07] blur-[140px]" />
        <div className="absolute top-[55%] right-[-80px] w-[500px] h-[500px] rounded-full bg-blue-600/[0.04] blur-[160px]" />
        <div className="absolute bottom-[5%] left-[-80px] w-[550px] h-[550px] rounded-full bg-violet-500/[0.03] blur-[180px]" />
      </div>
      <GridPattern />

      {/* ── NAVBAR ───────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 px-3 sm:px-4 pt-4">
        <nav className="max-w-[1380px] w-full mx-auto bg-[#08080C]/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl px-4 sm:px-6 md:px-10 lg:px-16 py-3 sm:py-4 flex items-center justify-between shadow-2xl shadow-black/60">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-white/[0.06] rounded-lg flex items-center justify-center border border-white/[0.10]">
              <img src={logo} alt="BAHub" className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-[10px] sm:text-[11px] tracking-widest uppercase text-white/90">BAHub</span>
              <span className="text-[6px] sm:text-[7px] font-bold text-[#8B3DFF] uppercase tracking-widest">Workspace Platform</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 sm:gap-6 text-[10px] sm:text-[11px] font-semibold tracking-wide text-gray-500">
            {["#features", "#workflow", "#in-action", "#pricing", "#testimonials", "#faq"].map(h => (
              <a key={h} href={h} className="hover:text-white transition-colors capitalize">{h.slice(1)}</a>
            ))}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button onClick={onNavigateToLogin} className="px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-semibold text-gray-500 hover:text-white transition-colors cursor-pointer">Sign In</button>
            <button onClick={onNavigateToRegister} className="px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold bg-white text-black hover:bg-gray-100 transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5">
              <span className="hidden sm:inline">Get Started</span>
              <span className="sm:hidden">Start</span>
              <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </button>
          </div>
        </nav>
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section
        onMouseMove={handleMouseMove}
        className="relative flex items-center justify-center mt-4 lg:mt-6 py-10 sm:py-16 px-4 sm:px-6 md:px-10 lg:px-16 max-w-[1380px] w-full mx-auto z-10 group overflow-visible rounded-3xl"
        style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.10) 0%, transparent 60%), #050505',
          boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05)'
        }}
      >
        {/* Spotlight overlay rays (very subtle) */}
        <div className="absolute top-0 inset-x-0 h-[500px] bg-[linear-gradient(to_bottom,rgba(139,92,246,0.02),transparent)] pointer-events-none z-0" />

        {/* Cursor tracking radial glow */}
        <div
          className="absolute pointer-events-none transition-opacity duration-500 opacity-0 group-hover:opacity-100 z-0"
          style={{
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)",
            left: `${mousePos.x - 250}px`,
            top: `${mousePos.y - 250}px`,
            filter: "blur(50px)",
          }}
        />

        {/* Mesh Gradient Wave Background */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-end justify-center">
          {/* Noise texture overlay for that premium grainy feel */}
          <div className="absolute inset-0 z-10 opacity-[0.12] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E")' }}></div>
          
          <svg className="w-[150%] h-[120%] min-w-[1200px] max-w-[2000px] opacity-60 translate-y-[10%]" viewBox="0 0 1200 800" preserveAspectRatio="none" fill="none">
            <defs>
              <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />      {/* Blue */}
                <stop offset="40%" stopColor="#8b5cf6" />     {/* Purple */}
                <stop offset="100%" stopColor="#d946ef" />    {/* Pink/Magenta */}
              </linearGradient>
              <filter id="hugeBlur" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="70" result="blur" />
              </filter>
            </defs>
            {/* Swooping wave path */}
            <path d="M -200 900 C 200 900, 350 150, 700 350 C 1050 550, 1100 -50, 1500 150 L 1500 1200 L -200 1200 Z" fill="url(#waveGrad)" filter="url(#hugeBlur)" />
          </svg>
        </div>

        <div className="flex flex-col items-center text-center max-w-4xl mx-auto relative z-10 w-full my-0 sm:my-4 px-2">
          {/* Announcement Badge */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-4 sm:mb-6 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-white/40">BAHub Platform</span>
            <span className="text-white/20">·</span>
            <span className="text-white/80">AI-Powered BA Workspace</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-7xl xl:text-[84px] font-black tracking-tight leading-[1.05] sm:leading-[1.05] mb-3 sm:mb-4 flex flex-col items-center text-center w-full"
          >
            <span className="text-white drop-shadow-sm">
              Ship traceable
            </span>
            <span className="h-[40px] sm:h-[58px] lg:h-[80px] xl:h-[94px] relative overflow-hidden block w-full text-center py-1">
              <AnimatePresence mode="wait">
                <motion.span
                  key={taglineIndex}
                  initial={{ y: 40, opacity: 0, filter: "blur(8px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  exit={{ y: -40, opacity: 0, filter: "blur(8px)" }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-x-0 block text-center bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent font-black text-2xl sm:text-4xl lg:text-6xl xl:text-[84px]"
                >
                  {taglines[taglineIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
            <span className="text-white drop-shadow-sm">
              in under 10 minutes.
            </span>
          </motion.h1>

          {/* Paragraph */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="text-gray-400/80 text-sm sm:text-base lg:text-[19px] leading-relaxed mb-6 sm:mb-8 max-w-[640px] mx-auto text-center font-normal tracking-wide px-4"
          >
            Paste meeting notes. Get SRS documents, system architecture diagrams, user stories, API contracts, and a Jira-ready backlog — <span className="text-white/80 font-medium">all linked, all traceable.</span>
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className="flex flex-col sm:flex-wrap items-center justify-center gap-3 sm:gap-6 mb-8 sm:mb-10 w-full px-4"
          >
            {/* Primary CTA */}
            <button
              onClick={onNavigateToRegister}
              className="group relative w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-[12px] sm:text-[13px] font-bold tracking-wide bg-white text-black hover:bg-white/90 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(255,255,255,0.12)] overflow-hidden min-h-[48px]"
            >
              {/* Shine reflection effect */}
              <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full transition-transform duration-1000 ease-out group-hover:translate-x-[300%]" />
              <span className="hidden sm:inline">Generate Your First SRS in 60 Seconds →</span>
              <span className="sm:hidden">Generate SRS →</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" />
            </button>

            {/* Try Demo CTA */}
            <button
              onClick={onTryDemo}
              className="group w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-[12px] sm:text-[13px] font-semibold tracking-wide border border-white/[0.08] text-white/80 hover:text-white hover:bg-white/[0.04] hover:border-white/[0.18] active:scale-95 transition-all cursor-pointer bg-[#12111A]/40 backdrop-blur-md flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8B3DFF] group-hover:text-purple-300 transition-colors" />
              Try Demo
            </button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 px-4"
          >
            {[
              { icon: <Shield className="w-3 h-3 text-white/30" />, text: "Audit Trails" },
              { icon: <Zap className="w-3 h-3 text-white/30" />, text: "Real-time Sync" },
              { icon: <Users className="w-3 h-3 text-white/30" />, text: "Team Workspaces" },
              { icon: <Clock className="w-3 h-3 text-white/30" />, text: "SOC 2 Audit Logs" },
            ].map(p => (
              <div
                key={p.text}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.05] bg-white/[0.02] backdrop-blur-xl shadow-inner shadow-white/5 text-[11px] font-semibold text-white/60 select-none hover:border-white/[0.12] hover:text-white/80 transition-all duration-300"
              >
                {p.icon}
                <span>{p.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Customer Logos - Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-6 sm:mt-8 w-full max-w-5xl mx-auto"
          >
            <p className="text-center text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-8">
              Trusted by business analysts at
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {CUSTOMER_LOGOS.map((logo, i) => (
                <motion.div
                  key={logo.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300"
                >
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${logo.gradient}`} />
                  <span className="text-[11px] font-semibold text-white/50 hover:text-white/70 transition-colors">
                    {logo.name}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {waitlist_countdown_enabled && <LaunchCountdown />}

      {/* ── SOCIAL PROOF BAR ─────────────────────────────────────────────────── */}
      <section className="py-[120px] border-t border-b border-white/[0.05]">
        <div className="max-w-[1380px] w-full mx-auto px-6 md:px-10 lg:px-16 flex flex-col items-center gap-8">
          <p className="text-[9px] font-bold text-gray-700 uppercase tracking-[0.2em]">Built for Business Analysts</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center w-full">
            {[
              { value: "17", label: "Integrated Modules", color: "text-[#8B3DFF]" },
              { value: "4× faster", label: "BRD vs. Manual", color: "text-[#8B3DFF]" },
              { value: "AI-Native", label: "Gemini-Powered", color: "text-green-400" },
              { value: "Free Trial", label: "No Credit Card", color: "text-[#8B3DFF]" },
            ].map(s => (
              <div key={s.label} className="flex flex-col gap-2">
                <span className={`text-3xl md:text-4xl font-extrabold tracking-tight ${s.color}`}>{s.value}</span>
                <span className="text-[10px] font-medium text-gray-600">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section id="workflow" className="py-[160px] px-6 md:px-10 lg:px-16 max-w-[1380px] w-full mx-auto z-10 relative">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-gray-950/50 text-[10px] font-bold uppercase tracking-wider text-[#8B3DFF] mb-6">
            Workflow
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-6">
            From conversation to<br /><span className="text-gradient-blue-purple">shipped spec in minutes</span>
          </h2>
          <p className="text-gray-500 text-sm max-w-[650px] mx-auto leading-relaxed">BAHub collapses the typical 3-week BA cycle into a single traceable workflow.</p>
        </div>
        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Connector line */}
          <div className="hidden md:block absolute top-[22px] left-[14%] right-[14%] h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
          {HOW_IT_WORKS.map((item, i) => (
            <motion.div key={item.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center text-center gap-5 relative">
              {/* Step node */}
              <div className="relative w-11 h-11 rounded-full border border-white/[0.08] bg-[#0d0d0d] flex items-center justify-center z-10">
                {item.icon}
                <span className="absolute -top-2 -right-2 text-[8px] font-black text-white/20 tracking-widest">{item.step}</span>
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="font-semibold text-[13px] text-white/90 tracking-tight">{item.title}</h4>
                <p className="text-[11px] text-gray-600 leading-relaxed max-w-[240px] mx-auto">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── SEE BAHUB IN ACTION ───────────────────────────────────────────────── */}
      <section id="in-action" className="pt-[160px] w-full z-10 relative bg-[#08080C] border-t border-b border-white/[0.02] overflow-hidden">
        <div className="text-center mb-20 max-w-[1380px] mx-auto px-6 md:px-10 lg:px-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-gray-950/50 text-[10px] font-bold uppercase tracking-wider text-[#8B3DFF] mb-6">
            See BAHub in Action
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
            Every Business Process.<br /><span className="text-gradient-emerald-blue">One AI Workspace.</span>
          </h2>
          <p className="text-gray-500 text-sm max-w-[650px] mx-auto leading-relaxed">Scroll to explore how each module transforms your workflow with AI-powered automation.</p>
        </div>

        <FeatureShowcase />
      </section>

      {/* ── SANDBOX ──────────────────────────────────────────────────────────── */}
      <section id="sandbox" className="py-[160px] px-6 md:px-10 lg:px-16 max-w-[1380px] w-full mx-auto z-10 relative bg-[#08080C] border-t border-b border-white/[0.02]">
        <div className="text-center mb-20 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-gray-950/50 text-[10px] font-bold uppercase tracking-wider text-[#8B3DFF] mb-6">
            Interactive Workspace Preview
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
            See the <span className="text-gradient-blue-purple">full workspace</span> in action
          </h2>
          <p className="text-gray-500 text-sm max-w-[650px] mx-auto leading-relaxed">Toggle between the platform modules to preview how BAHub connects AI, diagrams, matrices, and specs.</p>
        </div>

        {/* Tabs navigation */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {[
            { id: "chat", label: "AI Chat", icon: <Sparkles className="w-3 h-3" /> },
            { id: "canvas", label: "Workflow Canvas", icon: <Workflow className="w-3 h-3" /> },
            { id: "trace", label: "Traceability", icon: <GitBranch className="w-3 h-3" /> },
            { id: "doc", label: "BRD Sheet", icon: <FileText className="w-3 h-3" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSimTab(tab.id as "chat" | "canvas" | "trace" | "doc")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${simTab === tab.id
                ? "bg-white/[0.07] border border-white/[0.18] text-white"
                : "border border-transparent text-gray-600 hover:text-gray-400 hover:border-white/[0.06]"
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full rounded-3xl overflow-hidden shadow-2xl border relative my-[80px]" style={{ background: '#0a0a0a', borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#08080C]/70 relative z-10">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              <span className="text-[9px] font-mono ml-3 text-gray-600">
                bahub.app — {simTab === "chat" ? "AI Chat" : simTab === "canvas" ? "Process Canvas" : simTab === "trace" ? "Trace Matrix" : "Compiled BRD"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[8px] font-bold text-gray-700 uppercase tracking-widest">Active Simulator</span>
            </div>
          </div>

          <div className="relative w-full overflow-hidden bg-[#050505]">
            <AnimatePresence mode="wait">
              {simTab === "chat" && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="p-6 flex flex-col gap-4 font-sans h-[350px] overflow-y-auto"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-[10px] text-gray-400 font-bold shrink-0">U</div>
                    <div className="bg-[#111] border border-white/[0.06] rounded-2xl rounded-tl-none px-4 py-2.5 text-xs text-white max-w-[80%]">
                      <span className="font-mono">{typedPrompt}</span>
                      {typedPrompt.length < 75 && (
                        <span className="w-1.5 h-3.5 bg-purple-400 inline-block animate-pulse ml-0.5" />
                      )}
                    </div>
                  </div>

                  {aiReplyVisible && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-[10px] text-[#8B3DFF] font-bold shrink-0">AI</div>
                      <div className="bg-purple-950/20 border border-purple-500/15 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-gray-300 max-w-[85%] flex flex-col gap-2">
                        <p className="font-semibold text-[11px] text-purple-300">✨ Generated Specification Summary</p>
                        <div className="bg-[#08080C]/40 border border-white/[0.04] p-3 rounded-lg flex flex-col gap-1.5 font-mono text-[10px] text-left">
                          <p><span className="text-[#8B3DFF]">1. Requirement</span> REQ-001: Stripe Subscription Management</p>
                          <p><span className="text-[#8B3DFF]">2. User Story</span> US-010: As an admin I want to purchase...</p>
                          <p><span className="text-[#8B3DFF]">3. Process Flow</span> BPMN checkout generated and traced.</p>
                        </div>
                        <p className="text-[10px] text-gray-500">I have also populated the traceability matrix and linked the corresponding risk profile (RSK-04).</p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {simTab === "canvas" && (
                <motion.div
                  key="canvas"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="p-4 flex items-center justify-center h-[350px] overflow-hidden bg-[#050505]"
                >
                  <svg className="w-full max-w-[550px] h-[300px] border border-white/[0.04] rounded-xl p-4 bg-[#0a0a0a]" viewBox="0 0 600 300">
                    <defs>
                      <pattern id="svg-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#svg-grid)" />

                    {/* Flow nodes */}
                    <g transform="translate(30, 120)">
                      <rect width="100" height="40" rx="8" fill="#111" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                      <text x="50" y="24" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold" fontFamily="monospace">1. Client Call</text>
                    </g>
                    <g transform="translate(190, 120)">
                      <rect width="110" height="40" rx="8" fill="#1b122b" stroke="rgba(168,85,247,0.4)" strokeWidth="1.5" />
                      <text x="55" y="24" textAnchor="middle" fill="#c084fc" fontSize="9" fontWeight="bold" fontFamily="monospace">2. AI Synthesizer</text>
                    </g>
                    <g transform="translate(360, 60)">
                      <rect width="100" height="40" rx="8" fill="#111" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                      <text x="50" y="24" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold" fontFamily="monospace">3a. BPMN Flow</text>
                    </g>
                    <g transform="translate(360, 180)">
                      <rect width="100" height="40" rx="8" fill="#111" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                      <text x="50" y="24" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold" fontFamily="monospace">3b. User Stories</text>
                    </g>
                    <g transform="translate(500, 120)">
                      <rect width="90" height="40" rx="8" fill="#0b1b17" stroke="rgba(16,185,129,0.4)" strokeWidth="1.5" />
                      <text x="45" y="24" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="bold" fontFamily="monospace">4. Push to Jira</text>
                    </g>

                    {/* Connectors */}
                    <path d="M 130 140 L 190 140" fill="none" stroke="rgba(168,85,247,0.4)" strokeWidth="1.5" strokeDasharray="5,5" className="animate-flow-dash" />
                    <path d="M 300 140 L 330 140 L 330 80 L 360 80" fill="none" stroke="rgba(168,85,247,0.4)" strokeWidth="1.5" strokeDasharray="5,5" className="animate-flow-dash" />
                    <path d="M 300 140 L 330 140 L 330 200 L 360 200" fill="none" stroke="rgba(168,85,247,0.4)" strokeWidth="1.5" strokeDasharray="5,5" className="animate-flow-dash" />
                    <path d="M 460 80 L 485 80 L 485 140 L 500 140" fill="none" stroke="rgba(52,211,153,0.4)" strokeWidth="1.5" strokeDasharray="5,5" className="animate-flow-dash" />
                    <path d="M 460 200 L 485 200 L 485 140 L 500 140" fill="none" stroke="rgba(52,211,153,0.4)" strokeWidth="1.5" strokeDasharray="5,5" className="animate-flow-dash" />
                  </svg>
                </motion.div>
              )}

              {simTab === "trace" && (
                <motion.div
                  key="trace"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="p-6 flex flex-col justify-between h-[350px] bg-[#070707] font-sans text-left"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Hover a Requirement to view linked objects</span>
                    <span className="text-[9px] bg-purple-600/10 border border-purple-500/20 text-[#8B3DFF] font-bold px-2 py-0.5 rounded">Trace Map</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 flex-1">
                    {/* Requirements side */}
                    <div className="flex flex-col gap-2">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Requirements</h4>
                      {[
                        { id: "req-1", code: "REQ-001", title: "OAuth Authentication Setup" },
                        { id: "req-2", code: "REQ-002", title: "Stripe Payment Gateway" },
                        { id: "req-3", code: "REQ-003", title: "Workspace Activity Auditing" },
                      ].map((r) => (
                        <div
                          key={r.id}
                          onMouseEnter={() => setHoveredReq(r.id)}
                          onMouseLeave={() => setHoveredReq(null)}
                          className={`p-3 rounded-xl border text-[11px] transition-all duration-300 cursor-pointer ${hoveredReq === r.id
                            ? "bg-purple-950/20 border-purple-500 text-white shadow-[0_0_15px_rgba(139,61,255,0.15)]"
                            : "bg-white/[0.02] border-white/[0.06] text-gray-400 hover:border-white/10"
                            }`}
                        >
                          <span className="font-mono font-bold text-[10px] text-[#8B3DFF] mr-2">{r.code}</span>
                          {r.title}
                        </div>
                      ))}
                    </div>

                    {/* Linked Objects side */}
                    <div className="flex flex-col gap-2">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Linked Backlog & Risks</h4>
                      {[
                        { id: "us-1", linkedTo: "req-1", code: "US-010", type: "STORY", title: "As a user, I want to login with GitHub" },
                        { id: "us-2", linkedTo: "req-2", code: "US-011", type: "STORY", title: "As an admin, I want to choose a plan" },
                        { id: "rsk-1", linkedTo: "req-3", code: "RSK-04", type: "RISK", title: "Failure to log critical config mutations" },
                      ].map((item) => {
                        const isLinked = hoveredReq === item.linkedTo;
                        return (
                          <div
                            key={item.id}
                            className={`p-3 rounded-xl border text-[11px] transition-all duration-300 ${isLinked
                              ? "bg-blue-950/20 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.15)] scale-[1.02]"
                              : "bg-white/[0.01] border-white/[0.04] text-gray-600"
                              }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`font-mono font-bold text-[9px] ${isLinked ? "text-[#8B3DFF]" : "text-gray-500"}`}>{item.code}</span>
                              <span className={`text-[8px] font-black tracking-widest ${item.type === "RISK" ? "text-[#8B3DFF]/80" : "text-green-400/80"}`}>{item.type}</span>
                            </div>
                            <p className="line-clamp-1">{item.title}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {simTab === "doc" && (
                <motion.div
                  key="doc"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="p-6 flex flex-col h-[350px] overflow-y-auto bg-white text-gray-900 text-left font-serif"
                >
                  {/* Page Header */}
                  <div className="text-center border-b-2 border-gray-900 pb-2 mb-3">
                    <h1 className="text-[14px] font-bold uppercase tracking-wider font-sans text-gray-900 leading-tight">Software Requirements Specification (SRS)</h1>
                    <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mt-0.5">Project: BAHub Checkout Engine</p>
                  </div>

                  {/* Document Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[9px] mb-4 font-sans text-gray-600">
                    <div>
                      <p><span className="font-bold text-gray-800">Author:</span> Senior AI Analyst</p>
                      <p><span className="font-bold text-gray-800">Created Date:</span> July 2026</p>
                    </div>
                    <div className="text-right">
                      <p><span className="font-bold text-gray-800">Version:</span> v1.2.0-approved</p>
                      <p><span className="font-bold text-gray-800">Status:</span> APPROVED & SIGNED-OFF</p>
                    </div>
                  </div>

                  {/* Section Title */}
                  <h3 className="text-[10px] font-bold font-sans uppercase border-b border-gray-300 pb-1 mb-2 text-gray-850">1. Functional Specifications</h3>
                  <table className="w-full text-left border-collapse text-[9px] font-sans mb-3 text-gray-800">
                    <thead>
                      <tr className="border-b border-gray-900 bg-gray-50 text-gray-700">
                        <th className="py-1 px-1 font-bold">ID</th>
                        <th className="py-1 px-1 font-bold">Req Description</th>
                        <th className="py-1 px-1 font-bold">Priority</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="py-1 px-1 font-mono text-purple-700 font-bold">REQ-001</td>
                        <td className="py-1 px-1">Organization-based auth boundaries.</td>
                        <td className="py-1 px-1 font-bold text-red-600 text-[8px] uppercase">CRITICAL</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-1 px-1 font-mono text-purple-700 font-bold">REQ-002</td>
                        <td className="py-1 px-1">Interactive credit validation and webhook processing.</td>
                        <td className="py-1 px-1 font-bold text-amber-600 text-[8px] uppercase">HIGH</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Sign-off Authorization */}
                  <h3 className="text-[10px] font-bold font-sans uppercase border-b border-gray-300 pb-1 mb-2 text-gray-850">2. Sign-off Authorization</h3>
                  <div className="grid grid-cols-2 gap-4 text-[8px] font-sans pt-1">
                    <div className="border border-dashed border-gray-300 p-2 rounded bg-gray-50">
                      <p className="font-bold text-gray-800">Priya Sharma (Lead BA)</p>
                      <p className="text-[7.5px] text-gray-500">Sign-off: APPROVED · 2026-07-06</p>
                    </div>
                    <div className="border border-dashed border-gray-300 p-2 rounded bg-gray-50">
                      <p className="font-bold text-gray-850">Alex Chen (Product Manager)</p>
                      <p className="text-[7.5px] text-gray-500">Sign-off: APPROVED · 2026-07-07</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>


      {/* ── INTEGRATIONS ─────────────────────────────────────────────────────── */}
      <section id="integrations" className="py-[160px] border-t border-b border-white/[0.04] bg-[#08080C]">
        <div className="max-w-[1380px] w-full mx-auto px-6 md:px-10 lg:px-16 flex flex-col lg:flex-row items-center gap-24 text-left">
          <div className="flex-1 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-gray-950/50 text-[10px] font-bold uppercase tracking-wider text-[#8B3DFF] self-start mb-2">
              Engineering Sync
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
              Bi-directional sync with<br /><span className="text-gradient-blue-purple">your existing stack</span>
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed max-w-[650px] mb-4">
              Write specs, draw process diagrams, and watch everything sync to Jira, Confluence, and GitHub automatically — no disruption to your engineering team.
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              {["Jira Bidirectional", "Confluence Push", "BPMN 2.0 XML", "PlantUML", "Mermaid.js", "Draw.io XML"].map(tag => (
                <span key={tag} className="text-[9px] font-bold bg-white/[0.04] border border-white/[0.07] text-gray-400 px-3 py-1 rounded-full uppercase tracking-wider">{tag}</span>
              ))}
            </div>
          </div>
          <div className="flex-1 w-full flex items-center justify-center">
            <BeamDiagram />
          </div>
        </div>
      </section>

      {/* ── MORE PLATFORM CAPABILITIES ───────────────────────────────────────── */}
      <section className="py-[160px] px-6 md:px-10 lg:px-16 max-w-[1380px] w-full mx-auto z-10 relative bg-[#08080C]">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-gray-950/50 text-[10px] font-bold uppercase tracking-wider text-violet-400 mb-6">
            Also in the platform
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-6">
            Everything else you need<br /><span className="text-gradient-blue-purple">in one workspace</span>
          </h2>
        </div>

        {/* Row 1 — Stakeholder Matrix + Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Stakeholder Power/Interest Matrix */}
          <PremiumGlassCard className="h-full">
            <div className="px-8 pt-8 pb-6 border-b border-white/[0.05]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5 text-white/50" />
                </div>
                <div>
                  <h3 className="font-bold text-[13px] text-white leading-none">Stakeholder Power / Interest Matrix</h3>
                  <p className="text-[11px] text-gray-600 mt-1">Map every stakeholder into 4 strategic quadrants</p>
                </div>
              </div>
            </div>
            <div className="p-8 grid grid-cols-2 gap-3">
              {[
                { q: "High Power · High Interest", label: "Manage Closely", names: ["CEO", "Product Owner"] },
                { q: "High Power · Low Interest", label: "Keep Satisfied", names: ["Legal Dept", "Board Sponsor"] },
                { q: "Low Power · High Interest", label: "Keep Informed", names: ["QA Engineer", "End User"] },
                { q: "Low Power · Low Interest", label: "Monitor", names: ["External Auditor"] },
              ].map((cell, i) => (
                <div key={cell.label} className={`rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col gap-3 hover:border-white/[0.12] hover:bg-white/[0.03] transition-all duration-200 ${i === 0 ? "border-white/[0.10]" : ""}`}>
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-gray-600">{cell.q}</p>
                    <p className="text-[11px] font-semibold text-white/90 mt-1">{cell.label}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cell.names.map(n => (
                      <span key={n} className="text-[9px] bg-white/[0.04] border border-white/[0.07] text-gray-500 px-2 py-0.5 rounded-md font-medium">{n}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </PremiumGlassCard>

          {/* Reports & Analytics */}
          <PremiumGlassCard className="h-full">
            <div className="px-8 pt-8 pb-6 border-b border-white/[0.05]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                  <BarChart2 className="w-3.5 h-3.5 text-white/50" />
                </div>
                <div>
                  <h3 className="font-bold text-[13px] text-white leading-none">Reports &amp; Analytics Dashboard</h3>
                  <p className="text-[11px] text-gray-600 mt-1">Live metrics across all project modules</p>
                </div>
              </div>
            </div>
            <div className="p-8 flex flex-col gap-5">
              {[
                { label: "Requirements Pipeline", a: 72, b: 18, c: 10, vals: "72 / 18 / 10" },
                { label: "User Stories Sprint", a: 58, b: 24, c: 18, vals: "58 / 24 / 18" },
                { label: "Risk Register", a: 45, b: 35, c: 20, vals: "45 / 35 / 20" },
                { label: "Change Requests", a: 60, b: 25, c: 15, vals: "60 / 25 / 15" },
              ].map(row => (
                <div key={row.label} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-medium text-gray-500">{row.label}</span>
                    <span className="text-[10px] font-mono text-gray-700">{row.vals}</span>
                  </div>
                  <div className="w-full h-1 bg-white/[0.05] rounded-full overflow-hidden flex gap-px">
                    <div className="h-full bg-white/60 rounded-l-full transition-all" style={{ width: `${row.a}%` }} />
                    <div className="h-full bg-white/20 transition-all" style={{ width: `${row.b}%` }} />
                    <div className="h-full bg-white/[0.08] rounded-r-full transition-all" style={{ width: `${row.c}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </PremiumGlassCard>
        </div>

        {/* Row 2 — Sector Templates + RBAC + Projects & Teams */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* 16 Sector Templates */}
          <PremiumGlassCard className="p-8 h-full">
            <div className="flex items-center gap-3 mb-7">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                <Layers className="w-3.5 h-3.5 text-white/50" />
              </div>
              <div>
                <h3 className="font-bold text-[13px] text-white leading-none">16 Sector Templates</h3>
                <p className="text-[10px] text-gray-600 mt-1">Pre-built industry starter canvases</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["E-Commerce", "Banking", "Healthcare", "ERP", "CRM", "HRMS", "Insurance", "Education", "Government", "Inventory", "Payment Gateway", "Loyalty", "Supply Chain", "Hotel Mgmt", "Hospital", "Custom"].map(t => (
                <span key={t} className="text-[8px] font-semibold bg-white/[0.03] border border-white/[0.06] text-gray-600 px-2 py-0.5 rounded-md tracking-wide hover:text-gray-400 hover:border-white/[0.10] transition-colors cursor-default">{t}</span>
              ))}
            </div>
          </PremiumGlassCard>

          {/* RBAC */}
          <PremiumGlassCard className="p-8 h-full">
            <div className="flex items-center gap-3 mb-7">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                <Lock className="w-3.5 h-3.5 text-white/50" />
              </div>
              <div>
                <h3 className="font-bold text-[13px] text-white leading-none">Role-Based Access Control</h3>
                <p className="text-[10px] text-gray-600 mt-1">Custom roles with granular permissions</p>
              </div>
            </div>
            <div className="flex flex-col divide-y divide-white/[0.04]">
              {[
                { role: "Admin", perms: "Full Access · Billing · Audit Logs" },
                { role: "Business Analyst", perms: "Create Reqs · Generate BRD · AI Chat" },
                { role: "Developer", perms: "View Canvas · Edit Stories" },
                { role: "Custom Role", perms: "Define any permission set" },
              ].map(r => (
                <div key={r.role} className="flex items-baseline gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="text-[10px] font-semibold text-white/70 w-28 shrink-0">{r.role}</span>
                  <span className="text-[9px] text-gray-600 leading-relaxed">{r.perms}</span>
                </div>
              ))}
            </div>
          </PremiumGlassCard>

          {/* Projects & Teams */}
          <PremiumGlassCard className="p-8 h-full">
            <div className="flex items-center gap-3 mb-7">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                <Folder className="w-3.5 h-3.5 text-white/50" />
              </div>
              <div>
                <h3 className="font-bold text-[13px] text-white leading-none">Projects &amp; Teams</h3>
                <p className="text-[10px] text-gray-600 mt-1">Multi-project workspace with member roles</p>
              </div>
            </div>
            <div className="flex flex-col divide-y divide-white/[0.04]">
              {[
                { icon: <Layers className="w-3 h-3" />, label: "Unlimited projects per workspace" },
                { icon: <UserCheck className="w-3 h-3" />, label: "Teams with assigned leads & members" },
                { icon: <Activity className="w-3 h-3" />, label: "Project context scopes all modules" },
                { icon: <Paperclip className="w-3 h-3" />, label: "File attachments per project" },
                { icon: <ListChecks className="w-3 h-3" />, label: "Per-project activity log timeline" },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0">
                  <span className="text-white/20 shrink-0">{f.icon}</span>
                  <span className="text-[10px] text-gray-600">{f.label}</span>
                </div>
              ))}
            </div>
          </PremiumGlassCard>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-[160px] relative overflow-hidden bg-[#08080C]">
        <div className="max-w-[1380px] w-full mx-auto px-6 md:px-10 lg:px-16 text-center mb-20 relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-gray-950/50 text-[10px] font-bold uppercase tracking-wider text-[#8B3DFF] mb-6">
            <Star className="w-3 h-3 fill-amber-400" /> Customer Reviews
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-6">
            Loved by <span className="text-gradient-blue-purple">Business Analysts</span>
          </h2>
          <p className="text-gray-500 text-sm max-w-[650px] mx-auto leading-relaxed">Join thousands of BAs replacing fragmented tools with one traceable workspace.</p>
        </div>
        <div className="relative flex h-[560px] w-full flex-row items-center justify-center gap-4 overflow-hidden [perspective:300px]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 z-10" style={{ background: "linear-gradient(to bottom,#000,transparent)" }} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 z-10" style={{ background: "linear-gradient(to top,#000,transparent)" }} />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-20 z-10" style={{ background: "linear-gradient(to right,#000,transparent)" }} />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-20 z-10" style={{ background: "linear-gradient(to left,#000,transparent)" }} />
          <div className="flex flex-row items-center gap-4" style={{ transform: "translateX(-100px) translateZ(-50px) rotateX(20deg) rotateY(-8deg) rotateZ(20deg)" }}>
            <Marquee vertical pauseOnHover style={{ "--duration": "22s" } as React.CSSProperties} className="h-[560px]">
              {col1.map(t => <TestimonialCard key={t.name} t={t} />)}
            </Marquee>
            <Marquee vertical reverse pauseOnHover style={{ "--duration": "28s" } as React.CSSProperties} className="h-[560px]">
              {col2.map(t => <TestimonialCard key={t.name} t={t} />)}
            </Marquee>
            <Marquee vertical pauseOnHover style={{ "--duration": "24s" } as React.CSSProperties} className="h-[560px]">
              {col3.map(t => <TestimonialCard key={t.name} t={t} />)}
            </Marquee>
            <div className="hidden xl:flex">
              <Marquee vertical reverse pauseOnHover style={{ "--duration": "26s" } as React.CSSProperties} className="h-[560px]">
                {TESTIMONIALS.slice(1, 5).map(t => <TestimonialCard key={t.name} t={t} />)}
              </Marquee>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-[160px] px-6 md:px-10 lg:px-16 max-w-[1380px] w-full mx-auto text-center z-10 relative bg-[#08080C]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-gray-950/50 text-[10px] font-bold uppercase tracking-wider text-green-400 mb-6">
          Pricing
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
          Simple, transparent <span className="text-gradient-blue-purple">pricing</span>
        </h2>
        <p className="text-gray-500 text-sm max-w-[650px] mx-auto mb-16 leading-relaxed">No hidden fees. Upgrade or downgrade any time.</p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-20">
          <span className={`text-[11px] font-semibold transition-colors ${!yearly ? "text-white" : "text-gray-600"}`}>Monthly</span>
          <button onClick={() => setYearly(v => !v)}
            className="w-12 h-6 rounded-full relative border border-white/[0.10] cursor-pointer transition-colors"
            style={{ background: yearly ? "rgba(124,58,237,0.6)" : "#111" }}>
            <div className={`w-4 h-4 rounded-full absolute top-0.5 transition-all duration-300 ${yearly ? "left-[26px] bg-white" : "left-0.5 bg-gray-500"}`} />
          </button>
          <span className={`text-[11px] font-semibold flex items-center gap-1.5 transition-colors ${yearly ? "text-white" : "text-gray-600"}`}>
            Annual
            <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25">Save 20%</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {PRICING.map((plan) => {
            const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
            const isPopular = plan.badge === "Most Popular";
            return (
              <motion.div key={plan.name} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className={`relative rounded-3xl border ${plan.color} p-[36px] flex flex-col justify-between text-left overflow-hidden ${isPopular ? "" : "bg-[#0a0a0a]"}`}
                style={isPopular ? { background: "linear-gradient(135deg,rgba(124,58,237,0.15) 0%,rgba(109,40,217,0.20) 100%)" } : {}}>
                {isPopular && <Meteors number={10} />}
                {plan.badge && (
                  <div className="absolute top-0 right-0 text-[7.5px] font-black uppercase px-3 py-1.5 rounded-bl-xl tracking-widest z-10 bg-purple-500 text-white">
                    {plan.badge}
                  </div>
                )}
                <div className="flex flex-col gap-5 relative z-10">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{plan.name}</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className={`text-4xl font-black ${isPopular ? "text-purple-200" : "text-white"}`}>
                        {price === 0 ? "Free" : `$${price}`}
                      </span>
                      {price > 0 && <span className="text-[11px] text-gray-600 font-medium">/ mo{yearly ? " · billed yearly" : ""}</span>}
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-2">{plan.desc}</p>
                  </div>
                  <div className="border-t border-white/[0.07] pt-4 flex flex-col gap-2.5">
                    {plan.features.map(f => (
                      <div key={f.text} className={`flex items-start gap-2 text-[11px] ${f.ok ? (isPopular ? "text-gray-300" : "text-gray-400") : "text-gray-700 line-through"}`}>
                        {f.ok
                          ? <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isPopular ? "text-green-400" : "text-green-500"}`} />
                          : <X className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-700" />
                        }
                        <span>{f.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={onNavigateToRegister} className={`w-full mt-8 py-2.5 px-4 rounded-xl text-[11px] font-bold text-center transition-all cursor-pointer uppercase tracking-wider relative z-10 flex items-center justify-center gap-2 ${plan.ctaStyle}`}>
                  {plan.cta} <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </div>
        <p className="text-[10px] text-gray-700 mt-8">Free Starter requires no credit card. Workspace Admin required to upgrade plans.</p>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-[140px] px-6 md:px-10 lg:px-16 border-t border-white/[0.05] bg-[#08080C]">
        <div className="max-w-[1380px] w-full mx-auto grid lg:grid-cols-[1fr_1.6fr] gap-24 items-start">
          {/* Left panel */}
          <div className="flex flex-col gap-8 lg:sticky lg:top-28">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-gray-950/50 text-[10px] font-bold uppercase tracking-wider text-gray-400 self-start">FAQ</div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Frequently asked<br /><span className="text-gradient-blue-purple">questions</span>
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed max-w-[650px]">Can't find what you're looking for? Reach out directly.</p>
            <a href="mailto:support@bahub.app" className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl border border-white/[0.10] bg-white/[0.03] text-[11px] font-semibold text-gray-400 hover:text-white hover:border-white/20 transition-all w-fit">
              support@bahub.app <ArrowRight className="w-3.5 h-3.5" />
            </a>
            {/* Mini stats */}
            <div className="flex flex-col gap-3 mt-4">
              {[
                { label: "Modules", value: "17" },
                { label: "Export formats", value: "6" },
                { label: "Avg. BRD time", value: "~10 min" },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between border-b border-white/[0.05] pb-3">
                  <span className="text-[11px] text-gray-600">{s.label}</span>
                  <span className="text-[11px] font-bold text-white">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Accordion */}
          <div className="rounded-3xl border border-white/[0.08] overflow-hidden bg-[#0a0a0a]">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="border-b border-white/[0.06] last:border-0">
                <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="flex justify-between items-center text-left w-full px-6 py-5 cursor-pointer font-semibold text-sm text-white gap-4 hover:bg-white/[0.02] transition-colors">
                  <span>{faq.q}</span>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${openFaq === idx ? "bg-purple-600 rotate-45" : "bg-white/[0.05] border border-white/[0.09]"}`}>
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === idx && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                      <p className="text-[12px] text-gray-500 leading-relaxed px-6 pb-5">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="py-[160px] px-6 md:px-10 lg:px-16 max-w-[1380px] w-full mx-auto relative z-10">
        <motion.div whileHover={{ scale: 1.005 }} transition={{ duration: 0.4 }}
          className="rounded-[32px] p-[64px] py-[120px] text-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#7c3aed 0%,#6d28d9 55%,#5b21b6 100%)" }}>
          <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.5) 1px,transparent 1px)", backgroundSize: "22px 22px" }} />
          <div className="absolute top-[-60px] left-[38%] w-96 h-96 rounded-full blur-[100px] pointer-events-none" style={{ background: "rgba(196,139,252,0.2)" }} />
          <Meteors number={16} />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-white/10 text-[10px] font-bold uppercase tracking-wider text-white/80 mb-6">
              <Zap className="w-3 h-3 fill-white" /> Ship your first BRD in 10 minutes
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
              Built for Business Analysts.<br />Ship faster.
            </h2>
            <p className="text-purple-200/80 text-sm max-w-[650px] mx-auto mb-12 leading-relaxed">
              Free tier. No credit card. Full access to Requirements, SWOT, Gap Analysis, and the AI Assistant from day one.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button onClick={onNavigateToRegister}
                className="px-8 py-4 rounded-xl text-sm font-bold bg-white text-purple-900 hover:bg-gray-100 transition-all cursor-pointer flex items-center gap-2 shadow-xl">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={onNavigateToLogin}
                className="px-8 py-4 rounded-xl text-sm font-semibold bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all cursor-pointer">
                Sign In
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-[120px] px-6 md:px-10 lg:px-16 bg-[#08080C] relative z-10">
        <div className="max-w-[1380px] w-full mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-16 mb-16">
            <div className="col-span-2 flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl border border-white/[0.08] bg-white/[0.04] flex items-center justify-center">
                  <img src={logo} alt="BAHub" className="w-4 h-4 object-contain" />
                </div>
                <div>
                  <span className="font-extrabold text-[11px] tracking-widest uppercase text-white/90">BAHub</span>
                  <p className="text-[8px] font-bold text-[#8B3DFF] uppercase tracking-widest">Workspace Platform</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed max-w-[180px]">The AI-powered BA workspace for traceable specifications and process engineering.</p>
              <div className="flex items-center gap-2">
                {["GH", "TW", "LI"].map(s => (
                  <div key={s} className="w-8 h-8 rounded-lg border border-white/[0.07] bg-[#0a0a0a] flex items-center justify-center text-[9px] font-bold text-gray-600 hover:text-white hover:border-white/20 transition-colors cursor-pointer">{s}</div>
                ))}
              </div>
            </div>
            {[
              { title: "Product", links: [{ label: "Features", href: "#features" }, { label: "Sandbox", href: "#sandbox" }, { label: "Integrations", href: "#" }, { label: "Changelog", href: "#" }] },
              { title: "Resources", links: [{ label: "Documentation", href: "#" }, { label: "API Ref", href: "#" }, { label: "Tutorials", href: "#" }, { label: "Status", href: "#" }] },
              { title: "Company", links: [{ label: "About", href: "#" }, { label: "Blog", href: "#" }, { label: "Careers", href: "#" }, { label: "Contact", href: "/contact" }] },
              { title: "Legal", links: [{ label: "Privacy Policy", href: "/privacy" }, { label: "Terms of Service", href: "/terms" }] },
            ].map(col => (
              <div key={col.title} className="flex flex-col gap-4">
                <h4 className="text-[9px] font-bold uppercase tracking-widest text-gray-500">{col.title}</h4>
                <ul className="flex flex-col gap-2.5">
                  {col.links.map(link => (
                    <li key={link.label}>
                      {link.href.startsWith("/") ? (
                        <button
                          onClick={() => { window.location.href = link.href; }}
                          className="text-[11px] text-gray-600 hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0"
                        >{link.label}</button>
                      ) : (
                        <a href={link.href} className="text-[11px] text-gray-600 hover:text-white transition-colors">{link.label}</a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.06] pt-6 flex flex-col lg:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-700">
              <span>Made with</span><Heart className="w-3 h-3 text-rose-500 fill-rose-500" /><span>for Business Analysts & Product Engineers</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => { window.location.href = "/privacy"; }} className="text-[10px] text-gray-700 hover:text-white transition-colors bg-transparent border-none cursor-pointer">Privacy</button>
              <button onClick={() => { window.location.href = "/terms"; }} className="text-[10px] text-gray-700 hover:text-white transition-colors bg-transparent border-none cursor-pointer">Terms</button>
              <span className="text-[10px] text-gray-700">© {new Date().getFullYear()} BAHub Contributors. MIT Licensed.</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Exit Intent Modal */}
      <ExitIntentModal
        isOpen={isExitIntentOpen}
        onClose={() => setIsExitIntentOpen(false)}
        onNavigateToRegister={onNavigateToRegister}
        onTryDemo={onTryDemo}
      />
    </div>
  );
};

export default LandingPage;
