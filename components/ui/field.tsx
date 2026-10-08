import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  required,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-slate-700", className)}
      {...props}
    >
      {props.children}
      {required && <span className="text-[var(--color-danger)]"> *</span>}
    </label>
  );
}

const baseField =
  "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 transition-all hover:border-[var(--color-primary)]/50 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/25 disabled:bg-slate-50 disabled:hover:border-[var(--color-border)]";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(baseField, "h-10", className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(baseField, "min-h-24", className)} {...props} />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(baseField, "h-10 cursor-pointer", className)} {...props} />
));
Select.displayName = "Select";

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 text-xs text-[var(--color-danger)]">{children}</p>;
}

export function Field({
  label,
  required,
  error,
  children,
  htmlFor,
  className,
}: {
  label?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      <FieldError>{error}</FieldError>
    </div>
  );
}
