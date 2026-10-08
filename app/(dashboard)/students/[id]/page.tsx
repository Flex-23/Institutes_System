import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Wallet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDateShort } from "@/lib/format";
import { remainingAmount } from "@/lib/finance";
import { SUB_STATUS } from "@/lib/labels";
import { EnrollForm } from "../enroll-form";
import { enrollStudent } from "../actions";

export const dynamic = "force-dynamic";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studentId = Number(id);

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      subscriptions: {
        orderBy: { createdAt: "desc" },
        include: {
          courses: { include: { course: { select: { name: true, grade: true } } } },
          payments: { orderBy: { paymentDate: "desc" } },
        },
      },
    },
  });
  if (!student) notFound();

  const courses = await prisma.course.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, grade: true, price: true },
  });
  const courseOptions = courses.map((c) => ({
    value: String(c.id),
    label: `${c.name} — ${c.grade}`,
    hint: formatMoney(c.price),
  }));
  const coursePrices: Record<string, number> = Object.fromEntries(
    courses.map((c) => [String(c.id), c.price])
  );

  const active = student.subscriptions.filter((s) => s.status !== "CANCELLED");
  const totalPrice = active.reduce((n, s) => n + s.finalPrice, 0);
  const totalPaid = active.reduce((n, s) => n + s.paidAmount, 0);
  const totalRemaining = active.reduce(
    (n, s) => n + remainingAmount(s.finalPrice, s.paidAmount),
    0
  );

  return (
    <div>
      <PageHeader
        title={student.name}
        subtitle={`${student.phone || "بدون هاتف"} — المواليد: ${formatDateShort(student.birthDate)}`}
        actions={
          <div className="flex items-center gap-2">
            <EnrollForm
              action={enrollStudent}
              studentId={student.id}
              courses={courseOptions}
              coursePrices={coursePrices}
            />
            <Link href="/students" className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline">
              <ArrowRight className="size-4" /> رجوع للطلاب
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="المبلغ الكلي" value={formatMoney(totalPrice)} icon="ClipboardList" tone="info" />
        <StatCard label="المدفوع" value={formatMoney(totalPaid)} icon="Wallet" tone="success" />
        <StatCard label="المتبقي" value={formatMoney(totalRemaining)} icon="AlertCircle" tone="danger" />
      </div>

      <div className="mt-6 space-y-4">
        {student.subscriptions.length === 0 && (
          <Card>
            <div className="p-8 text-center text-slate-400">لا توجد اشتراكات لهذا الطالب</div>
          </Card>
        )}
        {student.subscriptions.map((sub) => {
          const remaining = remainingAmount(sub.finalPrice, sub.paidAmount);
          return (
            <Card key={sub.id}>
              <CardHeader>
                <CardTitle>
                  اشتراك #{sub.id}{" "}
                  <Badge tone={SUB_STATUS[sub.status].tone} className="mr-2">
                    {SUB_STATUS[sub.status].label}
                  </Badge>
                </CardTitle>
                {remaining > 0 && (
                  <Link href={`/payments/${sub.id}`}>
                    <Button size="sm">
                      <Wallet className="size-4" /> تسديد قسط
                    </Button>
                  </Link>
                )}
              </CardHeader>
              <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
                <Info label="المبلغ الكلي" value={formatMoney(sub.totalPrice)} />
                <Info label="الخصم" value={formatMoney(sub.discountAmount)} />
                <Info label="السعر النهائي" value={formatMoney(sub.finalPrice)} />
                <Info label="المتبقي" value={formatMoney(remaining)} tone="danger" />
              </div>
              <Table>
                <THead>
                  <TR>
                    <TH>الكورس</TH>
                    <TH>الصف</TH>
                    <TH>السعر</TH>
                  </TR>
                </THead>
                <TBody>
                  {sub.courses.length === 0 && <EmptyRow colSpan={3} />}
                  {sub.courses.map((sc) => (
                    <TR key={sc.id}>
                      <TD className="font-medium text-slate-800">{sc.course?.name ?? sc.subjectName ?? "—"}</TD>
                      <TD>{sc.course?.grade ?? "—"}</TD>
                      <TD className="tnum">{formatMoney(sc.priceAtSubscription)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "danger";
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 font-semibold tnum ${tone === "danger" ? "text-[var(--color-danger)]" : "text-slate-800"}`}>
        {value}
      </div>
    </div>
  );
}
