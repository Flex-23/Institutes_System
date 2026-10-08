"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ok, fail, type ActionState } from "@/lib/action-state";
import { parseAmount } from "@/lib/format";

const schema = z.object({
  title: z.string().trim().min(2, "العنوان مطلوب"),
  amount: z.number().int().positive("المبلغ يجب أن يكون أكبر من صفر"),
  source: z.string().trim().min(1, "المصدر مطلوب"),
  date: z.string().min(1, "التاريخ مطلوب"),
  note: z.string().trim().optional().or(z.literal("")),
});

function parse(formData: FormData) {
  return schema.safeParse({
    title: formData.get("title"),
    amount: parseAmount(formData.get("amount")),
    source: formData.get("source"),
    date: formData.get("date"),
    note: formData.get("note"),
  });
}

function fieldErrors(e: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const i of e.issues) errors[String(i.path[0])] = i.message;
  return errors;
}

export async function createIncome(formData: FormData): Promise<ActionState> {
  const parsed = parse(formData);
  if (!parsed.success) return fail("تحقّق من الحقول", fieldErrors(parsed.error));
  const d = parsed.data;
  await prisma.income.create({
    data: { title: d.title, amount: d.amount, source: d.source, date: new Date(d.date), note: d.note || null },
  });
  revalidatePath("/income");
  return ok("تمت إضافة الإيراد");
}

export async function updateIncome(formData: FormData): Promise<ActionState> {
  const id = Number(formData.get("id"));
  const parsed = parse(formData);
  if (!parsed.success) return fail("تحقّق من الحقول", fieldErrors(parsed.error));
  const d = parsed.data;
  await prisma.income.update({
    where: { id },
    data: { title: d.title, amount: d.amount, source: d.source, date: new Date(d.date), note: d.note || null },
  });
  revalidatePath("/income");
  return ok("تم تعديل الإيراد");
}

export async function deleteIncome(formData: FormData): Promise<ActionState> {
  const id = Number(formData.get("id"));
  await prisma.income.delete({ where: { id } });
  revalidatePath("/income");
  return ok("تم حذف الإيراد");
}
