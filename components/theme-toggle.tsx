"use client";

import { Sun, Moon, Stars } from "lucide-react";

type Theme = "light" | "dark" | "night";

const OPTIONS: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "فاتح", Icon: Sun },
  { value: "dark", label: "داكن", Icon: Moon },
  { value: "night", label: "ليلي", Icon: Stars },
];

/**
 * مبدّل الثيم (فاتح / داكن / ليلي).
 * التمييز البصري للعنصر النشط يتم عبر CSS بناءً على data-theme (بلا حالة React)
 * لتفادي أي اختلاف عند الترطيب (hydration).
 */
export function ThemeToggle() {
  const apply = (t: Theme) => {
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem("theme", t);
    } catch {
      /* التخزين المحلي غير متاح */
    }
  };

  return (
    <div className="flex items-center gap-1 rounded-xl bg-white/5 p-1 ring-1 ring-white/10">
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          data-v={value}
          onClick={() => apply(value)}
          title={label}
          aria-label={label}
          className="theme-btn flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium"
        >
          <Icon className="size-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
