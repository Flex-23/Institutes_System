"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ok, fail, type ActionState } from "@/lib/action-state";
import { parseAmount } from "@/lib/format";

const schema = z.object({
  title: z.string().trim().min(2, "العنوان مطلوب"),
  amount: z.number().int().positive("المبلغ يجب أن يكون أكبر من صفر"),
  category: z.string().trim().min(1, "الفئة مطلوبة"),
  date: z.string().min(1, "التاريخ مطلوب"),
  note: z.string().trim().optional().or(z.literal("")),
});

function parse(formData: FormData) {
  return schema.safeParse({
    title: formData.get("title"),
    amount: parseAmount(formData.get("amount")),
    category: formData.get("category"),
    date: formData.get("date"),
    note: formData.get("note"),
  });
}

function fieldErrors(e: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const i of e.issues) errors[String(i.path[0])] = i.message;
  return errors;
}

export async function createExpense(formData: FormData): Promise<ActionState> {
  const parsed = parse(formData);
  if (!parsed.success) return fail("تحقّق من الحقول", fieldErrors(parsed.error));
  const d = parsed.data;
  await prisma.expense.create({
    data: { title: d.title, amount: d.amount, category: d.category, date: new Date(d.date), note: d.note || null },
  });
  revalidatePath("/expenses");
  return ok("تمت إضافة المصروف");
}

export async function updateExpense(formData: FormData): Promise<ActionState> {
  const id = Number(formData.get("id"));
  const parsed = parse(formData);
  if (!parsed.success) return fail("تحقّق من الحقول", fieldErrors(parsed.error));
  const d = parsed.data;
  await prisma.expense.update({
    where: { id },
    data: { title: d.title, amount: d.amount, category: d.category, date: new Date(d.date), note: d.note || null },
  });
  revalidatePath("/expenses");
  return ok("تم تعديل المصروف");
}

export async function deleteExpense(formData: FormData): Promise<ActionState> {
  const id = Number(formData.get("id"));
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/expenses");
  return ok("تم حذف المصروف");
}
