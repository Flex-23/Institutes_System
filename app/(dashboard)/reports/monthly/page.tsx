import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { BarChart } from "@/components/bar-chart";
import { getMonthlyReport } from "@/lib/reports";
import { formatMoney, arabicMonthName } from "@/lib/format";
import { MonthYearPicker } from "../report-filters";

export const dynamic = "force-dynamic";

export default async function MonthlyReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const year = Number(sp.year) || now.getFullYear();
  const month = Number(sp.month) || now.getMonth() + 1;

  const report = await getMonthlyReport(year, month);
  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i);

  return (
    <div>
      <PageHeader
        title="تقرير شهري"
        subtitle={`ملخّص ${arabicMonthName(month)} ${year}`}
        actions={<MonthYearPicker year={year} month={month} years={years} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="إجمالي الإيرادات" value={formatMoney(report.totalIncome)} icon="TrendingUp" tone="success" />
        <StatCard label="إجمالي المصروفات" value={formatMoney(report.totalExpenses)} icon="Receipt" tone="danger" />
        <StatCard label="الرواتب المصروفة" value={formatMoney(report.salariesPaid)} icon="HandCoins" tone="neutral" />
        <StatCard
          label="صافي الربح"
          value={formatMoney(report.netProfit)}
          icon="Scale"
          tone={report.netProfit >= 0 ? "success" : "danger"}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>تفصيل الحسابات</CardTitle>
          </CardHeader>
          <Table>
            <THead>
              <TR>
                <TH>البند</TH>
                <TH>المبلغ</TH>
              </TR>
            </THead>
            <TBody>
              <TR>
                <TD>الأقساط المحصّلة ({report.installmentsCount})</TD>
                <TD className="tnum text-[var(--color-success)]">{formatMoney(report.installmentsCollected)}</TD>
              </TR>
              <TR>
                <TD>الإيرادات اليدوية</TD>
                <TD className="tnum text-[var(--color-success)]">{formatMoney(report.manualIncome)}</TD>
              </TR>
              <TR>
                <TD className="font-medium">إجمالي الإيرادات</TD>
                <TD className="tnum font-medium">{formatMoney(report.totalIncome)}</TD>
              </TR>
              <TR>
                <TD>إجمالي المصروفات</TD>
                <TD className="tnum text-[var(--color-danger)]">− {formatMoney(report.totalExpenses)}</TD>
              </TR>
              <TR>
                <TD>الرواتب المصروفة</TD>
                <TD className="tnum text-[var(--color-danger)]">− {formatMoney(report.salariesPaid)}</TD>
              </TR>
              <TR>
                <TD className="font-bold">صافي الربح</TD>
                <TD className={`tnum font-bold ${report.netProfit >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
                  {formatMoney(report.netProfit)}
                </TD>
              </TR>
            </TBody>
          </Table>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>مقارنة الإيرادات والمصروفات</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              items={[
                { label: "الإيرادات", value: report.totalIncome, tone: "success" },
                { label: "المصروفات", value: report.totalExpenses, tone: "danger" },
                { label: "الرواتب", value: report.salariesPaid, tone: "warning" },
              ]}
            />
            <div className="mt-6 border-t border-[var(--color-border)] pt-4">
              <h4 className="mb-3 text-sm font-semibold text-slate-700">المصروفات حسب الفئة</h4>
              {report.expensesByCategory.length === 0 ? (
                <p className="text-center text-sm text-slate-400">لا توجد مصروفات هذا الشهر</p>
              ) : (
                <BarChart
                  items={report.expensesByCategory.map((c) => ({
                    label: c.category,
                    value: c.amount,
                    tone: "info" as const,
                  }))}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {report.installmentsCount === 0 &&
        report.totalExpenses === 0 &&
        report.salariesPaid === 0 &&
        report.manualIncome === 0 && (
          <p className="mt-6 text-center text-sm text-slate-400">لا توجد حركات مالية في هذا الشهر</p>
        )}
    </div>
  );
}
