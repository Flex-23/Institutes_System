import * as React from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">{title}</h1>
        <div className="mt-1.5 h-1 w-12 rounded-full bg-gradient-to-l from-[var(--color-primary)] to-[var(--color-primary-2)]" />
        {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
