import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { getEntitlements } from "@/lib/reports";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EntitlementsPage() {
  const rows = await getEntitlements();

  const totalAccrued = rows.reduce((s, r) => s + r.accrued, 0);
  const totalPaid = rows.reduce((s, r) => s + r.salariesPaid, 0);
  const totalOwed = rows.reduce((s, r) => s + Math.max(0, r.netOwed), 0);

  return (
    <div>
      <PageHeader
        title="الاستحقاقات"
        subtitle="حصص الأساتذة من الاشتراكات (مع مراعاة التقسيم وتوجيه الخصم) مطروحاً منها الرواتب المصروفة"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="إجمالي الحصص المستحقة" value={formatMoney(totalAccrued)} icon="Scale" tone="primary" />
        <StatCard label="إجمالي الرواتب المصروفة" value={formatMoney(totalPaid)} icon="HandCoins" tone="success" />
        <StatCard label="إجمالي المتبقّي للأساتذة" value={formatMoney(totalOwed)} icon="Wallet" tone="warning" />
      </div>

      <Card className="overflow-hidden">
        <Table>
          <THead>
            <TR>
              <TH>الأستاذ</TH>
              <TH>المادة</TH>
              <TH>الحصة المستحقة</TH>
              <TH>الحصة المحصّلة فعلياً</TH>
              <TH>الرواتب المصروفة</TH>
              <TH>الصافي المتبقّي</TH>
              <TH className="text-center">التقرير</TH>
            </TR>
          </THead>
          <TBody>
            {rows.length === 0 && <EmptyRow colSpan={7} message="لا يوجد أساتذة" />}
            {rows.map((r) => (
              <TR key={r.teacherId}>
                <TD className="font-medium text-slate-800">{r.name}</TD>
                <TD className="text-slate-500">{r.subject}</TD>
                <TD className="tnum">{formatMoney(r.accrued)}</TD>
                <TD className="tnum text-slate-500">{formatMoney(r.collected)}</TD>
                <TD className="tnum text-[var(--color-success)]">{formatMoney(r.salariesPaid)}</TD>
                <TD className={`tnum font-medium ${r.netOwed > 0 ? "text-[var(--color-warning)]" : "text-[var(--color-success)]"}`}>
                  {formatMoney(r.netOwed)}
                </TD>
                <TD className="text-center">
                  <Link href={`/reports/teacher?teacherId=${r.teacherId}`} className="text-sm text-[var(--color-primary)] hover:underline">
                    عرض
                  </Link>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      <p className="mt-4 text-xs text-slate-400">
        ملاحظة: «الحصة المستحقة» تُحتسب على كامل قيمة الاشتراكات غير الملغاة، بينما «المحصّلة فعلياً» تمثّل الجزء المطابق للمبالغ المدفوعة.
      </p>
    </div>
  );
}
