"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ok, fail, type ActionState } from "@/lib/action-state";
import { parseAmount } from "@/lib/format";

const schema = z.object({
  teacherId: z.coerce.number().int().positive("يجب اختيار الأستاذ"),
  amount: z.number().int().positive("المبلغ يجب أن يكون أكبر من صفر"),
  payoutDate: z.string().min(1, "التاريخ مطلوب"),
  note: z.string().trim().optional().or(z.literal("")),
});

export async function createSalaryPayout(formData: FormData): Promise<ActionState> {
  const parsed = schema.safeParse({
    teacherId: formData.get("teacherId"),
    amount: parseAmount(formData.get("amount")),
    payoutDate: formData.get("payoutDate"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] = i.message;
    return fail("تحقّق من الحقول", errors);
  }
  const d = parsed.data;
  await prisma.salaryPayout.create({
    data: {
      teacherId: d.teacherId,
      amount: d.amount,
      payoutDate: new Date(d.payoutDate),
      note: d.note || null,
    },
  });
  revalidatePath("/salaries");
  revalidatePath("/entitlements");
  revalidatePath(`/teachers/${d.teacherId}`);
  return ok("تم صرف الراتب بنجاح");
}

export async function deleteSalaryPayout(formData: FormData): Promise<ActionState> {
  const id = Number(formData.get("id"));
  await prisma.salaryPayout.delete({ where: { id } });
  revalidatePath("/salaries");
  revalidatePath("/entitlements");
  return ok("تم حذف سجل الراتب");
}
