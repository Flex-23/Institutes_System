import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { formatNumber } from "@/lib/format";

/**
 * ترقيم الصفحات — روابط تحافظ على باقي معاملات البحث/الترتيب.
 */
export function Pagination({
  page,
  pageSize,
  total,
  searchParams,
  basePath,
}: {
  page: number;
  pageSize: number;
  total: number;
  searchParams: Record<string, string | undefined>;
  basePath: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const buildHref = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v && k !== "page") q.set(k, v);
    }
    q.set("page", String(p));
    return `${basePath}?${q.toString()}`;
  };

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-3 text-sm text-slate-500">
      <span className="tnum">
        عرض {formatNumber(from)}–{formatNumber(to)} من {formatNumber(total)}
      </span>
      <div className="flex items-center gap-1">
        <PageLink href={buildHref(page - 1)} disabled={page <= 1}>
          <ChevronRight className="size-4" />
          السابق
        </PageLink>
        <span className="px-3 tnum">
          صفحة {formatNumber(page)} / {formatNumber(totalPages)}
        </span>
        <PageLink href={buildHref(page + 1)} disabled={page >= totalPages}>
          التالي
          <ChevronLeft className="size-4" />
        </PageLink>
      </div>
    </div>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-slate-300">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-slate-600 hover:bg-slate-50"
    >
      {children}
    </Link>
  );
}
