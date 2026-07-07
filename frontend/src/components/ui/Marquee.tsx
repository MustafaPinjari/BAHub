import React from "react";
import { clsx } from "clsx";

interface MarqueeProps {
  className?: string;
  vertical?: boolean;
  reverse?: boolean;
  pauseOnHover?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Marquee: React.FC<MarqueeProps> = ({
  className,
  vertical = false,
  reverse = false,
  pauseOnHover = false,
  children,
  style,
}) => {
  return (
    <div
      className={clsx(
        "group flex overflow-hidden",
        vertical ? "flex-col" : "flex-row",
        className
      )}
      style={style}
    >
      {[0, 1].map((i) => (
        <div
          key={i}
          className={clsx(
            "flex shrink-0 gap-4",
            vertical ? "flex-col" : "flex-row",
            vertical
              ? reverse
                ? "animate-marquee-up"
                : "animate-marquee-down"
              : reverse
              ? "[animation-direction:reverse] animate-marquee-left"
              : "animate-marquee-left",
            pauseOnHover && "group-hover:[animation-play-state:paused]"
          )}
          aria-hidden={i === 1}
        >
          {children}
        </div>
      ))}
    </div>
  );
};
