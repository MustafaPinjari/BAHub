import React, { forwardRef } from "react";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

// ==========================================
// BUTTON COMPONENT
// ==========================================
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "destructive" | "ghost" | "glass";
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
          "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100",
          {
            // Variants
            "bg-primary text-primary-foreground hover:bg-opacity-90 hover:shadow-md hover:shadow-primary/10": variant === "primary",
            "bg-secondary text-secondary-foreground hover:bg-opacity-90": variant === "secondary",
            "border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground": variant === "outline",
            "bg-destructive text-destructive-foreground hover:bg-opacity-90": variant === "destructive",
            "bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground": variant === "ghost",
            "glass-interactive text-foreground font-semibold hover:border-primary/50": variant === "glass",
            
            // Sizes
            "px-3 py-1.5 text-xs": size === "sm",
            "px-4 py-2 text-sm": size === "md",
            "px-6 py-3 text-base": size === "lg",
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
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            "w-full px-3 py-2 text-sm rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-muted-foreground",
            {
              "border-destructive focus:border-destructive focus:ring-destructive/20": !!error,
            },
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-destructive font-medium">{error}</span>}
        {!error && helperText && <span className="text-xs text-muted-foreground">{helperText}</span>}
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
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            "w-full px-3 py-2 text-sm rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-muted-foreground min-h-[100px]",
            {
              "border-destructive focus:border-destructive focus:ring-destructive/20": !!error,
            },
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-destructive font-medium">{error}</span>}
        {!error && helperText && <span className="text-xs text-muted-foreground">{helperText}</span>}
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
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              "w-full px-3 py-2 text-sm rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none cursor-pointer text-foreground",
              {
                "border-destructive focus:border-destructive focus:ring-destructive/20": !!error,
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
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && <span className="text-xs text-destructive font-medium">{error}</span>}
      </div>
    );
  }
);
Select.displayName = "Select";

// ==========================================
// BADGE COMPONENT
// ==========================================
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "outline" | "indigo";
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = "default", children, ...props }) => {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tracking-wide",
        {
          "bg-primary/10 text-primary": variant === "default",
          "bg-secondary text-secondary-foreground": variant === "secondary",
          "bg-emerald-500/10 text-emerald-500": variant === "success",
          "bg-amber-500/10 text-amber-500": variant === "warning",
          "bg-red-500/10 text-red-500": variant === "destructive",
          "border border-border text-foreground": variant === "outline",
          "bg-indigo-500/10 text-indigo-400": variant === "indigo",
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
        "p-4 rounded-lg border flex flex-col gap-1 text-sm shadow-sm",
        {
          "bg-blue-500/5 border-blue-500/20 text-blue-500": variant === "info",
          "bg-emerald-500/5 border-emerald-500/20 text-emerald-500": variant === "success",
          "bg-amber-500/5 border-amber-500/20 text-amber-500": variant === "warning",
          "bg-red-500/5 border-red-500/20 text-red-500": variant === "destructive",
        },
        className
      )}
      {...props}
    >
      {title && <span className="font-semibold text-base leading-none">{title}</span>}
      <div className="leading-relaxed opacity-90">{children}</div>
    </div>
  );
};

// ==========================================
// CARD COMPONENT
// ==========================================
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
  return (
    <div className={cn("glass-card p-6 shadow-md hover:shadow-lg transition-shadow duration-200", className)} {...props}>
      {children}
    </div>
  );
};
