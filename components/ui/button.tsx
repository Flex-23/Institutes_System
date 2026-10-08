import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-2)] text-white shadow-md shadow-[var(--color-primary)]/30 hover:shadow-lg hover:shadow-[var(--color-primary)]/40 hover:brightness-[1.08] active:brightness-95 active:scale-[0.98]",
  success:
    "bg-gradient-to-br from-[var(--color-success)] to-[var(--color-success-2)] text-white shadow-md shadow-[var(--color-success)]/30 hover:shadow-lg hover:shadow-[var(--color-success)]/40 hover:brightness-[1.08] active:brightness-95 active:scale-[0.98]",
  danger:
    "bg-gradient-to-br from-[var(--color-danger)] to-[var(--color-danger-2)] text-white shadow-md shadow-[var(--color-danger)]/30 hover:shadow-lg hover:shadow-[var(--color-danger)]/40 hover:brightness-[1.08] active:brightness-95 active:scale-[0.98]",
  secondary:
    "bg-[var(--color-elevated)] text-[var(--color-foreground)] border border-[var(--color-border)] shadow-sm hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)] active:scale-[0.98]",
  outline:
    "border border-[var(--color-border)] bg-[var(--color-card)] text-slate-700 hover:border-[var(--color-primary)]/60 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] active:scale-[0.98]",
  ghost:
    "text-slate-600 hover:bg-slate-100 hover:text-[var(--color-foreground)]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-9 w-9",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
