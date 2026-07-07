import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Requirements — animated row reveal ───────────────────────────────────────
const REQ_ROWS = [
  { id: "REQ-001", type: "FUNCTIONAL",    pri: "HIGH",   status: "APPROVED", label: "User auth flow"       },
  { id: "REQ-002", type: "NON-FUNC",      pri: "MEDIUM", status: "REVIEW",   label: "API < 200ms"          },
  { id: "REQ-003", type: "UI",            pri: "LOW",    status: "DRAFT",    label: "Dark mode support"    },
  { id: "REQ-004", type: "TECHNICAL",     pri: "HIGH",   status: "APPROVED", label: "OAuth2 token refresh" },
];
const PRI: Record<string, string> = { HIGH: "text-red-400", MEDIUM: "text-amber-400", LOW: "text-green-400" };
const STA: Record<string, string> = { APPROVED: "text-green-400 bg-green-500/10", REVIEW: "text-blue-400 bg-blue-500/10", DRAFT: "text-gray-500 bg-white/5" };

export const RequirementsHeader: React.FC = () => {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= REQ_ROWS.length) return;
    const t = setTimeout(() => setN(v => v + 1), 500);
    return () => clearTimeout(t);
  }, [n]);

  return (
    <div className="w-full h-full px-4 pt-3 pb-2 flex flex-col gap-1.5 overflow-hidden">
      <div className="flex items-center gap-3 text-[8px] font-bold uppercase tracking-widest text-gray-700 mb-1 px-1">
        <span className="w-12">ID</span>
        <span className="w-14">Type</span>
        <span className="w-10">Pri</span>
        <span className="flex-1">Title</span>
        <span className="w-14 text-right">Status</span>
      </div>
      {REQ_ROWS.slice(0, n).map((r) => (
        <motion.div key={r.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 text-[8.5px] font-mono px-1">
          <span className="w-12 text-purple-400 shrink-0">{r.id}</span>
          <span className="w-14 text-gray-600 shrink-0 truncate">{r.type}</span>
          <span className={`w-10 shrink-0 font-bold ${PRI[r.pri]}`}>{r.pri}</span>
          <span className="flex-1 text-gray-400 truncate">{r.label}</span>
          <span className={`w-14 text-right shrink-0 px-1.5 py-0.5 rounded text-[7px] font-bold ${STA[r.status]}`}>{r.status}</span>
        </motion.div>
      ))}
    </div>
  );
};

// ── BRD — typewriter ──────────────────────────────────────────────────────────
const BRD_LINES = [
  { text: "# BRD-2026-14 · E-Commerce Checkout",  bold: true  },
  { text: "## 1. Executive Summary",               bold: true  },
  { text: "Specifies checkout flow with payment routing...", bold: false },
  { text: "## 2. Functional Requirements",         bold: true  },
  { text: "FR-01 · Risk scan before settlement",   bold: false },
  { text: "FR-02 · Failover in < 500ms",           bold: false },
];

export const BRDHeader: React.FC = () => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (idx >= BRD_LINES.length) return;
    const t = setTimeout(() => setIdx(i => i + 1), 380);
    return () => clearTimeout(t);
  }, [idx]);

  return (
    <div className="w-full h-full px-4 pt-3 pb-2 flex flex-col gap-1 overflow-hidden font-mono">
      {BRD_LINES.slice(0, idx).map((l, i) => (
        <motion.p key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
          className={`text-[8px] leading-relaxed ${l.bold ? "text-purple-400 font-bold mt-0.5" : "text-gray-500"}`}>
          {l.text}
        </motion.p>
      ))}
      {idx < BRD_LINES.length && (
        <span className="text-purple-400 text-[9px] animate-pulse leading-none">▌</span>
      )}
    </div>
  );
};

// ── Canvas diagram — nodes + pulsing active ───────────────────────────────────
const NODES = [
  { label: "User Request", x: 6,  y: 38, c: "#6366f1" },
  { label: "Auth Gateway", x: 30, y: 22, c: "#a78bfa" },
  { label: "AI Risk Scan", x: 54, y: 38, c: "#8b5cf6" },
  { label: "Fulfill Order",x: 78, y: 55, c: "#6366f1" },
];

export const DiagramHeader: React.FC = () => {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % NODES.length), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="w-full h-full relative">
      {/* dot grid */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:14px_14px]" />
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {NODES.slice(0, -1).map((n, i) => (
          <line key={i}
            x1={`${n.x + 8}%`} y1={`${n.y + 4}%`}
            x2={`${NODES[i + 1].x}%`} y2={`${NODES[i + 1].y + 4}%`}
            stroke="rgba(167,139,250,0.18)" strokeWidth="1.5" strokeDasharray="3 2" />
        ))}
        {NODES.map((n, i) => (
          <motion.circle key={n.label}
            cx={`${n.x + 8}%`} cy={`${n.y + 4}%`}
            fill={n.c}
            animate={{ r: active === i ? 4.5 : 2.8, fillOpacity: active === i ? 1 : 0.45 }}
            transition={{ duration: 0.35 }} />
        ))}
      </svg>
      {NODES.map((n, i) => (
        <div key={n.label} className="absolute" style={{ left: `${n.x - 1}%`, top: `${n.y + 14}%` }}>
          <span className={`text-[7px] font-bold whitespace-nowrap transition-colors duration-300 ${active === i ? "text-purple-300" : "text-gray-700"}`}>
            {n.label}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── AI chat ───────────────────────────────────────────────────────────────────
const CHAT = [
  { role: "user", text: "Summarise open requirements" },
  { role: "ai",   text: "12 requirements across 3 epics — 4 HIGH priority items need review." },
  { role: "user", text: "Draft acceptance criteria for REQ-007" },
];

export const AIHeader: React.FC = () => {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (shown >= CHAT.length) return;
    const t = setTimeout(() => setShown(s => s + 1), 900);
    return () => clearTimeout(t);
  }, [shown]);

  return (
    <div className="w-full h-full px-4 py-3 flex flex-col gap-2 justify-end overflow-hidden">
      {CHAT.slice(0, shown).map((m, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
          <span className={`text-[8px] leading-relaxed px-2.5 py-1.5 rounded-xl max-w-[88%] ${
            m.role === "user"
              ? "bg-purple-600/30 text-purple-200 border border-purple-500/20"
              : "bg-white/[0.04] text-gray-400 border border-white/[0.07]"
          }`}>{m.text}</span>
        </motion.div>
      ))}
    </div>
  );
};

// ── Risk register ─────────────────────────────────────────────────────────────
const RISKS = [
  { id: "RSK-01", title: "Auth token exposure",  sev: "HIGH",   status: "Open"      },
  { id: "RSK-02", title: "3rd-party API outage", sev: "MEDIUM", status: "Mitigated" },
  { id: "RSK-03", title: "Data migration drift", sev: "HIGH",   status: "Open"      },
];
const SEV: Record<string, string> = { HIGH: "bg-red-500/20 text-red-400 border-red-500/20", MEDIUM: "bg-amber-500/20 text-amber-400 border-amber-500/20" };

export const RiskHeader: React.FC = () => (
  <div className="w-full h-full px-4 pt-3 pb-1 flex flex-col gap-2 overflow-hidden">
    {RISKS.map((r, i) => (
      <motion.div key={r.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.18 }}
        className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
        <span className="text-[8px] font-mono text-purple-400 shrink-0 w-12">{r.id}</span>
        <span className="text-[8px] text-gray-400 flex-1 truncate">{r.title}</span>
        <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${SEV[r.sev]}`}>{r.sev}</span>
        <span className={`text-[7px] font-bold shrink-0 ${r.status === "Open" ? "text-red-400" : "text-green-400"}`}>{r.status}</span>
      </motion.div>
    ))}
  </div>
);

// ── SWOT quadrant ─────────────────────────────────────────────────────────────
const SWOT = [
  { k: "S", name: "Strengths",     color: "text-green-400",  bg: "bg-green-500/10 border-green-500/20", items: ["AI synthesis", "Trace links"] },
  { k: "W", name: "Weaknesses",    color: "text-red-400",    bg: "bg-red-500/10 border-red-500/20",    items: ["On-premise roadmap"] },
  { k: "O", name: "Opportunities", color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20",  items: ["Jira market", "Confluence"] },
  { k: "T", name: "Threats",       color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20",items: ["Lucidchart", "Miro"] },
];

export const SwotHeader: React.FC = () => (
  <div className="w-full h-full p-3 grid grid-cols-2 gap-2">
    {SWOT.map(q => (
      <div key={q.k} className={`rounded-xl p-2.5 border flex flex-col gap-1 ${q.bg}`}>
        <span className={`text-[8px] font-black uppercase tracking-wider ${q.color}`}>{q.k} · {q.name}</span>
        {q.items.map(item => (
          <span key={item} className="text-[7px] text-gray-600 leading-relaxed">· {item}</span>
        ))}
      </div>
    ))}
  </div>
);

// ── User stories kanban ───────────────────────────────────────────────────────
const STORIES = [
  { id: "US-01", text: "As a user I want SSO login",     col: "TODO",        colColor: "text-gray-500 bg-white/5 border-white/10" },
  { id: "US-02", text: "As a BA I want BRD generation",  col: "IN PROGRESS", colColor: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { id: "US-03", text: "As a PM I want risk dashboards", col: "DONE",        colColor: "text-green-400 bg-green-500/10 border-green-500/20" },
];

export const StoriesHeader: React.FC = () => (
  <div className="w-full h-full px-4 pt-3 pb-2 flex flex-col gap-2 overflow-hidden">
    {STORIES.map((s, i) => (
      <motion.div key={s.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.15 }}
        className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
        <span className="text-[8px] font-mono text-purple-400 shrink-0 w-10">{s.id}</span>
        <span className="text-[8px] text-gray-500 flex-1 truncate">{s.text}</span>
        <span className={`text-[7px] font-bold shrink-0 px-1.5 py-0.5 rounded-full border ${s.colColor}`}>{s.col}</span>
      </motion.div>
    ))}
  </div>
);

// ── Audit log feed ────────────────────────────────────────────────────────────
const AUDIT = [
  { time: "09:41", user: "priya",  action: "Approved REQ-007",        color: "text-green-400"  },
  { time: "09:38", user: "alex",   action: "Updated Risk RSK-03",      color: "text-amber-400" },
  { time: "09:32", user: "system", action: "BRD-2026-14 generated",    color: "text-blue-400"  },
  { time: "09:28", user: "raj",    action: "Pushed 4 stories to Jira", color: "text-purple-400" },
];

export const AuditHeader: React.FC = () => {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (shown >= AUDIT.length) return;
    const t = setTimeout(() => setShown(s => s + 1), 450);
    return () => clearTimeout(t);
  }, [shown]);

  return (
    <div className="w-full h-full px-4 pt-3 pb-2 flex flex-col gap-1.5 overflow-hidden">
      <AnimatePresence>
        {AUDIT.slice(0, shown).map((a) => (
          <motion.div key={a.time} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-[8px] p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <span className="text-gray-700 font-mono shrink-0 w-8">{a.time}</span>
            <span className="text-gray-600 shrink-0 w-10 truncate">{a.user}</span>
            <span className={`font-medium ${a.color}`}>{a.action}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
