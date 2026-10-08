// ============================================================================
// المنطق المالي — القلب الحسابي للنظام (كل المبالغ أعداد صحيحة بالدينار)
// splits + discounts + installments + remaining balances
// ============================================================================

import type { DiscountTarget } from "@prisma/client";

/// مدخلات حساب حصة دورة واحدة
export interface CourseShareInput {
  price: number;
  /// نسبة الأستاذ من سعر الدورة (0-100). تكون 0 لأستاذ الراتب الشهري.
  teacherPercent: number;
}

/**
 * حصة الأستاذ الإجمالية من دورة واحدة (قبل أي خصم) = السعر × النسبة.
 * أساتذة الراتب الشهري نسبتهم 0 => لا حصة من الدورة.
 */
export function grossTeacherShare(c: CourseShareInput): number {
  const pct = Math.max(0, Math.min(100, c.teacherPercent));
  return Math.round((c.price * pct) / 100);
}

/// حصة المعهد الإجمالية من دورة واحدة = السعر − حصة الأستاذ
export function grossInstituteShare(c: CourseShareInput): number {
  return c.price - grossTeacherShare(c);
}

/**
 * توزيع مبلغ صحيح على عناصر بحسب أوزان، مع ضمان أن المجموع = المبلغ تماماً.
 * البواقي تُسنَد للعناصر ذات الأوزان الأكبر.
 */
export function distributeProportionally(total: number, weights: number[]): number[] {
  const weightSum = weights.reduce((a, b) => a + b, 0);
  if (total <= 0 || weightSum <= 0) return weights.map(() => 0);

  const raw = weights.map((w) => (total * w) / weightSum);
  const floored = raw.map((r) => Math.floor(r));
  let remainder = total - floored.reduce((a, b) => a + b, 0);

  // رتّب الفهارس تنازلياً حسب الكسر العشري لإسناد البواقي
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);

  const result = [...floored];
  let k = 0;
  while (remainder > 0 && order.length > 0) {
    result[order[k % order.length].i] += 1;
    remainder -= 1;
    k += 1;
  }
  return result;
}

/// نتيجة حساب حصة دورة داخل اشتراك بعد توزيع الخصم
export interface CourseShareResult {
  teacherId: number;
  courseId: number;
  price: number;
  teacherShare: number; // بعد الخصم
  instituteShare: number; // بعد الخصم
}

/// مدخلات دورة داخل اشتراك (تُستخدم اللقطة المخزّنة وقت الاشتراك)
export interface SubCourseInput extends CourseShareInput {
  courseId: number;
  teacherId: number;
}

export interface SubscriptionSharesResult {
  totalPrice: number;
  discountAmount: number;
  finalPrice: number;
  teacherShareTotal: number;
  instituteShareTotal: number;
  perCourse: CourseShareResult[];
}

/**
 * يحسب حصص المعهد والأساتذة لاشتراك كامل بعد تطبيق الخصم وجهته.
 * القاعدة: teacherShareTotal + instituteShareTotal = finalPrice.
 * توجيه الخصم يحدّد من يتحمّله فعلياً في حسابات الاستحقاق.
 */
export function computeSubscriptionShares(
  courses: SubCourseInput[],
  discountAmount: number,
  discountTarget: DiscountTarget
): SubscriptionSharesResult {
  const totalPrice = courses.reduce((sum, c) => sum + c.price, 0);
  const discount = Math.max(0, Math.min(discountAmount, totalPrice));
  const finalPrice = totalPrice - discount;

  const grossTeacher = courses.map((c) => grossTeacherShare(c));
  const grossInstitute = courses.map((c) => grossInstituteShare(c));
  const grossTeacherTotal = grossTeacher.reduce((a, b) => a + b, 0);
  const grossInstituteTotal = grossInstitute.reduce((a, b) => a + b, 0);

  // كم يتحمّل كل طرف من إجمالي الخصم
  let teacherDiscount = 0;
  let instituteDiscount = 0;
  if (discountTarget === "TEACHER") {
    teacherDiscount = discount;
  } else if (discountTarget === "INSTITUTE") {
    instituteDiscount = discount;
  } else {
    // BOTH — بالتساوي (الباقي الفردي يتحمّله المعهد)
    teacherDiscount = Math.floor(discount / 2);
    instituteDiscount = discount - teacherDiscount;
  }

  // لا يمكن أن يتجاوز الخصم حصة الطرف؛ الفائض ينتقل للطرف الآخر
  if (teacherDiscount > grossTeacherTotal) {
    instituteDiscount += teacherDiscount - grossTeacherTotal;
    teacherDiscount = grossTeacherTotal;
  }
  if (instituteDiscount > grossInstituteTotal) {
    teacherDiscount += instituteDiscount - grossInstituteTotal;
    instituteDiscount = grossInstituteTotal;
  }

  const teacherDiscountAlloc = distributeProportionally(teacherDiscount, grossTeacher);
  const instituteDiscountAlloc = distributeProportionally(
    instituteDiscount,
    grossInstitute
  );

  const perCourse: CourseShareResult[] = courses.map((c, i) => ({
    courseId: c.courseId,
    teacherId: c.teacherId,
    price: c.price,
    teacherShare: grossTeacher[i] - teacherDiscountAlloc[i],
    instituteShare: grossInstitute[i] - instituteDiscountAlloc[i],
  }));

  const teacherShareTotal = perCourse.reduce((s, c) => s + c.teacherShare, 0);
  const instituteShareTotal = perCourse.reduce((s, c) => s + c.instituteShare, 0);

  return {
    totalPrice,
    discountAmount: discount,
    finalPrice,
    teacherShareTotal,
    instituteShareTotal,
    perCourse,
  };
}

/// المتبقّي على اشتراك
export function remainingAmount(finalPrice: number, paidAmount: number): number {
  return Math.max(0, finalPrice - paidAmount);
}

/**
 * توزيع مبلغ محصّل (المدفوع) على الحصص بنسبة كل حصة من السعر النهائي.
 * يُستخدم لمعرفة كم من المحصّل يخص المعهد وكم يخص كل أستاذ.
 */
export function attributeCollected(
  collected: number,
  shareOfFinal: number,
  finalPrice: number
): number {
  if (finalPrice <= 0) return 0;
  return Math.round((collected * shareOfFinal) / finalPrice);
}
