import Link from "next/link";
import { StatCard } from "@/components/stat-card";
import { Icon } from "@/components/icon";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { getDashboardKpis, getRemainingInstallments } from "@/lib/reports";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDateShort, arabicMonthName } from "@/lib/format";

export const dynamic = "force-dynamic";

const QUICK_ACTIONS = [
  { href: "/payments", label: "استلام قسط", icon: "Wallet" },
  { href: "/students", label: "إضافة طالب", icon: "GraduationCap" },
  { href: "/receipts", label: "طباعة إشعار", icon: "Printer" },
  { href: "/reports/monthly", label: "التقرير الشهري", icon: "CalendarRange" },
] as const;

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-xs font-bold text-[var(--color-primary)]">
      {name.trim().charAt(0)}
    </span>
  );
}

export default async function DashboardPage() {
  const now = new Date();
  const [kpis, remaining, recentPayments] = await Promise.all([
    getDashboardKpis(),
    getRemainingInstallments(),
    prisma.payment.findMany({
      take: 6,
      orderBy: { paymentDate: "desc" },
      include: { subscription: { include: { student: { select: { name: true } } } } },
    }),
  ]);

  const topDebtors = remaining.slice(0, 6);
  const monthLabel = `${arabicMonthName(now.getMonth() + 1)} ${now.getFullYear()}`;

  return (
    <div>
      {/* لوحة الملخّص الرئيسية */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0c1023] p-5 text-white shadow-xl sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_300px_at_85%_-20%,rgba(124,58,237,0.4),transparent_65%),radial-gradient(500px_260px_at_15%_120%,rgba(79,70,229,0.35),transparent_65%)]" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="w-full sm:w-auto">
            <div className="text-sm text-indigo-200">ملخّص شهر {monthLabel}</div>
            <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">لوحة التحكم</h1>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {QUICK_ACTIONS.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2.5 text-sm font-medium ring-1 ring-white/15 backdrop-blur transition-colors hover:bg-white/20 sm:py-2"
                >
                  <Icon name={a.icon} className="size-4 shrink-0" />
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex w-full flex-wrap items-end gap-x-8 gap-y-3 border-t border-white/10 pt-4 sm:w-auto sm:border-0 sm:pt-0">
            <div>
              <div className="text-xs text-indigo-200">صافي الربح (هذا الشهر)</div>
              <div
                className={`tnum mt-1 text-2xl font-extrabold sm:text-3xl ${
                  kpis.netProfit >= 0 ? "text-emerald-300" : "text-red-300"
                }`}
              >
                {formatMoney(kpis.netProfit)}
              </div>
            </div>
            <div>
              <div className="text-xs text-indigo-200">الإيرادات</div>
              <div className="tnum mt-1 text-lg font-bold text-white/90">
                {formatMoney(kpis.incomeThisMonth)}
              </div>
            </div>
            <div>
              <div className="text-xs text-indigo-200">المصروفات + الرواتب</div>
              <div className="tnum mt-1 text-lg font-bold text-white/90">
                {formatMoney(kpis.expensesThisMonth + kpis.salariesThisMonth)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* مؤشرات الأداء */}
      <div className="mt-6 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <StatCard label="عدد الطلاب" value={kpis.totalStudents} icon="GraduationCap" tone="primary" />
        <StatCard label="عدد الأساتذة" value={kpis.totalTeachers} icon="Users" tone="info" />
        <StatCard label="عدد الدورات" value={kpis.totalCourses} icon="BookOpen" tone="neutral" />
        <StatCard
          label="الأقساط المتبقية"
          value={formatMoney(kpis.outstanding)}
          icon="AlertCircle"
          tone="warning"
        />
        <StatCard
          label="الإيرادات (هذا الشهر)"
          value={formatMoney(kpis.incomeThisMonth)}
          icon="TrendingUp"
          tone="success"
          hint={`أقساط: ${formatMoney(kpis.installmentsThisMonth)}`}
        />
        <StatCard
          label="المصروفات (هذا الشهر)"
          value={formatMoney(kpis.expensesThisMonth)}
          icon="Receipt"
          tone="danger"
        />
        <StatCard
          label="الرواتب المصروفة (هذا الشهر)"
          value={formatMoney(kpis.salariesThisMonth)}
          icon="HandCoins"
          tone="neutral"
        />
        <StatCard
          label="صافي الربح (هذا الشهر)"
          value={formatMoney(kpis.netProfit)}
          icon="Scale"
          tone={kpis.netProfit >= 0 ? "success" : "danger"}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>أعلى المبالغ المتبقية</CardTitle>
            <Link href="/reports/remaining" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
              عرض الكل
            </Link>
          </CardHeader>
          <Table>
            <THead>
              <TR>
                <TH>الطالب</TH>
                <TH>المتبقي</TH>
              </TR>
            </THead>
            <TBody>
              {topDebtors.length === 0 && <EmptyRow colSpan={2} message="لا توجد مبالغ متبقية" />}
              {topDebtors.map((d) => (
                <TR key={d.subscriptionId}>
                  <TD className="font-medium text-slate-800">
                    <span className="flex items-center gap-2.5">
                      <Avatar name={d.studentName} />
                      {d.studentName}
                    </span>
                  </TD>
                  <TD className="tnum font-semibold text-[var(--color-danger)]">{formatMoney(d.remaining)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>آخر الدفعات المستلمة</CardTitle>
            <Link href="/payments" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
              استلام قسط
            </Link>
          </CardHeader>
          <Table>
            <THead>
              <TR>
                <TH>الطالب</TH>
                <TH>المبلغ</TH>
                <TH>التاريخ</TH>
              </TR>
            </THead>
            <TBody>
              {recentPayments.length === 0 && <EmptyRow colSpan={3} message="لا توجد دفعات" />}
              {recentPayments.map((p) => (
                <TR key={p.id}>
                  <TD className="font-medium text-slate-800">
                    <span className="flex items-center gap-2.5">
                      <Avatar name={p.subscription.student.name} />
                      {p.subscription.student.name}
                    </span>
                  </TD>
                  <TD className="tnum font-semibold text-[var(--color-success)]">{formatMoney(p.amount)}</TD>
                  <TD className="tnum text-slate-500">{formatDateShort(p.paymentDate)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
