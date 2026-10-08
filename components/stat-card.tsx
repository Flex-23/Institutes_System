import { Icon } from "./icon";
import { cn } from "@/lib/utils";

type Tone = "primary" | "success" | "danger" | "warning" | "info" | "neutral";

const tones: Record<Tone, { tile: string; wash: string }> = {
  primary: {
    tile: "from-[var(--color-primary)] to-[var(--color-primary-2)] shadow-[var(--color-primary)]/30",
    wash: "bg-[var(--color-primary)]/10",
  },
  success: {
    tile: "from-[var(--color-success)] to-[var(--color-success-2)] shadow-[var(--color-success)]/30",
    wash: "bg-[var(--color-success)]/10",
  },
  danger: {
    tile: "from-[var(--color-danger)] to-[var(--color-danger-2)] shadow-[var(--color-danger)]/30",
    wash: "bg-[var(--color-danger)]/10",
  },
  warning: {
    tile: "from-[var(--color-warning)] to-orange-500 shadow-[var(--color-warning)]/30",
    wash: "bg-[var(--color-warning)]/10",
  },
  info: {
    tile: "from-[var(--color-info)] to-sky-500 shadow-[var(--color-info)]/30",
    wash: "bg-[var(--color-info)]/10",
  },
  neutral: {
    tile: "from-slate-500 to-slate-600 shadow-slate-500/30",
    wash: "bg-slate-400/10",
  },
};

export function StatCard({
  label,
  value,
  icon,
  tone = "primary",
  hint,
}: {
  label: string;
  value: string | number;
  icon: string;
  tone?: Tone;
  hint?: string;
}) {
  const t = tones[tone];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[0_1px_2px_rgb(15_23_42/0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-14px_rgb(15_23_42/0.18)]">
      {/* لمسة لونية في الزاوية */}
      <div className={cn("absolute -left-8 -top-8 size-24 rounded-full blur-2xl", t.wash)} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="tnum mt-2 truncate text-xl font-extrabold text-slate-800 sm:text-2xl">{value}</div>
          {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
        </div>
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform group-hover:scale-105",
            t.tile
          )}
        >
          <Icon name={icon} className="size-5" />
        </span>
      </div>
    </div>
  );
}
