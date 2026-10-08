import type { Prisma } from "@prisma/client";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchBar } from "@/components/search-bar";
import { Pagination } from "@/components/pagination";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { prisma } from "@/lib/prisma";
import { parseListParams, PAGE_SIZE } from "@/lib/list-params";
import { formatMoney, formatDateShort } from "@/lib/format";
import { IncomeForm } from "./income-form";
import { createIncome, updateIncome, deleteIncome } from "./actions";

export const dynamic = "force-dynamic";

const BASE = "/income";

export default async function IncomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { q, page, raw } = parseListParams(sp, "date");

  const where: Prisma.IncomeWhereInput = q
    ? { OR: [{ title: { contains: q } }, { source: { contains: q } }] }
    : {};

  const [incomes, total, manualAgg, installmentsAgg] = await Promise.all([
    prisma.income.findMany({ where, orderBy: { date: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.income.count({ where }),
    prisma.income.aggregate({ _sum: { amount: true } }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
  ]);

  const manualTotal = manualAgg._sum.amount ?? 0;
  const installmentsTotal = installmentsAgg._sum.amount ?? 0;

  return (
    <div>
      <PageHeader
        title="الايرادات"
        subtitle="الإيرادات المشتقة من الأقساط بالإضافة إلى الإيرادات اليدوية"
        actions={<IncomeForm action={createIncome} />}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="إيراد الأقساط (إجمالي)" value={formatMoney(installmentsTotal)} icon="Wallet" tone="success" />
        <StatCard label="الإيرادات اليدوية" value={formatMoney(manualTotal)} icon="TrendingUp" tone="primary" />
        <StatCard label="إجمالي الإيرادات" value={formatMoney(installmentsTotal + manualTotal)} icon="Scale" tone="info" />
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>الإيرادات اليدوية</CardTitle>
          <div className="w-full max-w-xs">
            <SearchBar placeholder="بحث بالعنوان أو المصدر..." />
          </div>
        </CardHeader>
        <Table>
          <THead>
            <TR>
              <TH>العنوان</TH>
              <TH>المصدر</TH>
              <TH>المبلغ</TH>
              <TH>التاريخ</TH>
              <TH>ملاحظة</TH>
              <TH className="text-center">إجراءات</TH>
            </TR>
          </THead>
          <TBody>
            {incomes.length === 0 && <EmptyRow colSpan={6} message="لا توجد إيرادات يدوية" />}
            {incomes.map((i) => (
              <TR key={i.id}>
                <TD className="font-medium text-slate-800">{i.title}</TD>
                <TD><Badge tone="info">{i.source}</Badge></TD>
                <TD className="tnum text-[var(--color-success)]">{formatMoney(i.amount)}</TD>
                <TD className="tnum">{formatDateShort(i.date)}</TD>
                <TD className="text-slate-500">{i.note || "—"}</TD>
                <TD>
                  <div className="flex items-center justify-center gap-1">
                    <IncomeForm action={updateIncome} income={i} />
                    <ConfirmDelete action={deleteIncome} id={i.id} />
                  </div>
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
