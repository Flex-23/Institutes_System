import Link from "next/link";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { TH } from "./ui/table";

/**
 * ترويسة عمود قابلة للترتيب (تصاعدي/تنازلي) عبر روابط تحافظ على البحث.
 */
export function SortHeader({
  label,
  field,
  currentSort,
  currentDir,
  searchParams,
  basePath,
  className,
}: {
  label: string;
  field: string;
  currentSort?: string;
  currentDir: "asc" | "desc";
  searchParams: Record<string, string | undefined>;
  basePath: string;
  className?: string;
}) {
  const active = currentSort === field;
  const nextDir = active && currentDir === "asc" ? "desc" : "asc";

  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v && k !== "sort" && k !== "dir" && k !== "page") q.set(k, v);
  }
  q.set("sort", field);
  q.set("dir", nextDir);

  return (
    <TH className={className}>
      <Link
        href={`${basePath}?${q.toString()}`}
        className="inline-flex items-center gap-1 hover:text-[var(--color-primary)]"
      >
        {label}
        {!active && <ArrowUpDown className="size-3.5 text-slate-400" />}
        {active && currentDir === "asc" && <ArrowUp className="size-3.5 text-[var(--color-primary)]" />}
        {active && currentDir === "desc" && <ArrowDown className="size-3.5 text-[var(--color-primary)]" />}
      </Link>
    </TH>
  );
}
