import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Printer } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/search-bar";
import { Pagination } from "@/components/pagination";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { prisma } from "@/lib/prisma";
import { parseListParams, PAGE_SIZE } from "@/lib/list-params";
import { formatMoney, formatDateShort } from "@/lib/format";
import { remainingAmount } from "@/lib/finance";
import { buildPaymentMessage, buildWhatsappUrl } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const BASE = "/receipts";

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { q, page, raw } = parseListParams(sp);

  const where: Prisma.PaymentWhereInput = q
    ? {
        OR: [
          { receiptNo: { contains: q } },
          { subscription: { student: { name: { contains: q } } } },
        ],
      }
    : {};

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { paymentDate: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        subscription: {
          select: {
            finalPrice: true,
            paidAmount: true,
            student: { select: { name: true, phone: true } },
          },
        },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return (
    <div>
      <PageHeader
        title="طباعة إشعار دفع"
        subtitle="اختر دفعة لطباعة إشعار الاستلام أو إرساله للطالب"
      />

      <Card className="overflow-hidden">
        <div className="border-b border-[var(--color-border)] p-4">
          <SearchBar placeholder="بحث برقم الوصل أو اسم الطالب..." />
        </div>
        <Table>
          <THead>
            <TR>
              <TH>رقم الوصل</TH>
              <TH>الطالب</TH>
              <TH>المبلغ المدفوع</TH>
              <TH>التاريخ</TH>
              <TH className="text-center">الإجراءات</TH>
            </TR>
          </THead>
          <TBody>
            {payments.length === 0 && <EmptyRow colSpan={5} message="لا توجد دفعات مسجّلة" />}
            {payments.map((p) => {
              const sub = p.subscription;
              const remaining = remainingAmount(sub.finalPrice, sub.paidAmount);
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
                  <TD className="tnum font-medium text-[var(--color-primary)]">{p.receiptNo}</TD>
                  <TD className="font-medium text-slate-800">{sub.student.name}</TD>
                  <TD className="tnum text-[var(--color-success)]">{formatMoney(p.amount)}</TD>
                  <TD className="tnum text-slate-500">{formatDateShort(p.paymentDate)}</TD>
                  <TD>
                    <div className="flex items-center justify-center gap-2">
                      <Link href={`/receipts/${p.id}`} target="_blank">
                        <Button size="sm" variant="outline">
                          <Printer className="size-4" /> طباعة الإشعار
                        </Button>
                      </Link>
                      <WhatsAppButton url={waUrl} size="sm" />
                    </div>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} searchParams={raw} basePath={BASE} />
      </Card>
    </div>
  );
}
