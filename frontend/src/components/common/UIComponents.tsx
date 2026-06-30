import React, { forwardRef } from "react";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

// ==========================================
// BUTTON COMPONENT
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
          "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none",
          {
            // Variants
            "bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm border border-transparent": variant === "primary",
            "bg-card border border-border text-foreground hover:bg-secondary": variant === "secondary" || variant === "outline",
            "bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-sm border border-transparent": variant === "destructive",
            "bg-transparent text-foreground hover:bg-secondary hover:text-foreground": variant === "ghost",
            "bg-background border border-border text-foreground hover:bg-secondary": variant === "minimal",
            
            // Sizes
            "px-2.5 py-1.5 text-xs": size === "sm",
            "px-3.5 py-2 text-sm": size === "md",
            "px-5 py-2.5 text-base": size === "lg",
            "p-2": size === "icon",
          },
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

// ==========================================
// INPUT COMPONENT
// ==========================================
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = "text", ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground select-none">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            "w-full px-3 py-2 text-sm rounded-lg bg-card border border-border text-foreground focus:border-[#2563EB] focus:ring-2 focus:ring-primary/10 transition-all outline-none placeholder:text-muted-foreground/60 shadow-sm",
            {
              "border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/10": !!error,
            },
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-[#DC2626] font-medium mt-0.5">{error}</span>}
        {!error && helperText && <span className="text-xs text-muted-foreground mt-0.5">{helperText}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";

// ==========================================
// TEXTAREA COMPONENT
// ==========================================
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground select-none">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            "w-full px-3 py-2 text-sm rounded-lg bg-card border border-border text-foreground focus:border-[#2563EB] focus:ring-2 focus:ring-primary/10 transition-all outline-none placeholder:text-muted-foreground/60 shadow-sm min-h-[100px]",
            {
              "border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/10": !!error,
            },
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-[#DC2626] font-medium mt-0.5">{error}</span>}
        {!error && helperText && <span className="text-xs text-muted-foreground mt-0.5">{helperText}</span>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

// ==========================================
// SELECT COMPONENT
// ==========================================
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground select-none">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              "w-full px-3 py-2 text-sm rounded-lg bg-card border border-border text-foreground focus:border-[#2563EB] focus:ring-2 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer shadow-sm",
              {
                "border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/10": !!error,
              },
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-card text-foreground">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground/60">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && <span className="text-xs text-[#DC2626] font-medium mt-0.5">{error}</span>}
      </div>
    );
  }
);
Select.displayName = "Select";

// ==========================================
// BADGE COMPONENT
// ==========================================
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = "default", children, ...props }) => {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold tracking-wide select-none",
        {
          "bg-[#DBEAFE] text-[#1D4ED8]": variant === "default",
          "bg-secondary text-[#334155] border border-border": variant === "secondary",
          "bg-[#DCFCE7] text-[#166534]": variant === "success",
          "bg-[#FEF3C7] text-[#92400E]": variant === "warning",
          "bg-[#FEE2E2] text-[#991B1B]": variant === "destructive",
          "border border-border text-muted-foreground bg-transparent": variant === "outline",
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
// ALERT COMPONENT
// ==========================================
export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "destructive";
  title?: string;
}

export const Alert: React.FC<AlertProps> = ({ className, variant = "info", title, children, ...props }) => {
  return (
    <div
      className={cn(
        "p-4 rounded-xl border flex flex-col gap-1 text-sm shadow-sm",
        {
          "bg-[#DBEAFE] border-[#2563EB]/10 text-[#1D4ED8]": variant === "info",
          "bg-[#DCFCE7] border-[#16A34A]/10 text-[#166534]": variant === "success",
          "bg-[#FEF3C7] border-[#F59E0B]/10 text-[#92400E]": variant === "warning",
          "bg-[#FEE2E2] border-[#DC2626]/10 text-[#991B1B]": variant === "destructive",
        },
        className
      )}
      {...props}
    >
      {title && <span className="font-bold text-sm tracking-tight leading-none mb-0.5">{title}</span>}
      <div className="leading-relaxed opacity-90 text-xs font-medium">{children}</div>
    </div>
  );
};

// ==========================================
// CARD COMPONENT
// ==========================================
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
  return (
    <div className={cn("bg-card rounded-xl border border-border shadow-sm p-6 hover:shadow-md transition-all duration-150 text-card-foreground", className)} {...props}>
      {children}
    </div>
  );
};
