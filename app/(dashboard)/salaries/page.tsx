import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { getEntitlements } from "@/lib/reports";
import { formatMoney, formatDateShort } from "@/lib/format";
import { TEACHER_PAY_TYPE } from "@/lib/labels";
import { SalaryForm } from "./salary-form";
import { createSalaryPayout, deleteSalaryPayout } from "./actions";

export const dynamic = "force-dynamic";

export default async function SalariesPage() {
  const [entitlements, teachers, payouts] = await Promise.all([
    getEntitlements(),
    prisma.teacher.findMany({ select: { id: true, name: true, subject: true }, orderBy: { name: "asc" } }),
    prisma.salaryPayout.findMany({
      orderBy: { payoutDate: "desc" },
      take: 20,
      include: { teacher: { select: { name: true } } },
    }),
  ]);

  const teacherOptions = teachers.map((t) => ({ value: String(t.id), label: t.name, hint: t.subject }));

  return (
    <div>
      <PageHeader
        title="صرف رواتب"
        subtitle="متابعة استحقاقات الأساتذة وصرف الرواتب"
        actions={<SalaryForm action={createSalaryPayout} teachers={teacherOptions} />}
      />

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>أرصدة الأساتذة</CardTitle>
        </CardHeader>
        <Table>
          <THead>
            <TR>
              <TH>الأستاذ</TH>
              <TH>النوع</TH>
              <TH>المستحق</TH>
              <TH>المصروف</TH>
              <TH>الصافي المتبقّي</TH>
              <TH className="text-center">إجراء</TH>
            </TR>
          </THead>
          <TBody>
            {entitlements.length === 0 && <EmptyRow colSpan={6} message="لا يوجد أساتذة" />}
            {entitlements.map((e) => (
              <TR key={e.teacherId}>
                <TD className="font-medium text-slate-800">{e.name}</TD>
                <TD>
                  <Badge tone={TEACHER_PAY_TYPE[e.payType]?.tone ?? "neutral"}>
                    {TEACHER_PAY_TYPE[e.payType]?.label ?? e.payType}
                  </Badge>
                </TD>
                <TD className="tnum">{formatMoney(e.accrued)}</TD>
                <TD className="tnum text-[var(--color-success)]">{formatMoney(e.salariesPaid)}</TD>
                <TD className={`tnum font-medium ${e.netOwed > 0 ? "text-[var(--color-warning)]" : "text-[var(--color-success)]"}`}>
                  {formatMoney(e.netOwed)}
                </TD>
                <TD className="text-center">
                  <SalaryForm
                    action={createSalaryPayout}
                    teachers={teacherOptions}
                    teacherId={e.teacherId}
                    netOwed={e.netOwed}
                    compact
                  />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      <Card className="mt-6 overflow-hidden">
        <CardHeader>
          <CardTitle>آخر الرواتب المصروفة</CardTitle>
        </CardHeader>
        <Table>
          <THead>
            <TR>
              <TH>الأستاذ</TH>
              <TH>المبلغ</TH>
              <TH>التاريخ</TH>
              <TH>ملاحظة</TH>
              <TH className="text-center">حذف</TH>
            </TR>
          </THead>
          <TBody>
            {payouts.length === 0 && <EmptyRow colSpan={5} message="لا توجد رواتب مصروفة" />}
            {payouts.map((p) => (
              <TR key={p.id}>
                <TD className="font-medium text-slate-800">{p.teacher.name}</TD>
                <TD className="tnum text-[var(--color-success)]">{formatMoney(p.amount)}</TD>
                <TD className="tnum">{formatDateShort(p.payoutDate)}</TD>
                <TD className="text-slate-500">{p.note || "—"}</TD>
                <TD className="text-center">
                  <ConfirmDelete action={deleteSalaryPayout} id={p.id} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
