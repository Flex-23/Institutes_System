import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type Tone = "primary" | "success" | "danger" | "warning" | "info" | "neutral";

const barColors: Record<Tone, string> = {
  primary: "bg-gradient-to-l from-[var(--color-primary)] to-[var(--color-primary-2)]",
  success: "bg-gradient-to-l from-[var(--color-success)] to-[var(--color-success-2)]",
  danger: "bg-gradient-to-l from-[var(--color-danger)] to-[var(--color-danger-2)]",
  warning: "bg-gradient-to-l from-[var(--color-warning)] to-orange-500",
  info: "bg-gradient-to-l from-[var(--color-info)] to-sky-500",
  neutral: "bg-slate-400",
};

/// مخطط أعمدة أفقي بسيط (بدون مكتبات خارجية)
export function BarChart({
  items,
}: {
  items: { label: string; value: number; tone?: Tone }[];
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="text-center text-sm text-slate-400">لا توجد بيانات</p>}
      {items.map((i, idx) => (
        <div key={idx}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-slate-600">{i.label}</span>
            <span className="tnum font-medium text-slate-700">{formatMoney(i.value)}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn("h-full rounded-full", barColors[i.tone ?? "primary"])}
              style={{ width: `${Math.max(2, (i.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
