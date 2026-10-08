import { cn } from "@/lib/utils";

type Tone = "neutral" | "primary" | "success" | "danger" | "warning" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-600",
  primary: "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
  success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  danger: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  warning: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  info: "bg-[var(--color-info-soft)] text-[var(--color-info)]",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}
