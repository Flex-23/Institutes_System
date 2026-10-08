import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { CsvExport } from "@/components/csv-export";
import { PrintButton } from "@/components/print-button";
import { getRemainingInstallments } from "@/lib/reports";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RemainingReportPage() {
  const rows = await getRemainingInstallments(); // مرتّبة تنازلياً حسب المتبقي
  const totalRemaining = rows.reduce((s, r) => s + r.remaining, 0);
  const totalFinal = rows.reduce((s, r) => s + r.finalPrice, 0);
  const totalPaid = rows.reduce((s, r) => s + r.paidAmount, 0);

  const csvRows = rows.map((r) => [
    r.studentName,
    r.phone ?? "",
    r.courses.join(" | "),
    r.finalPrice,
    r.paidAmount,
    r.remaining,
  ]);

  return (
    <div>
      <PageHeader
        title="تقرير الأقساط المتبقية"
        subtitle="جميع الاشتراكات التي عليها مبالغ متبقية، مرتّبة تنازلياً"
        actions={
          <div className="flex items-center gap-2 no-print">
            <CsvExport
              filename="الاقساط-المتبقية"
              headers={["الطالب", "الهاتف", "الدورات", "السعر النهائي", "المدفوع", "المتبقي"]}
              rows={csvRows}
            />
            <PrintButton label="طباعة" />
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="عدد الاشتراكات المدينة" value={rows.length} icon="ClipboardList" tone="warning" />
        <StatCard label="إجمالي المدفوع" value={formatMoney(totalPaid)} icon="Wallet" tone="success" />
        <StatCard label="إجمالي المتبقي" value={formatMoney(totalRemaining)} icon="AlertCircle" tone="danger" />
      </div>

      <Card className="overflow-hidden print-area">
        <Table>
          <THead>
            <TR>
              <TH>#</TH>
              <TH>الطالب</TH>
              <TH>الهاتف</TH>
              <TH>الدورات</TH>
              <TH>السعر النهائي</TH>
              <TH>المدفوع</TH>
              <TH>المتبقي</TH>
              <TH className="no-print text-center">تسديد</TH>
            </TR>
          </THead>
          <TBody>
            {rows.length === 0 && <EmptyRow colSpan={8} message="لا توجد أقساط متبقية" />}
            {rows.map((r, i) => (
              <TR key={r.subscriptionId}>
                <TD className="tnum text-slate-400">{i + 1}</TD>
                <TD className="font-medium text-slate-800">{r.studentName}</TD>
                <TD className="tnum text-slate-500">{r.phone || "—"}</TD>
                <TD className="text-xs text-slate-500">{r.courses.join("، ")}</TD>
                <TD className="tnum">{formatMoney(r.finalPrice)}</TD>
                <TD className="tnum text-[var(--color-success)]">{formatMoney(r.paidAmount)}</TD>
                <TD className="tnum font-medium text-[var(--color-danger)]">{formatMoney(r.remaining)}</TD>
                <TD className="no-print text-center">
                  <Link href={`/payments/${r.subscriptionId}`} className="text-sm text-[var(--color-primary)] hover:underline">
                    تسديد
                  </Link>
                </TD>
              </TR>
            ))}
            {rows.length > 0 && (
              <TR className="bg-slate-50 font-bold">
                <TD colSpan={4} className="text-left">الإجمالي</TD>
                <TD className="tnum">{formatMoney(totalFinal)}</TD>
                <TD className="tnum text-[var(--color-success)]">{formatMoney(totalPaid)}</TD>
                <TD className="tnum text-[var(--color-danger)]">{formatMoney(totalRemaining)}</TD>
                <TD className="no-print" />
              </TR>
            )}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
