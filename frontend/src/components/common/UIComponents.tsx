import React, { forwardRef } from "react";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

// ==========================================
// BUTTON COMPONENT — Design DNA
// ==========================================
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "ghost" | "minimal" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 select-none cursor-pointer",
          {
            // DNA primary: white background, black text
            "bg-white text-black hover:bg-gray-100 shadow-sm": variant === "primary",
            // DNA secondary/outline: dark surface, gray border
            "bg-gray-900 border border-white/[0.10] text-gray-200 hover:bg-gray-800 hover:border-white/[0.18] hover:text-white shadow-sm": variant === "secondary" || variant === "outline",
            // Destructive
            "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300": variant === "destructive",
            // Ghost — ultra minimal
            "bg-transparent text-gray-500 hover:text-gray-200 hover:bg-white/[0.05]": variant === "ghost",
            // Minimal
            "bg-transparent border border-white/[0.08] text-gray-400 hover:bg-white/[0.04] hover:text-gray-200": variant === "minimal",

            // Sizes
            "px-3 py-1.5 text-xs": size === "sm",
            "px-4 py-2 text-sm": size === "md",
            "px-5 py-2.5 text-sm": size === "lg",
            "p-2": size === "icon",
          },
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

// ==========================================
// INPUT COMPONENT — Design DNA dark surface
// ==========================================
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = "text", icon, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1 text-left">
        {label && (
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 select-none mb-0.5">
            {label}
          </label>
        )}
        <div className="relative w-full flex items-center">
          {icon && (
            <div className="absolute left-3 text-gray-700 flex items-center justify-center pointer-events-none z-10">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={cn(
              "w-full px-3 py-2 text-xs font-medium rounded-lg bg-gray-900 border border-white/[0.08] text-white focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 transition-all outline-none placeholder:text-gray-700",
              {
                "pl-10": !!icon,
                "border-red-500/40 focus:border-red-500/60 focus:ring-red-500/10": !!error,
              },
              className
            )}
            {...props}
          />
        </div>
        {error && <span className="text-[10px] text-red-400 font-medium mt-0.5">{error}</span>}
        {!error && helperText && <span className="text-[10px] text-gray-700 mt-0.5">{helperText}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";

// ==========================================
// TEXTAREA COMPONENT — Design DNA dark surface
// ==========================================
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1 text-left">
        {label && (
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 select-none mb-0.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            "w-full px-3 py-2 text-xs font-medium rounded-lg bg-gray-900 border border-white/[0.08] text-white focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 transition-all outline-none placeholder:text-gray-700 min-h-[100px] leading-relaxed resize-y",
            {
              "border-red-500/40 focus:border-red-500/60 focus:ring-red-500/10": !!error,
            },
            className
          )}
          {...props}
        />
        {error && <span className="text-[10px] text-red-400 font-medium mt-0.5">{error}</span>}
        {!error && helperText && <span className="text-[10px] text-gray-700 mt-0.5">{helperText}</span>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

// ==========================================
// SELECT COMPONENT — Design DNA dark surface
// ==========================================
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  icon?: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, icon, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1 text-left">
        {label && (
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 select-none mb-0.5">
            {label}
          </label>
        )}
        <div className="relative w-full flex items-center">
          {icon && (
            <div className="absolute left-3 text-gray-700 flex items-center justify-center pointer-events-none z-10">
              {icon}
            </div>
          )}
          <select
            ref={ref}
            className={cn(
              "w-full px-3 py-2 text-xs font-medium rounded-lg bg-gray-900 border border-white/[0.08] text-white focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 transition-all outline-none appearance-none cursor-pointer pr-8",
              {
                "pl-10": !!icon,
                "border-red-500/40 focus:border-red-500/60": !!error,
              },
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-gray-900 text-white font-medium">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-gray-700">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && <span className="text-[10px] text-red-400 font-medium mt-0.5">{error}</span>}
      </div>
    );
  }
);
Select.displayName = "Select";

// ==========================================
// BADGE COMPONENT — Design DNA pill badges
// ==========================================
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = "default", children, ...props }) => {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide select-none transition-colors duration-150",
        {
          // DNA: purple tinted default
          "bg-purple-500/10 border border-purple-500/20 text-purple-400": variant === "default",
          "bg-white/[0.05] border border-white/[0.08] text-gray-400": variant === "secondary",
          "bg-green-500/10 border border-green-500/20 text-green-400": variant === "success",
          "bg-amber-500/10 border border-amber-500/20 text-amber-400": variant === "warning",
          "bg-red-500/10 border border-red-500/20 text-red-400": variant === "destructive",
          "border border-white/[0.10] text-gray-500 bg-transparent": variant === "outline",
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

// ==========================================
// ALERT COMPONENT — Design DNA dark alerts
// ==========================================
export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "destructive";
  title?: string;
}

export const Alert: React.FC<AlertProps> = ({ className, variant = "info", title, children, ...props }) => {
  return (
    <div
      className={cn(
        "p-3 rounded-xl border flex flex-col gap-1 text-xs text-left transition-colors duration-150",
        {
          "bg-purple-500/5 border-purple-500/15 text-purple-300": variant === "info",
          "bg-green-500/5 border-green-500/15 text-green-400": variant === "success",
          "bg-amber-500/5 border-amber-500/15 text-amber-400": variant === "warning",
          "bg-red-500/5 border-red-500/15 text-red-400": variant === "destructive",
        },
        className
      )}
      {...props}
    >
      {title && <span className="font-bold text-xs tracking-tight leading-none mb-0.5">{title}</span>}
      <div className="leading-relaxed opacity-90 text-[11px] font-medium">{children}</div>
    </div>
  );
};

// ==========================================
// CARD COMPONENT — Design DNA dark surface
// ==========================================
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        "bg-gray-950/60 rounded-2xl border border-white/[0.07] p-5 hover:border-white/[0.12] hover:shadow-2xl transition-all duration-300 text-white text-left group",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
