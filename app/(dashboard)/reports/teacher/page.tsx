import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { getTeacherReport } from "@/lib/reports";
import { formatMoney } from "@/lib/format";
import { TeacherPicker } from "../report-filters";

export const dynamic = "force-dynamic";

export default async function TeacherReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const teacherId = sp.teacherId ? Number(sp.teacherId) : undefined;

  const teachers = await prisma.teacher.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const report = teacherId ? await getTeacherReport(teacherId) : null;

  return (
    <div>
      <PageHeader
        title="تقرير الأستاذ"
        subtitle="تفاصيل دورات الأستاذ وحصصه ورواتبه"
        actions={<TeacherPicker teacherId={teacherId} teachers={teachers} />}
      />

      {!report && (
        <Card>
          <div className="p-12 text-center text-slate-400">اختر أستاذاً لعرض تقريره</div>
        </Card>
      )}

      {report && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="عدد الدورات" value={report.courses.length} icon="BookOpen" tone="neutral" />
            <StatCard label="عدد الطلاب" value={report.studentCount} icon="GraduationCap" tone="info" />
            <StatCard
              label={report.teacher.payType === "MONTHLY_SALARY" ? "الراتب الشهري" : "الحصة المستحقة"}
              value={formatMoney(report.accrued)}
              icon="Scale"
              tone="primary"
            />
            <StatCard
              label={report.teacher.payType === "MONTHLY_SALARY" ? "المصروف هذا الشهر" : "الرواتب المصروفة"}
              value={formatMoney(report.salariesPaid)}
              icon="HandCoins"
              tone="success"
            />
            <StatCard
              label="الصافي المتبقّي"
              value={formatMoney(report.netOwed)}
              icon="Wallet"
              tone={report.netOwed > 0 ? "warning" : "success"}
            />
          </div>

          <Card className="mt-6 overflow-hidden">
            <CardHeader>
              <CardTitle>تفصيل الدورات — {report.teacher.name}</CardTitle>
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
        </>
      )}
    </div>
  );
}
