import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { SearchBar } from "@/components/search-bar";
import { Pagination } from "@/components/pagination";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { parseListParams, PAGE_SIZE } from "@/lib/list-params";
import { formatMoney, formatDateShort } from "@/lib/format";
import { remainingAmount } from "@/lib/finance";

export const dynamic = "force-dynamic";

const BASE = "/payments";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { q, page, raw } = parseListParams(sp);

  // اشتراكات فعّالة عليها متبقٍّ (finalPrice > paidAmount)
  const baseWhere: Prisma.SubscriptionWhereInput = {
    status: "ACTIVE",
    ...(q ? { student: { name: { contains: q } } } : {}),
  };

  // نجلب كل الاشتراكات الفعّالة ثم نُبقي ما عليه متبقٍّ (الفلترة الحسابية في التطبيق)
  const all = await prisma.subscription.findMany({
    where: baseWhere,
    orderBy: { lastPaymentDate: "asc" },
    include: {
      student: { select: { id: true, name: true, phone: true } },
      _count: { select: { courses: true } },
    },
  });

  const owing = all
    .map((s) => ({ ...s, remaining: remainingAmount(s.finalPrice, s.paidAmount) }))
    .filter((s) => s.remaining > 0);

  const totalOutstanding = owing.reduce((n, s) => n + s.remaining, 0);
  const total = owing.length;
  const pageItems = owing.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <PageHeader title="استلام قسط" subtitle="الطلاب الذين لديهم مبالغ متبقية" />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="عدد الاشتراكات المدينة" value={total} icon="ClipboardList" tone="warning" />
        <StatCard label="إجمالي المتبقي" value={formatMoney(totalOutstanding)} icon="AlertCircle" tone="danger" />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-[var(--color-border)] p-4">
          <SearchBar placeholder="بحث باسم الطالب..." />
        </div>
        <Table>
          <THead>
            <TR>
              <TH>الاسم</TH>
              <TH>الرقم</TH>
              <TH>عدد الدورات</TH>
              <TH>المبلغ الكلي</TH>
              <TH>المتبقي</TH>
              <TH>آخر دفعة</TH>
              <TH className="text-center">التفاصيل</TH>
            </TR>
          </THead>
          <TBody>
            {pageItems.length === 0 && <EmptyRow colSpan={7} message="لا توجد مبالغ متبقية" />}
            {pageItems.map((s) => (
              <TR key={s.id}>
                <TD className="font-medium text-slate-800">{s.student.name}</TD>
                <TD className="tnum text-slate-500">{s.student.phone || "—"}</TD>
                <TD className="tnum">{s._count.courses}</TD>
                <TD className="tnum">{formatMoney(s.finalPrice)}</TD>
                <TD className="tnum font-medium text-[var(--color-danger)]">{formatMoney(s.remaining)}</TD>
                <TD className="tnum text-slate-500">{formatDateShort(s.lastPaymentDate)}</TD>
                <TD className="text-center">
                  <Link href={`/payments/${s.id}`}>
                    <Button size="sm" variant="outline">التفاصيل</Button>
                  </Link>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} searchParams={raw} basePath={BASE} />
      </Card>
    </div>
  );
}
