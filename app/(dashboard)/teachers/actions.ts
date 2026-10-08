"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ok, fail, type ActionState } from "@/lib/action-state";
import { parseAmount } from "@/lib/format";

const schema = z
  .object({
    name: z.string().trim().min(2, "الاسم مطلوب"),
    phone: z.string().trim().optional().or(z.literal("")),
    startDate: z.string().min(1, "تاريخ المباشرة مطلوب"),
    subject: z.string().trim().min(1, "المادة مطلوبة"),
    payType: z.enum(["MONTHLY_SALARY", "ENTITLEMENT"]),
    monthlySalary: z.number().int().nonnegative(),
  })
  .refine((d) => d.payType !== "MONTHLY_SALARY" || d.monthlySalary > 0, {
    message: "أدخل مبلغ الراتب الشهري",
    path: ["monthlySalary"],
  });

function parse(formData: FormData) {
  const payType = formData.get("payType");
  return schema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    startDate: formData.get("startDate"),
    subject: formData.get("subject"),
    payType,
    monthlySalary: payType === "MONTHLY_SALARY" ? parseAmount(formData.get("monthlySalary")) : 0,
  });
}

function fieldErrors(e: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of e.issues) errors[String(issue.path[0])] = issue.message;
  return errors;
}

export async function createTeacher(formData: FormData): Promise<ActionState> {
  const parsed = parse(formData);
  if (!parsed.success) return fail("تحقّق من الحقول", fieldErrors(parsed.error));
  const d = parsed.data;
  await prisma.teacher.create({
    data: {
      name: d.name,
      phone: d.phone || null,
      startDate: new Date(d.startDate),
      subject: d.subject,
      payType: d.payType,
      monthlySalary: d.monthlySalary,
    },
  });
  revalidatePath("/teachers");
  return ok("تمت إضافة الأستاذ بنجاح");
}

export async function updateTeacher(formData: FormData): Promise<ActionState> {
  const id = Number(formData.get("id"));
  const parsed = parse(formData);
  if (!parsed.success) return fail("تحقّق من الحقول", fieldErrors(parsed.error));
  const d = parsed.data;
  await prisma.teacher.update({
    where: { id },
    data: {
      name: d.name,
      phone: d.phone || null,
      startDate: new Date(d.startDate),
      subject: d.subject,
      payType: d.payType,
      monthlySalary: d.monthlySalary,
    },
  });
  revalidatePath("/teachers");
  revalidatePath(`/teachers/${id}`);
  revalidatePath("/salaries");
  revalidatePath("/entitlements");
  return ok("تم تعديل بيانات الأستاذ");
}

export async function deleteTeacher(formData: FormData): Promise<ActionState> {
  const id = Number(formData.get("id"));
  const courseCount = await prisma.course.count({ where: { teacherId: id } });
  if (courseCount > 0) {
    return fail(
      `لا يمكن حذف الأستاذ لوجود ${courseCount} دورة مرتبطة به. احذف الدورات أولاً.`
    );
  }
  await prisma.teacher.delete({ where: { id } });
  revalidatePath("/teachers");
  return ok("تم حذف الأستاذ");
}
