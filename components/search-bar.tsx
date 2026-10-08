"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, Loader2 } from "lucide-react";

export function SearchBar({ placeholder = "بحث..." }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const t = setTimeout(() => {
      const current = params.get("q") ?? "";
      if (value === current) return;
      const next = new URLSearchParams(params.toString());
      if (value) next.set("q", value);
      else next.delete("q");
      next.delete("page"); // إعادة إلى الصفحة الأولى عند البحث
      startTransition(() => router.replace(`${pathname}?${next.toString()}`));
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative w-full max-w-xs">
      <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] pr-9 pl-9 text-sm transition-all placeholder:text-slate-400 hover:border-[var(--color-primary)]/50 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/25"
      />
      {isPending && (
        <Loader2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-slate-400" />
      )}
    </div>
  );
}
