import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

// ── Requirements — animated tree node linkage ──────────────────────────────────
export const RequirementsHeader: React.FC = () => {
  return (
    <div className="w-full h-full relative flex items-center justify-center p-3 overflow-hidden bg-[#050505]">
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:10px_10px]" />
      
      {/* SVG Connectors */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 120" preserveAspectRatio="none">
        <motion.path
          d="M 50 60 Q 100 35 140 30"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1.2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <motion.path
          d="M 50 60 Q 100 85 140 90"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1.2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
        />
      </svg>

      {/* Nodes */}
      <div className="absolute left-3 top-[40px] z-10 text-left">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-start justify-center bg-[#0a0a0a] border border-white/15 rounded-xl px-2.5 py-1"
        >
          <span className="text-[7.5px] font-mono font-bold text-white/40">REQ-001</span>
          <span className="text-[8px] font-bold text-white/90 whitespace-nowrap">Core Auth Setup</span>
        </motion.div>
      </div>

      <div className="absolute right-3 top-[10px] z-10 text-left">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-start justify-center bg-[#0a0a0a] border border-white/10 rounded-xl px-2 py-0.5"
        >
          <span className="text-[7px] font-mono text-white/30">US-010</span>
          <span className="text-[8px] text-white/60">Github SSO</span>
        </motion.div>
      </div>

      <div className="absolute right-3 bottom-[10px] z-10 text-left">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col items-start justify-center bg-[#0a0a0a] border border-white/10 rounded-xl px-2 py-0.5"
        >
          <span className="text-[7px] font-mono text-white/30">US-011</span>
          <span className="text-[8px] text-white/60">Google SSO</span>
        </motion.div>
      </div>
    </div>
  );
};

// ── BRD — Corporate spec and approval stamp ───────────────────────────────────
export const BRDHeader: React.FC = () => {
  return (
    <div className="w-full h-full p-4 relative overflow-hidden bg-white text-gray-800 flex flex-col justify-between font-serif text-left">
      <div className="border-b border-gray-200 pb-1.5 mb-2 flex justify-between items-center font-sans text-[7.5px] text-gray-400 uppercase tracking-wider font-bold">
        <span>BAHub Spec Document</span>
        <span>v2.1</span>
      </div>
      
      <div className="flex-1 flex flex-col gap-1">
        <h4 className="text-[10.5px] font-black text-gray-900 leading-tight">Business Requirements Document</h4>
        <p className="text-[7.5px] text-gray-400 font-sans italic leading-none">Compiled on 2026-07-07</p>
        <div className="w-full h-1 bg-gray-100 rounded-full mt-2" />
        <div className="w-11/12 h-1 bg-gray-100 rounded-full" />
        <div className="w-4/5 h-1 bg-gray-100 rounded-full" />
      </div>

      {/* Stamp */}
      <motion.div 
        initial={{ scale: 1.5, opacity: 0, rotate: -25 }}
        animate={{ scale: 1, opacity: 0.6, rotate: -12 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
        className="absolute right-4 bottom-2 border-2 border-gray-400 text-gray-500 font-sans font-black tracking-widest text-[8.5px] uppercase px-1.5 py-0.5 rounded rotate-[-12deg] bg-white pointer-events-none"
      >
        APPROVED
      </motion.div>
    </div>
  );
};

// ── Canvas diagram — system network path flow ──────────────────────────────────
export const DiagramHeader: React.FC = () => {
  return (
    <div className="w-full h-full relative overflow-hidden bg-[#070707] flex items-center justify-center p-4">
      {/* dot grid */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:12px_12px]" />
      
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 120" preserveAspectRatio="none">
        <path d="M 30 60 L 90 35 L 150 60" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" strokeDasharray="3 3" className="animate-flow-dash" />
        <path d="M 30 60 L 90 85 L 150 60" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" strokeDasharray="3 3" className="animate-flow-dash" />
      </svg>

      <div className="absolute left-3 top-[42px] flex flex-col items-center gap-1">
        <div className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/10 flex items-center justify-center">
          <span className="text-[10px] filter grayscale opacity-60">🌐</span>
        </div>
        <span className="text-[6.5px] font-bold text-gray-600 uppercase tracking-wider font-mono">Gateway</span>
      </div>

      <div className="absolute left-[85px] top-[14px] flex flex-col items-center gap-1">
        <div className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/10 flex items-center justify-center">
          <span className="text-[10px] filter grayscale opacity-60">🛡️</span>
        </div>
        <span className="text-[6.5px] font-bold text-gray-600 uppercase tracking-wider font-mono">Auth</span>
      </div>

      <div className="absolute left-[85px] bottom-[14px] flex flex-col items-center gap-1">
        <div className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/10 flex items-center justify-center">
          <span className="text-[10px] filter grayscale opacity-60">💳</span>
        </div>
        <span className="text-[6.5px] font-bold text-gray-600 uppercase tracking-wider font-mono">Stripe</span>
      </div>

      <div className="absolute right-3 top-[42px] flex flex-col items-center gap-1">
        <div className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/10 flex items-center justify-center">
          <span className="text-[10px] filter grayscale opacity-60">🗄️</span>
        </div>
        <span className="text-[6.5px] font-bold text-gray-600 uppercase tracking-wider font-mono">Database</span>
      </div>
    </div>
  );
};

// ── AI chat — coding syntax-highlighted json editor mockup ─────────────────────
export const AIHeader: React.FC = () => {
  return (
    <div className="w-full h-full p-3 relative overflow-hidden bg-[#0d0d0d] flex flex-col gap-1.5 font-mono text-[8px] text-white/50 text-left">
      <div className="flex items-center gap-1 border-b border-white/[0.06] pb-1.5 mb-1 text-gray-650 font-sans font-bold text-[7px] uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
        <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
        <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
        <span className="ml-1.5 text-white/30">ai-model-output.json</span>
      </div>
      
      <div className="flex-1 flex flex-col gap-0.5 leading-snug">
        <p className="text-white/20">// AI Model Synthesizer</p>
        <p><span className="text-white/80">"status"</span>: <span className="text-white/60">"success"</span>,</p>
        <p><span className="text-white/80">"requirements"</span>: [</p>
        <p className="pl-3">{"{"} <span className="text-white/80">"id"</span>: <span className="text-white/60">"REQ-001"</span>, <span className="text-white/80">"pri"</span>: <span className="text-white/60">"HIGH"</span> {"}"}</p>
        <p>],</p>
        <p><span className="text-white/80">"audit_hash"</span>: <span className="text-white/40">"0x9f3d...a812"</span></p>
      </div>
    </div>
  );
};

// ── Risk register — severity quadrant matrix scatter plot ─────────────────────
export const RiskHeader: React.FC = () => {
  return (
    <div className="w-full h-full p-4 relative overflow-hidden bg-[#050505] flex flex-col justify-between font-sans text-left">
      <div className="flex justify-between items-center border-b border-white/[0.06] pb-1.5 mb-2">
        <span className="text-[7.5px] uppercase font-bold text-gray-600 tracking-wider">Risk Matrix (Severity)</span>
        <span className="text-[7px] font-mono text-white/50 font-bold bg-white/5 px-1.5 py-0.5 rounded">3 Open Risks</span>
      </div>

      <div className="flex-1 grid grid-cols-3 grid-rows-3 gap-1 relative border border-white/[0.04] p-1 bg-black/40 rounded-lg">
        {/* Scatter dots */}
        <div className="absolute left-[20%] top-[15%] z-10">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="w-2.5 h-2.5 rounded-full bg-white/80 border border-white/50"
            title="RSK-01"
          />
        </div>
        <div className="absolute left-[70%] top-[45%] z-10">
          <motion.div
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut", delay: 0.3 }}
            className="w-2.5 h-2.5 rounded-full bg-white/50 border border-white/30"
            title="RSK-02"
          />
        </div>
        <div className="absolute left-[45%] top-[75%] z-10">
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 2.0, ease: "easeInOut", delay: 0.6 }}
            className="w-2.5 h-2.5 rounded-full bg-white/35 border border-white/20"
            title="RSK-03"
          />
        </div>

        {/* Matrix grids */}
        {Array.from({ length: 9 }).map((_, idx) => (
          <div key={idx} className="border border-white/[0.02] bg-white/[0.01] rounded" />
        ))}
      </div>

      <div className="flex justify-between items-center text-[6.5px] font-bold uppercase tracking-widest text-gray-700 mt-2">
        <span>Low Impact</span>
        <span>High Impact</span>
      </div>
    </div>
  );
};

// ── SWOT quadrant map ────────────────────────────────────────────────────────
export const SwotHeader: React.FC = () => {
  return (
    <div className="w-full h-full p-3 grid grid-cols-2 grid-rows-2 gap-2 relative bg-[#050505] text-left">
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:12px_12px]" />
      
      {[
        { k: "S", label: "Strengths",     desc: "AI synthesis" },
        { k: "W", label: "Weaknesses",    desc: "On-prem limit" },
        { k: "O", label: "Opportunities", desc: "Jira Sync" },
        { k: "T", label: "Threats",       desc: "Legacy tools" },
      ].map((q) => (
        <div key={q.k} className="rounded-xl p-2 border border-white/[0.06] bg-white/[0.01] flex flex-col justify-between relative z-10 backdrop-blur-sm">
          <span className="text-[9px] font-black text-white/40 uppercase tracking-wider">{q.k}</span>
          <div className="flex flex-col">
            <span className="text-[7.5px] font-bold text-white/80 leading-tight">{q.label}</span>
            <span className="text-[6.5px] text-gray-600 truncate">{q.desc}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── User stories — animated Kanban card transition ───────────────────────────
export const StoriesHeader: React.FC = () => {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full p-4 relative overflow-hidden bg-[#060606] flex flex-col justify-between font-sans text-left">
      <div className="flex justify-between items-center border-b border-white/[0.06] pb-1.5 mb-2">
        <span className="text-[7.5px] uppercase font-bold text-gray-600 tracking-wider">Sprint Board Simulation</span>
        <span className="text-[7.5px] font-bold text-white/40 uppercase tracking-widest font-mono">Sprint 1</span>
      </div>

      <div className="flex-1 grid grid-cols-3 gap-2 text-[8px]">
        {/* TODO Column */}
        <div className="flex flex-col gap-1.5 bg-black/40 border border-white/[0.03] p-1.5 rounded-lg h-full">
          <span className="font-bold text-gray-600 uppercase tracking-wider text-[6.5px]">To Do</span>
          {step === 0 && (
            <motion.div layoutId="kanban-card" className="bg-[#111] border border-white/10 p-1.5 rounded flex flex-col gap-1">
              <span className="font-mono text-[7px] text-white/40 font-bold">US-010</span>
              <span className="text-[7px] text-white/70 leading-tight">SSO Gateway</span>
            </motion.div>
          )}
        </div>

        {/* IN PROGRESS Column */}
        <div className="flex flex-col gap-1.5 bg-black/40 border border-white/[0.03] p-1.5 rounded-lg h-full">
          <span className="font-bold text-white/40 uppercase tracking-wider text-[6.5px]">Active</span>
          {step === 1 && (
            <motion.div layoutId="kanban-card" className="bg-[#111] border border-white/15 p-1.5 rounded flex flex-col gap-1">
              <span className="font-mono text-[7px] text-white/50 font-bold">US-010</span>
              <span className="text-[7px] text-white/80 leading-tight">SSO Gateway</span>
            </motion.div>
          )}
        </div>

        {/* DONE Column */}
        <div className="flex flex-col gap-1.5 bg-black/40 border border-white/[0.03] p-1.5 rounded-lg h-full">
          <span className="font-bold text-white/20 uppercase tracking-wider text-[6.5px]">Done</span>
          {step === 2 && (
            <motion.div layoutId="kanban-card" className="bg-[#111] border border-white/10 p-1.5 rounded flex flex-col gap-1">
              <span className="font-mono text-[7px] text-white/30 font-bold">US-010</span>
              <span className="text-[7px] text-white/60 leading-tight">SSO Gateway</span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Audit log feed terminal style stream ──────────────────────────────────────
export const AuditHeader: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([
    "[09:41:02] INFO Approved REQ-001",
    "[09:41:05] WARN Risk RSK-03 high sev",
  ]);

  useEffect(() => {
    const messages = [
      "[09:41:10] INFO Syncing stories to Jira",
      "[09:41:12] SUCCESS Sync complete",
      "[09:41:18] INFO BRD generated v1.2",
      "[09:41:20] INFO User logged in",
    ];
    let idx = 0;
    const t = setInterval(() => {
      if (idx < messages.length) {
        setLogs(prev => [...prev.slice(-3), messages[idx] as string]);
        idx++;
      } else {
        idx = 0;
        setLogs([
          "[09:41:02] INFO Approved REQ-001",
          "[09:41:05] WARN Risk RSK-03 high sev",
        ]);
      }
    }, 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="w-full h-full p-3 relative overflow-hidden bg-[#020202] border border-white/[0.04] rounded-xl flex flex-col gap-1 font-mono text-[8px] text-gray-600 text-left">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5 mb-1.5">
        <span className="text-[7px] uppercase font-bold text-gray-700 tracking-wider">System Audit Terminal</span>
        <span className="w-1.5 h-1.5 rounded-full bg-white/20 animate-ping" />
      </div>
      <div className="flex-1 flex flex-col gap-1">
        {logs.map((log, i) => (
          <motion.p key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="leading-normal">
            <span className="text-gray-700">{log.split(" ")[0]}</span>{" "}
            <span className="text-white/60">
              {log.split(" ")[1]}
            </span>{" "}
            <span className="text-white/40">{log.split(" ").slice(2).join(" ")}</span>
          </motion.p>
        ))}
      </div>
    </div>
  );
};
