"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ok, fail, type ActionState } from "@/lib/action-state";
import { parseAmount } from "@/lib/format";

const schema = z.object({
  name: z.string().trim().min(2, "اسم الكورس مطلوب"),
  teacherId: z.coerce.number().int().positive("يجب اختيار الأستاذ"),
  grade: z.string().trim().min(1, "الصف الدراسي مطلوب"),
  price: z.number().int().nonnegative("السعر غير صحيح").min(1, "السعر مطلوب"),
  teacherPercent: z.number().int().min(0, "النسبة غير صحيحة").max(100, "النسبة يجب ألا تتجاوز 100%"),
});

function parse(formData: FormData) {
  return schema.safeParse({
    name: formData.get("name"),
    teacherId: formData.get("teacherId"),
    grade: formData.get("grade"),
    price: parseAmount(formData.get("price")),
    teacherPercent: parseAmount(formData.get("teacherPercent")),
  });
}

function fieldErrors(e: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of e.issues) errors[String(issue.path[0])] = issue.message;
  return errors;
}

/// أستاذ الراتب الشهري لا يأخذ حصة من الدورة => النسبة تُصفَّر دائماً
async function effectivePercent(teacherId: number, requested: number): Promise<number> {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { payType: true },
  });
  if (!teacher) return requested;
  return teacher.payType === "MONTHLY_SALARY" ? 0 : requested;
}

export async function createCourse(formData: FormData): Promise<ActionState> {
  const parsed = parse(formData);
  if (!parsed.success) return fail("تحقّق من الحقول", fieldErrors(parsed.error));
  const d = parsed.data;
  await prisma.course.create({
    data: {
      name: d.name,
      teacherId: d.teacherId,
      grade: d.grade,
      price: d.price,
      teacherPercent: await effectivePercent(d.teacherId, d.teacherPercent),
    },
  });
  revalidatePath("/courses");
  return ok("تمت إضافة الدورة بنجاح");
}

export async function updateCourse(formData: FormData): Promise<ActionState> {
  const id = Number(formData.get("id"));
  const parsed = parse(formData);
  if (!parsed.success) return fail("تحقّق من الحقول", fieldErrors(parsed.error));
  const d = parsed.data;
  await prisma.course.update({
    where: { id },
    data: {
      name: d.name,
      teacherId: d.teacherId,
      grade: d.grade,
      price: d.price,
      teacherPercent: await effectivePercent(d.teacherId, d.teacherPercent),
    },
  });
  revalidatePath("/courses");
  revalidatePath("/salaries");
  revalidatePath("/entitlements");
  return ok("تم تعديل الدورة");
}

export async function deleteCourse(formData: FormData): Promise<ActionState> {
  const id = Number(formData.get("id"));
  const used = await prisma.subscriptionCourse.count({ where: { courseId: id } });
  if (used > 0) {
    return fail(`لا يمكن حذف الدورة لارتباطها بـ ${used} اشتراك.`);
  }
  await prisma.course.delete({ where: { id } });
  revalidatePath("/courses");
  return ok("تم حذف الدورة");
}
