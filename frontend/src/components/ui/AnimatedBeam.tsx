"use client";
import React, { useEffect, useId, useState } from "react";
import { clsx } from "clsx";

interface AnimatedBeamProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  fromRef: React.RefObject<HTMLDivElement | null>;
  toRef: React.RefObject<HTMLDivElement | null>;
  curvature?: number;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  className?: string;
  gradientStartColor?: string;
  gradientStopColor?: string;
}

export const AnimatedBeam: React.FC<AnimatedBeamProps> = ({
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  duration = 3,
  delay = 0,
  className,
  gradientStartColor = "#9333ea",
  gradientStopColor = "#3b82f6",
}) => {
  const id = useId();
  const [pathD, setPathD] = useState("");
  const [svgDims, setSvgDims] = useState({ width: 0, height: 0 });

  const updatePath = () => {
    const container = containerRef.current;
    const from = fromRef.current;
    const to = toRef.current;
    if (!container || !from || !to) return;

    const containerRect = container.getBoundingClientRect();
    const fromRect = from.getBoundingClientRect();
    const toRect = to.getBoundingClientRect();

    const fromX = fromRect.left + fromRect.width / 2 - containerRect.left;
    const fromY = fromRect.top + fromRect.height / 2 - containerRect.top;
    const toX = toRect.left + toRect.width / 2 - containerRect.left;
    const toY = toRect.top + toRect.height / 2 - containerRect.top;

    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2 - curvature;

    setSvgDims({ width: containerRect.width, height: containerRect.height });
    setPathD(`M ${fromX},${fromY} Q ${midX},${midY} ${toX},${toY}`);
  };

  useEffect(() => {
    updatePath();
    const ro = new ResizeObserver(updatePath);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [containerRef, fromRef, toRef, curvature]);

  const gradId = `grad-${id}`;

  return (
    <svg
      className={clsx("pointer-events-none absolute inset-0 overflow-visible", className)}
      width={svgDims.width}
      height={svgDims.height}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={gradientStartColor} stopOpacity="0" />
          <stop offset="40%" stopColor={gradientStartColor} stopOpacity="1" />
          <stop offset="60%" stopColor={gradientStopColor} stopOpacity="1" />
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Static dim path */}
      <path d={pathD} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />

      {/* Animated glowing beam */}
      <path
        d={pathD}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="2"
        strokeLinecap="round"
        style={{
          strokeDasharray: "20 200",
          strokeDashoffset: reverse ? -300 : 300,
          animation: `beamSlide ${duration}s linear ${delay}s infinite`,
        }}
      />
    </svg>
  );
};
