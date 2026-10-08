import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDateShort } from "@/lib/format";
import { remainingAmount } from "@/lib/finance";
import { INSTITUTE_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;
  const pid = Number(paymentId);

  const payment = await prisma.payment.findUnique({
    where: { id: pid },
    include: {
      subscription: {
        include: {
          student: { select: { name: true, phone: true } },
          courses: { include: { course: { select: { name: true } } } },
        },
      },
    },
  });
  if (!payment) notFound();

  const sub = payment.subscription;

  // المدفوع التراكمي حتى هذه الدفعة (بترتيب المعرّف) لحساب المتبقي وقت الوصل
  const cumulative = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { subscriptionId: sub.id, id: { lte: pid } },
  });
  const paidToDate = cumulative._sum.amount ?? 0;
  const remainingAfter = remainingAmount(sub.finalPrice, paidToDate);

  return (
    <div data-theme="light" className="mx-auto max-w-2xl bg-[var(--color-background)] p-6">
      <div className="mb-4 flex justify-end no-print">
        <PrintButton label="طباعة الوصل" />
      </div>

      <div className="print-area rounded-xl border border-[var(--color-border)] bg-white p-8 shadow-sm">
        {/* الترويسة */}
        <div className="flex items-center justify-between border-b-2 border-[var(--color-primary)] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-xl bg-[var(--color-primary)] text-2xl font-bold text-white">
              م
            </div>
            <div>
              <div className="text-xl font-bold text-slate-800">{INSTITUTE_NAME}</div>
              <div className="text-sm text-slate-500">وصل استلام قسط</div>
            </div>
          </div>
          <div className="text-left">
            <div className="text-xs text-slate-500">رقم الوصل</div>
            <div className="text-lg font-bold tnum text-[var(--color-primary)]">{payment.receiptNo}</div>
            <div className="mt-1 text-xs text-slate-500 tnum">{formatDateShort(payment.paymentDate)}</div>
          </div>
        </div>

        {/* بيانات الطالب */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Row label="اسم الطالب" value={sub.student.name} />
          <Row label="رقم الهاتف" value={sub.student.phone || "—"} />
          <Row
            label="الدورات"
            value={sub.courses.map((c) => c.course?.name ?? c.subjectName ?? "—").join("، ") || "—"}
            full
          />
        </div>

        {/* المبالغ */}
        <div className="mt-6 overflow-hidden rounded-lg border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <tbody>
              <MoneyRow label="المبلغ الكلي" value={formatMoney(sub.finalPrice)} />
              <MoneyRow label="المبلغ المدفوع (هذه الدفعة)" value={formatMoney(payment.amount)} strong />
              <MoneyRow label="إجمالي المدفوع" value={formatMoney(paidToDate)} />
              <MoneyRow label="المبلغ المتبقي" value={formatMoney(remainingAfter)} danger />
            </tbody>
          </table>
        </div>

        {payment.note && (
          <p className="mt-4 text-sm text-slate-600">ملاحظة: {payment.note}</p>
        )}

        {/* التوقيع */}
        <div className="mt-10 flex justify-between text-sm text-slate-500">
          <div className="text-center">
            <div className="mb-8">توقيع المستلم</div>
            <div className="border-t border-slate-300 px-8 pt-1">............</div>
          </div>
          <div className="text-center">
            <div className="mb-8">ختم المعهد</div>
            <div className="border-t border-slate-300 px-8 pt-1">............</div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          شكراً لكم — هذا الوصل دليل على استلام المبلغ المذكور أعلاه.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-0.5 font-medium text-slate-800">{value}</div>
    </div>
  );
}

function MoneyRow({
  label,
  value,
  strong,
  danger,
}: {
  label: string;
  value: string;
  strong?: boolean;
  danger?: boolean;
}) {
  return (
    <tr className="border-b border-[var(--color-border)] last:border-0">
      <td className="px-4 py-2.5 text-slate-600">{label}</td>
      <td
        className={`px-4 py-2.5 text-left tnum ${
          danger ? "text-[var(--color-danger)] font-bold" : strong ? "font-bold text-[var(--color-primary)]" : "text-slate-800"
        }`}
      >
        {value}
      </td>
    </tr>
  );
}
