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
          "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none cursor-pointer",
          {
            // Variants
            "bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm border border-primary/10": variant === "primary",
            "bg-card border border-border text-foreground hover:bg-secondary hover:text-foreground shadow-sm": variant === "secondary" || variant === "outline",
            "bg-destructive hover:bg-destructive/95 text-destructive-foreground shadow-sm border border-destructive/10": variant === "destructive",
            "bg-transparent text-foreground hover:bg-secondary hover:text-foreground": variant === "ghost",
            "bg-background border border-border text-foreground hover:bg-secondary": variant === "minimal",
            
            // Sizes
            "px-3 py-1.5 text-xs": size === "sm",
            "px-4 py-2 text-sm": size === "md",
            "px-5 py-2.5 text-base": size === "lg",
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
// INPUT COMPONENT
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
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none mb-0.5">
            {label}
          </label>
        )}
        <div className="relative w-full flex items-center">
          {icon && (
            <div className="absolute left-3 text-muted-foreground/60 flex items-center justify-center pointer-events-none z-10">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={cn(
              "w-full px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border text-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none placeholder:text-muted-foreground/50 shadow-sm",
              {
                "pl-8.5": !!icon,
                "border-destructive focus:border-destructive focus:ring-destructive/10": !!error,
              },
              className
            )}
            {...props}
          />
        </div>
        {error && <span className="text-[10px] text-destructive font-bold mt-0.5">{error}</span>}
        {!error && helperText && <span className="text-[10px] text-muted-foreground mt-0.5 font-bold">{helperText}</span>}
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
      <div className="w-full flex flex-col gap-1 text-left">
        {label && (
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none mb-0.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            "w-full px-3 py-2 text-xs font-semibold rounded-lg bg-card border border-border text-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none placeholder:text-muted-foreground/50 shadow-sm min-h-[100px] leading-relaxed",
            {
              "border-destructive focus:border-destructive focus:ring-destructive/10": !!error,
            },
            className
          )}
          {...props}
        />
        {error && <span className="text-[10px] text-destructive font-bold mt-0.5">{error}</span>}
        {!error && helperText && <span className="text-[10px] text-muted-foreground mt-0.5 font-bold">{helperText}</span>}
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
  icon?: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, icon, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1 text-left">
        {label && (
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none mb-0.5">
            {label}
          </label>
        )}
        <div className="relative w-full flex items-center">
          {icon && (
            <div className="absolute left-3 text-muted-foreground/60 flex items-center justify-center pointer-events-none z-10">
              {icon}
            </div>
          )}
          <select
            ref={ref}
            className={cn(
              "w-full px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border text-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer shadow-sm pr-8",
              {
                "pl-8.5": !!icon,
                "border-destructive focus:border-destructive focus:ring-destructive/10": !!error,
              },
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-card text-foreground font-semibold">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-muted-foreground/60">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && <span className="text-[10px] text-destructive font-bold mt-0.5">{error}</span>}
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
        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide select-none transition-colors duration-150",
        {
          "bg-primary/15 border border-primary/20 text-primary": variant === "default",
          "bg-secondary text-foreground border border-border": variant === "secondary",
          "bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400": variant === "success",
          "bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400": variant === "warning",
          "bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400": variant === "destructive",
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
        "p-3 rounded-lg border flex flex-col gap-1 text-xs shadow-sm text-left transition-colors duration-150",
        {
          "bg-primary/5 border-primary/20 text-primary": variant === "info",
          "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400": variant === "success",
          "bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400": variant === "warning",
          "bg-red-500/5 border-red-500/20 text-red-600 dark:text-red-400": variant === "destructive",
        },
        className
      )}
      {...props}
    >
      {title && <span className="font-bold text-xs tracking-tight leading-none mb-0.5">{title}</span>}
      <div className="leading-relaxed opacity-95 text-[10px] font-semibold">{children}</div>
    </div>
  );
};

// ==========================================
// CARD COMPONENT
// ==========================================
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
  return (
    <div 
      className={cn(
        "bg-card rounded-xl border border-border shadow-sm p-5 hover:shadow-md hover:border-primary/20 transition-all duration-200 text-card-foreground text-left", 
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
};
