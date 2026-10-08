import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { getTeacherReport } from "@/lib/reports";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDateShort } from "@/lib/format";
import { SalaryForm } from "../../salaries/salary-form";
import { createSalaryPayout } from "../../salaries/actions";

export const dynamic = "force-dynamic";

export default async function TeacherProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teacherId = Number(id);
  const report = await getTeacherReport(teacherId);
  if (!report) notFound();

  const salaries = await prisma.salaryPayout.findMany({
    where: { teacherId },
    orderBy: { payoutDate: "desc" },
  });

  const { teacher } = report;
  const isMonthly = teacher.payType === "MONTHLY_SALARY";

  return (
    <div>
      <PageHeader
        title={teacher.name}
        subtitle={`${teacher.subject} — ${isMonthly ? "راتب شهري" : "مستحقات"} — تاريخ المباشرة: ${formatDateShort(teacher.startDate)}`}
        actions={
          <div className="flex items-center gap-2">
            <SalaryForm
              action={createSalaryPayout}
              teachers={[]}
              teacherId={teacher.id}
              netOwed={report.netOwed}
              compact
            />
            <Link href="/teachers" className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline">
              <ArrowRight className="size-4" /> رجوع للأساتذة
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="عدد الطلاب" value={report.studentCount} icon="GraduationCap" tone="info" />
        <StatCard
          label={isMonthly ? "الراتب الشهري" : "الحصة المستحقة"}
          value={formatMoney(report.accrued)}
          icon="Scale"
          tone="primary"
        />
        <StatCard
          label={isMonthly ? "المصروف هذا الشهر" : "الرواتب المصروفة"}
          value={formatMoney(report.salariesPaid)}
          icon="HandCoins"
          tone="neutral"
        />
        <StatCard
          label="الصافي المتبقّي"
          value={formatMoney(report.netOwed)}
          icon="Wallet"
          tone={report.netOwed > 0 ? "warning" : "success"}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>الدورات ({report.courses.length})</CardTitle>
          </CardHeader>
          <Table>
            <THead>
              <TR>
                <TH>الكورس</TH>
                <TH>الصف</TH>
                <TH>السعر</TH>
                <TH>الحصة المستحقة</TH>
              </TR>
            </THead>
            <TBody>
              {report.courses.length === 0 && <EmptyRow colSpan={4} message="لا توجد دورات" />}
              {report.courses.map((c) => (
                <TR key={c.id}>
                  <TD className="font-medium text-slate-800">{c.name}</TD>
                  <TD>{c.grade}</TD>
                  <TD className="tnum">{formatMoney(c.price)}</TD>
                  <TD className="tnum text-[var(--color-primary)]">{formatMoney(c.accrued)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>سجل الرواتب المصروفة</CardTitle>
          </CardHeader>
          <Table>
            <THead>
              <TR>
                <TH>التاريخ</TH>
                <TH>المبلغ</TH>
                <TH>ملاحظة</TH>
              </TR>
            </THead>
            <TBody>
              {salaries.length === 0 && <EmptyRow colSpan={3} message="لا توجد رواتب مصروفة" />}
              {salaries.map((s) => (
                <TR key={s.id}>
                  <TD className="tnum">{formatDateShort(s.payoutDate)}</TD>
                  <TD className="tnum text-[var(--color-success)]">{formatMoney(s.amount)}</TD>
                  <TD className="text-slate-500">{s.note || "—"}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
