import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Printer } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDateShort } from "@/lib/format";
import { remainingAmount } from "@/lib/finance";
import { SUB_STATUS } from "@/lib/labels";
import { buildWhatsappUrl, buildPaymentMessage } from "@/lib/notifications";
import { PayForm } from "./pay-form";

export const dynamic = "force-dynamic";

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const subscriptionId = Number(id);

  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      student: { select: { id: true, name: true, phone: true } },
      courses: { include: { course: { select: { name: true } } } },
      payments: { orderBy: { paymentDate: "desc" } },
    },
  });
  if (!sub) notFound();

  const remaining = remainingAmount(sub.finalPrice, sub.paidAmount);

  return (
    <div>
      <PageHeader
        title={sub.student.name}
        subtitle={`تفاصيل الاشتراك #${sub.id} واستلام الأقساط`}
        actions={
          <Link href="/payments" className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline">
            <ArrowRight className="size-4" /> رجوع
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>
            بيانات الاشتراك{" "}
            <Badge tone={SUB_STATUS[sub.status].tone} className="mr-2">
              {SUB_STATUS[sub.status].label}
            </Badge>
          </CardTitle>
          {remaining > 0 && sub.status !== "CANCELLED" && (
            <PayForm subscriptionId={sub.id} finalPrice={sub.finalPrice} remaining={remaining} />
          )}
        </CardHeader>

        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 lg:grid-cols-6">
          <Info label="رقم الهاتف" value={sub.student.phone || "—"} />
          <Info label="عدد الدورات" value={String(sub.courses.length)} />
          <Info label="المبلغ الكلي" value={formatMoney(sub.finalPrice)} />
          <Info label="المدفوع" value={formatMoney(sub.paidAmount)} tone="success" />
          <Info label="المتبقي" value={formatMoney(remaining)} tone="danger" />
          <Info label="آخر دفعة" value={formatDateShort(sub.lastPaymentDate)} />
        </div>

        <div className="border-t border-[var(--color-border)] px-5 py-3">
          <span className="text-sm text-slate-500">الدورات: </span>
          <span className="text-sm text-slate-800">
            {sub.courses.map((c) => c.course?.name ?? c.subjectName ?? "—").join("، ")}
          </span>
        </div>
      </Card>

      <Card className="mt-6 overflow-hidden">
        <CardHeader>
          <CardTitle>سجل الأقساط المستلمة</CardTitle>
        </CardHeader>
        <Table>
          <THead>
            <TR>
              <TH>رقم الوصل</TH>
              <TH>المبلغ</TH>
              <TH>التاريخ</TH>
              <TH>ملاحظة</TH>
              <TH className="text-center">إجراءات</TH>
            </TR>
          </THead>
          <TBody>
            {sub.payments.length === 0 && <EmptyRow colSpan={5} message="لا توجد أقساط مستلمة بعد" />}
            {sub.payments.map((p) => {
              const waUrl = buildWhatsappUrl(
                sub.student.phone,
                buildPaymentMessage({
                  studentName: sub.student.name,
                  amount: p.amount,
                  remaining,
                  date: p.paymentDate,
                  receiptNo: p.receiptNo,
                })
              );
              return (
                <TR key={p.id}>
                  <TD className="tnum font-medium">{p.receiptNo}</TD>
                  <TD className="tnum text-[var(--color-success)]">{formatMoney(p.amount)}</TD>
                  <TD className="tnum">{formatDateShort(p.paymentDate)}</TD>
                  <TD className="text-slate-500">{p.note || "—"}</TD>
                  <TD>
                    <div className="flex items-center justify-center gap-1">
                      <Link href={`/receipts/${p.id}`} target="_blank">
                        <span className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                          <Printer className="size-4" /> طباعة وصل
                        </span>
                      </Link>
                      <WhatsAppButton url={waUrl} size="sm" />
                    </div>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </Card>
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
  tone?: "danger" | "success";
}) {
  const color =
    tone === "danger" ? "text-[var(--color-danger)]" : tone === "success" ? "text-[var(--color-success)]" : "text-slate-800";
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 font-semibold tnum ${color}`}>{value}</div>
    </div>
  );
}
