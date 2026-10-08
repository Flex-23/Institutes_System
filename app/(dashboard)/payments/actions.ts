"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ok, fail, type ActionState } from "@/lib/action-state";
import { parseAmount } from "@/lib/format";
import { remainingAmount } from "@/lib/finance";

const schema = z.object({
  subscriptionId: z.coerce.number().int().positive(),
  amount: z.number().int().positive("المبلغ يجب أن يكون أكبر من صفر"),
  note: z.string().trim().optional().or(z.literal("")),
});

export async function createPayment(formData: FormData): Promise<ActionState> {
  const parsed = schema.safeParse({
    subscriptionId: formData.get("subscriptionId"),
    amount: parseAmount(formData.get("amount")),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] = i.message;
    return fail("تحقّق من المبلغ", errors);
  }
  const d = parsed.data;

  const sub = await prisma.subscription.findUnique({
    where: { id: d.subscriptionId },
    select: { finalPrice: true, paidAmount: true, status: true },
  });
  if (!sub) return fail("الاشتراك غير موجود");
  if (sub.status === "CANCELLED") return fail("الاشتراك ملغى");

  const remaining = remainingAmount(sub.finalPrice, sub.paidAmount);
  if (remaining <= 0) return fail("لا يوجد مبلغ متبقٍّ على هذا الاشتراك");
  if (d.amount > remaining) {
    return fail("المبلغ المدفوع يتجاوز المبلغ المتبقي");
  }

  await prisma.$transaction(async (tx) => {
    const count = await tx.payment.count();
    const receiptNo = `R-${String(count + 1).padStart(5, "0")}`;
    const paymentDate = new Date();

    await tx.payment.create({
      data: {
        subscriptionId: d.subscriptionId,
        amount: d.amount,
        note: d.note || null,
        receiptNo,
        paymentDate,
      },
    });

    const newPaid = sub.paidAmount + d.amount;
    const completed = newPaid >= sub.finalPrice && sub.finalPrice > 0;
    await tx.subscription.update({
      where: { id: d.subscriptionId },
      data: {
        paidAmount: newPaid,
        lastPaymentDate: paymentDate,
        status: completed ? "COMPLETED" : "ACTIVE",
      },
    });
  });

  revalidatePath("/payments");
  revalidatePath(`/payments/${d.subscriptionId}`);
  revalidatePath("/income");
  return ok("تم استلام القسط بنجاح");
}
