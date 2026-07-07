import React from "react";
import { clsx } from "clsx";
import { motion } from "framer-motion";

// ── Grid wrapper ──────────────────────────────────────────────────────────────
export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <div className={clsx("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
    {children}
  </div>
);

// ── Individual card ───────────────────────────────────────────────────────────
export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  accentColor = "purple",
}: {
  className?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  accentColor?: "purple" | "blue" | "green" | "amber" | "red" | "cyan" | "indigo";
}) => {
  const glowMap: Record<string, string> = {
    purple: "from-purple-500/10 to-transparent",
    blue:   "from-blue-500/10 to-transparent",
    green:  "from-green-500/10 to-transparent",
    amber:  "from-amber-500/10 to-transparent",
    red:    "from-red-500/10 to-transparent",
    cyan:   "from-cyan-500/10 to-transparent",
    indigo: "from-indigo-500/10 to-transparent",
  };

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.005 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={clsx(
        "relative rounded-2xl border border-white/[0.08] bg-[#0a0a0a] overflow-hidden",
        "hover:border-white/[0.16] hover:shadow-2xl hover:shadow-black/60",
        "flex flex-col group/card transition-colors duration-300 cursor-default",
        className
      )}
    >
      {/* Top accent glow on hover */}
      <div className={clsx(
        "absolute inset-0 bg-gradient-to-br opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none z-0",
        glowMap[accentColor]
      )} />

      {/* Live preview area — fixed height, dark bg */}
      {header && (
        <div className="relative w-full h-[140px] shrink-0 overflow-hidden border-b border-white/[0.06] bg-gradient-to-b from-[#0d0d0d] to-[#070707]">
          {header}
          {/* Bottom fade so it blends into card */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
        </div>
      )}

      {/* Text content */}
      <div className="relative z-10 flex flex-col gap-3 p-5 flex-1">
        {/* Icon row */}
        {icon && (
          <div className="w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.04] flex items-center justify-center shrink-0 group-hover/card:border-white/[0.15] transition-colors">
            {icon}
          </div>
        )}

        {/* Title */}
        <h3 className="font-bold text-[13px] text-white tracking-tight leading-snug">
          {title}
        </h3>

        {/* Description */}
        <p className="text-[11px] text-gray-500 leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
};
