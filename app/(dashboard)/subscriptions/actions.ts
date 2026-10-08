"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ok, fail, type ActionState } from "@/lib/action-state";
import { parseAmount } from "@/lib/format";

const schema = z.object({
  studentId: z.coerce.number().int().positive("يجب اختيار الطالب"),
  courseIds: z.array(z.coerce.number().int().positive()).min(1, "اختر دورة واحدة على الأقل"),
  discountAmount: z.number().int().nonnegative(),
  discountTarget: z.enum(["INSTITUTE", "TEACHER", "BOTH"]),
});

function parse(formData: FormData) {
  const courseIds = formData.getAll("courseIds").map((v) => Number(v)).filter(Boolean);
  return schema.safeParse({
    studentId: formData.get("studentId"),
    courseIds,
    discountAmount: parseAmount(formData.get("discountAmount")),
    discountTarget: formData.get("discountTarget"),
  });
}

function fieldErrors(e: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of e.issues) errors[String(issue.path[0])] = issue.message;
  return errors;
}

/// يبني لقطات الدورات ويحسب المجاميع من قاعدة البيانات (server-side)
async function buildSnapshots(courseIds: number[]) {
  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    select: { id: true, price: true, teacherPercent: true },
  });
  const totalPrice = courses.reduce((s, c) => s + c.price, 0);
  return { courses, totalPrice };
}

/// أسماء الدورات التي الطالب مسجّل بها مسبقاً ضمن اشتراك غير ملغى
async function findAlreadyEnrolled(
  studentId: number,
  courseIds: number[],
  excludeSubscriptionId?: number
): Promise<string[]> {
  const rows = await prisma.subscriptionCourse.findMany({
    where: {
      courseId: { in: courseIds },
      subscription: {
        studentId,
        status: { not: "CANCELLED" },
        ...(excludeSubscriptionId ? { id: { not: excludeSubscriptionId } } : {}),
      },
    },
    select: { course: { select: { name: true } } },
  });
  return [...new Set(rows.map((r) => r.course?.name).filter((n): n is string => !!n))];
}

export async function createSubscription(formData: FormData): Promise<ActionState> {
  const parsed = parse(formData);
  if (!parsed.success) return fail("تحقّق من الحقول", fieldErrors(parsed.error));
  const d = parsed.data;

  const { courses, totalPrice } = await buildSnapshots(d.courseIds);
  if (courses.length === 0) return fail("الدورات المختارة غير موجودة");
  if (d.discountAmount > totalPrice) return fail("الخصم يتجاوز المبلغ الكلي");

  const already = await findAlreadyEnrolled(d.studentId, d.courseIds);
  if (already.length > 0) {
    return fail(`الطالب مسجّل مسبقاً في: ${already.join("، ")}`);
  }

  const finalPrice = totalPrice - d.discountAmount;

  await prisma.subscription.create({
    data: {
      studentId: d.studentId,
      totalPrice,
      discountAmount: d.discountAmount,
      discountTarget: d.discountTarget,
      finalPrice,
      paidAmount: 0,
      status: "ACTIVE",
      courses: {
        create: courses.map((c) => ({
          courseId: c.id,
          priceAtSubscription: c.price,
          teacherPercentAtSub: c.teacherPercent,
        })),
      },
    },
  });

  revalidatePath("/subscriptions");
  revalidatePath("/payments");
  return ok("تمت إضافة الاشتراك بنجاح");
}

export async function updateSubscription(formData: FormData): Promise<ActionState> {
  const id = Number(formData.get("id"));
  const parsed = parse(formData);
  if (!parsed.success) return fail("تحقّق من الحقول", fieldErrors(parsed.error));
  const d = parsed.data;

  const existing = await prisma.subscription.findUnique({ where: { id } });
  if (!existing) return fail("الاشتراك غير موجود");

  const { courses, totalPrice } = await buildSnapshots(d.courseIds);
  if (courses.length === 0) return fail("الدورات المختارة غير موجودة");
  if (d.discountAmount > totalPrice) return fail("الخصم يتجاوز المبلغ الكلي");

  const already = await findAlreadyEnrolled(d.studentId, d.courseIds, id);
  if (already.length > 0) {
    return fail(`الطالب مسجّل مسبقاً في: ${already.join("، ")}`);
  }

  const finalPrice = totalPrice - d.discountAmount;
  if (finalPrice < existing.paidAmount) {
    return fail("السعر النهائي أقل من المبلغ المدفوع مسبقاً. عدّل الدورات أو الخصم.");
  }

  const status =
    existing.status === "CANCELLED"
      ? "CANCELLED"
      : finalPrice > 0 && existing.paidAmount >= finalPrice
        ? "COMPLETED"
        : "ACTIVE";

  await prisma.$transaction([
    prisma.subscriptionCourse.deleteMany({ where: { subscriptionId: id } }),
    prisma.subscription.update({
      where: { id },
      data: {
        studentId: d.studentId,
        totalPrice,
        discountAmount: d.discountAmount,
        discountTarget: d.discountTarget,
        finalPrice,
        status,
        courses: {
          create: courses.map((c) => ({
            courseId: c.id,
            priceAtSubscription: c.price,
            teacherPercentAtSub: c.teacherPercent,
          })),
        },
      },
    }),
  ]);

  revalidatePath("/subscriptions");
  revalidatePath("/payments");
  return ok("تم تعديل الاشتراك");
}

export async function cancelSubscription(formData: FormData): Promise<ActionState> {
  const id = Number(formData.get("id"));
  await prisma.subscription.update({ where: { id }, data: { status: "CANCELLED" } });
  revalidatePath("/subscriptions");
  revalidatePath("/payments");
  return ok("تم إلغاء الاشتراك");
}

export async function deleteSubscription(formData: FormData): Promise<ActionState> {
  const id = Number(formData.get("id"));
  const sub = await prisma.subscription.findUnique({
    where: { id },
    select: { paidAmount: true },
  });
  if (!sub) return fail("الاشتراك غير موجود");
  if (sub.paidAmount > 0) {
    return fail("لا يمكن حذف اشتراك عليه دفعات. استخدم الإلغاء بدلاً من الحذف.");
  }
  await prisma.subscription.delete({ where: { id } });
  revalidatePath("/subscriptions");
  revalidatePath("/payments");
  return ok("تم حذف الاشتراك");
}
