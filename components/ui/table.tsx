"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  const ref = useRef<HTMLDivElement>(null);

  // ينسخ نصوص الترويسة إلى data-label على كل خلية، ليحوّل CSS الصفوف
  // إلى بطاقات على الشاشات الصغيرة (انظر قواعد [data-card-table] في globals.css).
  // بلا مصفوفة تبعيات: يعاد التطبيق بعد كل تحديث للمحتوى (بحث/ترقيم صفحات).
  useEffect(() => {
    const table = ref.current?.querySelector("table");
    if (!table) return;
    const headers = Array.from(table.querySelectorAll<HTMLTableCellElement>("thead th")).map(
      (th) => th.textContent?.trim() ?? ""
    );
    for (const tr of Array.from(table.querySelectorAll<HTMLTableRowElement>("tbody tr"))) {
      Array.from(tr.cells).forEach((td, i) => {
        const label = td.colSpan === 1 ? headers[i] : "";
        if (label) td.setAttribute("data-label", label);
        else td.removeAttribute("data-label");
      });
    }
  });

  return (
    <div ref={ref} data-card-table className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("bg-slate-50/80 text-slate-500", className)} {...props} />;
}

export function TBody(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export function TR({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-b border-[var(--color-border)] transition-colors last:border-0 hover:bg-[var(--color-primary-soft)]/30",
        className
      )}
      {...props}
    />
  );
}

export function TH({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn("whitespace-nowrap px-4 py-3 text-right text-xs font-bold", className)}
      {...props}
    />
  );
}

export function TD({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("px-4 py-3 text-right align-middle text-slate-700", className)} {...props} />
  );
}

export function EmptyRow({ colSpan, message = "لا توجد بيانات" }: { colSpan: number; message?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-14 text-center">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Inbox className="size-5" />
          </span>
          <span className="text-sm">{message}</span>
        </div>
      </td>
    </tr>
  );
}
