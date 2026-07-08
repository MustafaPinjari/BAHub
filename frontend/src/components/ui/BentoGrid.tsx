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
}: {
  className?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  accentColor?: string;
}) => {
  const [coords, setCoords] = React.useState({ x: 0, y: 0 });
  const [hovered, setHovered] = React.useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.005 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={clsx(
        "relative rounded-2xl border border-white/[0.08] bg-[#0a0a0a]/80 backdrop-blur-md overflow-hidden",
        "hover:border-white/[0.18] hover:shadow-2xl hover:shadow-black/70",
        "flex flex-col group/card transition-colors duration-300 cursor-default",
        className
      )}
    >
      {/* Dynamic Cursor Spotlight Overlay */}
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

      {/* Live preview area — fixed height, dark bg */}
      {header && (
        <div className="relative w-full h-[140px] shrink-0 overflow-hidden border-b border-white/[0.06] bg-gradient-to-b from-[#0d0d0d] to-[#070707] z-10">
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
