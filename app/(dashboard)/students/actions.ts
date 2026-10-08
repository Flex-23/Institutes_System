"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ok, fail, type ActionState } from "@/lib/action-state";

const schema = z.object({
  name: z.string().trim().min(2, "اسم الطالب مطلوب"),
  phone: z.string().trim().optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
});

function parse(formData: FormData) {
  return schema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    birthDate: formData.get("birthDate"),
  });
}

function fieldErrors(e: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of e.issues) errors[String(issue.path[0])] = issue.message;
  return errors;
}

function readCourseIds(formData: FormData): number[] {
  return formData
    .getAll("courseIds")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0);
}

/// يقرأ المواد المُدخلة يدوياً (اسم + سعر) ويطابقها بالترتيب
function readSubjects(formData: FormData): { name: string; price: number }[] {
  const names = formData.getAll("subjectName").map((v) => String(v).trim());
  const prices = formData.getAll("subjectPrice").map((v) => {
    const n = Math.round(Number(String(v).replace(/[^0-9.-]/g, "")));
    return Number.isFinite(n) ? n : 0;
  });
  return names
    .map((name, i) => ({ name, price: prices[i] ?? 0 }))
    .filter((s) => s.name.length > 0);
}

/// يبني لقطات الدورات (سعر/تقسيم) ويحسب المجموع من قاعدة البيانات (server-side)
async function buildCourseSnapshots(courseIds: number[]) {
  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    select: { id: true, price: true, teacherPercent: true },
  });
  const totalPrice = courses.reduce((s, c) => s + c.price, 0);
  return {
    totalPrice,
    create: courses.map((c) => ({
      courseId: c.id,
      priceAtSubscription: c.price,
      teacherPercentAtSub: c.teacherPercent,
    })),
    found: courses.length,
  };
}

/// يحفظ المواد الجديدة/المحدّثة في مخزن الاقتراحات (اسم فريد + آخر سعر)
async function rememberSubjects(subjects: { name: string; price: number }[]) {
  await Promise.all(
    subjects.map((s) =>
      prisma.subject.upsert({
        where: { name: s.name },
        create: { name: s.name, price: s.price },
        update: { price: s.price },
      })
    )
  );
}

export async function createStudent(formData: FormData): Promise<ActionState> {
  const parsed = parse(formData);
  if (!parsed.success) return fail("تحقّق من الحقول", fieldErrors(parsed.error));
  const d = parsed.data;

  const subjects = readSubjects(formData);

  // عند إدخال مواد: أنشئ الطالب واشتراكه بالمواد المُدخلة يدوياً في عملية واحدة
  if (subjects.length > 0) {
    const totalPrice = subjects.reduce((s, x) => s + x.price, 0);
    await prisma.student.create({
      data: {
        name: d.name,
        phone: d.phone || null,
        birthDate: d.birthDate ? new Date(d.birthDate) : null,
        subscriptions: {
          create: {
            totalPrice,
            discountAmount: 0,
            discountTarget: "INSTITUTE",
            finalPrice: totalPrice,
            paidAmount: 0,
            status: "ACTIVE",
            courses: {
              create: subjects.map((s) => ({
                subjectName: s.name,
                priceAtSubscription: s.price,
                teacherPercentAtSub: 0,
              })),
            },
          },
        },
      },
    });

    // خزّن المواد لتظهر كاقتراحات لاحقاً
    await rememberSubjects(subjects);

    revalidatePath("/students");
    revalidatePath("/subscriptions");
    revalidatePath("/payments");
    return ok("تمت إضافة الطالب وتسجيل المواد");
  }

  await prisma.student.create({
    data: {
      name: d.name,
      phone: d.phone || null,
      birthDate: d.birthDate ? new Date(d.birthDate) : null,
    },
  });
  revalidatePath("/students");
  return ok("تمت إضافة الطالب بنجاح");
}

export async function updateStudent(formData: FormData): Promise<ActionState> {
  const id = Number(formData.get("id"));
  const parsed = parse(formData);
  if (!parsed.success) return fail("تحقّق من الحقول", fieldErrors(parsed.error));
  const d = parsed.data;
  await prisma.student.update({
    where: { id },
    data: {
      name: d.name,
      phone: d.phone || null,
      birthDate: d.birthDate ? new Date(d.birthDate) : null,
    },
  });
  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  return ok("تم تعديل بيانات الطالب");
}

/// تسجيل طالب موجود في دورة/دورات (إنشاء اشتراك جديد)
export async function enrollStudent(formData: FormData): Promise<ActionState> {
  const studentId = Number(formData.get("studentId"));
  if (!Number.isInteger(studentId) || studentId <= 0) return fail("الطالب غير محدّد");

  const courseIds = readCourseIds(formData);
  if (courseIds.length === 0) {
    return fail("تحقّق من الحقول", { courseIds: "اختر دورة واحدة على الأقل" });
  }

  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { id: true } });
  if (!student) return fail("الطالب غير موجود");

  const snap = await buildCourseSnapshots(courseIds);
  if (snap.found === 0) return fail("الدورات المختارة غير موجودة");

  // منع تسجيل الطالب في دورة هو مسجّل بها مسبقاً (اشتراك غير ملغى)
  const enrolled = await prisma.subscriptionCourse.findMany({
    where: {
      courseId: { in: courseIds },
      subscription: { studentId, status: { not: "CANCELLED" } },
    },
    select: { course: { select: { name: true } } },
  });
  if (enrolled.length > 0) {
    const names = [...new Set(enrolled.map((r) => r.course?.name).filter((n): n is string => !!n))];
    return fail(`الطالب مسجّل مسبقاً في: ${names.join("، ")}`);
  }

  await prisma.subscription.create({
    data: {
      studentId,
      totalPrice: snap.totalPrice,
      discountAmount: 0,
      discountTarget: "INSTITUTE",
      finalPrice: snap.totalPrice,
      paidAmount: 0,
      status: "ACTIVE",
      courses: { create: snap.create },
    },
  });

  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/subscriptions");
  revalidatePath("/payments");
  return ok("تم تسجيل الطالب في الدورات");
}

export async function deleteStudent(formData: FormData): Promise<ActionState> {
  const id = Number(formData.get("id"));
  const subs = await prisma.subscription.count({ where: { studentId: id } });
  if (subs > 0) {
    return fail(`لا يمكن حذف الطالب لوجود ${subs} اشتراك. ألغِ الاشتراكات أولاً.`);
  }
  await prisma.student.delete({ where: { id } });
  revalidatePath("/students");
  return ok("تم حذف الطالب");
}
