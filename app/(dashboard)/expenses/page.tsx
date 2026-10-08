import type { Prisma } from "@prisma/client";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { SearchBar } from "@/components/search-bar";
import { Pagination } from "@/components/pagination";
import { SortHeader } from "@/components/sort-header";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { prisma } from "@/lib/prisma";
import { parseListParams, PAGE_SIZE } from "@/lib/list-params";
import { formatMoney, formatDateShort } from "@/lib/format";
import { ExpenseForm } from "./expense-form";
import { createExpense, updateExpense, deleteExpense } from "./actions";

export const dynamic = "force-dynamic";

const BASE = "/expenses";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { q, page, sort, dir, raw } = parseListParams(sp, "date");

  const where: Prisma.ExpenseWhereInput = q
    ? { OR: [{ title: { contains: q } }, { category: { contains: q } }] }
    : {};

  let orderBy: Prisma.ExpenseOrderByWithRelationInput = { date: dir };
  if (sort === "amount") orderBy = { amount: dir };
  else if (sort === "title") orderBy = { title: dir };

  const [expenses, total, agg] = await Promise.all([
    prisma.expense.findMany({ where, orderBy, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.expense.count({ where }),
    prisma.expense.aggregate({ _sum: { amount: true }, where }),
  ]);

  return (
    <div>
      <PageHeader
        title="المصروفات"
        subtitle="تسجيل ومتابعة مصروفات المعهد"
        actions={<ExpenseForm action={createExpense} />}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="إجمالي المصروفات (حسب البحث)" value={formatMoney(agg._sum.amount ?? 0)} icon="Receipt" tone="danger" />
        <StatCard label="عدد السجلات" value={total} icon="ClipboardList" tone="neutral" />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-[var(--color-border)] p-4">
          <SearchBar placeholder="بحث بالعنوان أو الفئة..." />
        </div>
        <Table>
          <THead>
            <TR>
              <SortHeader label="العنوان" field="title" currentSort={sort} currentDir={dir} searchParams={raw} basePath={BASE} />
              <TH>الفئة</TH>
              <SortHeader label="المبلغ" field="amount" currentSort={sort} currentDir={dir} searchParams={raw} basePath={BASE} />
              <SortHeader label="التاريخ" field="date" currentSort={sort} currentDir={dir} searchParams={raw} basePath={BASE} />
              <TH>ملاحظة</TH>
              <TH className="text-center">إجراءات</TH>
            </TR>
          </THead>
          <TBody>
            {expenses.length === 0 && <EmptyRow colSpan={6} message="لا توجد مصروفات" />}
            {expenses.map((e) => (
              <TR key={e.id}>
                <TD className="font-medium text-slate-800">{e.title}</TD>
                <TD><Badge tone="neutral">{e.category}</Badge></TD>
                <TD className="tnum text-[var(--color-danger)]">{formatMoney(e.amount)}</TD>
                <TD className="tnum">{formatDateShort(e.date)}</TD>
                <TD className="text-slate-500">{e.note || "—"}</TD>
                <TD>
                  <div className="flex items-center justify-center gap-1">
                    <ExpenseForm action={updateExpense} expense={e} />
                    <ConfirmDelete action={deleteExpense} id={e.id} />
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
