import "server-only";
import { prisma } from "./prisma";
import {
  computeSubscriptionShares,
  attributeCollected,
  remainingAmount,
  type SubCourseInput,
} from "./finance";

/// نطاق شهر ميلادي [البداية، النهاية)
export function monthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}

/// حصص اشتراك واحد محسوبة + التوزيع على الأساتذة
export interface SubShare {
  subscriptionId: number;
  studentId: number;
  finalPrice: number;
  paidAmount: number;
  teacherShareTotal: number;
  instituteShareTotal: number;
  /// حصة كل أستاذ (مستحقة) من هذا الاشتراك
  perTeacherAccrued: Map<number, number>;
  /// حصة كل أستاذ من الدورات مفصّلة
  perCourse: { courseId: number; teacherId: number; teacherShare: number; instituteShare: number }[];
}

/**
 * يحمّل كل الاشتراكات غير الملغاة ويحسب حصصها (يحترم التقسيم وتوجيه الخصم).
 * أساس كل تقارير الاستحقاق والدخل.
 */
export async function computeAllShares(): Promise<SubShare[]> {
  const subs = await prisma.subscription.findMany({
    where: { status: { not: "CANCELLED" } },
    include: {
      courses: {
        include: {
          course: { select: { teacherId: true } },
        },
      },
      // ملاحظة: المواد المُدخلة يدوياً (courseId = null) تُعامَل كإيراد للمعهد فقط
    },
  });

  return subs.map((sub) => {
    const inputs: SubCourseInput[] = sub.courses.map((sc) => ({
      courseId: sc.courseId ?? 0,
      teacherId: sc.course?.teacherId ?? 0,
      price: sc.priceAtSubscription,
      teacherPercent: sc.teacherPercentAtSub,
    }));
    const shares = computeSubscriptionShares(
      inputs,
      sub.discountAmount,
      sub.discountTarget
    );

    const perTeacherAccrued = new Map<number, number>();
    for (const pc of shares.perCourse) {
      perTeacherAccrued.set(
        pc.teacherId,
        (perTeacherAccrued.get(pc.teacherId) ?? 0) + pc.teacherShare
      );
    }

    return {
      subscriptionId: sub.id,
      studentId: sub.studentId,
      finalPrice: shares.finalPrice,
      paidAmount: sub.paidAmount,
      teacherShareTotal: shares.teacherShareTotal,
      instituteShareTotal: shares.instituteShareTotal,
      perTeacherAccrued,
      perCourse: shares.perCourse,
    };
  });
}

/// مؤشرات الواجهة الرئيسية
export async function getDashboardKpis() {
  const now = new Date();
  const { start, end } = monthRange(now.getFullYear(), now.getMonth() + 1);

  const [
    totalStudents,
    totalTeachers,
    totalCourses,
    paymentsAgg,
    incomeAgg,
    expenseAgg,
    salaryAgg,
    subs,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.course.count(),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { paymentDate: { gte: start, lt: end } },
    }),
    prisma.income.aggregate({
      _sum: { amount: true },
      where: { date: { gte: start, lt: end } },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: start, lt: end } },
    }),
    prisma.salaryPayout.aggregate({
      _sum: { amount: true },
      where: { payoutDate: { gte: start, lt: end } },
    }),
    prisma.subscription.findMany({
      where: { status: { not: "CANCELLED" } },
      select: { finalPrice: true, paidAmount: true },
    }),
  ]);

  const installmentsThisMonth = paymentsAgg._sum.amount ?? 0;
  const manualIncomeThisMonth = incomeAgg._sum.amount ?? 0;
  const incomeThisMonth = installmentsThisMonth + manualIncomeThisMonth;
  const expensesThisMonth = expenseAgg._sum.amount ?? 0;
  const salariesThisMonth = salaryAgg._sum.amount ?? 0;
  const netProfit = incomeThisMonth - expensesThisMonth - salariesThisMonth;
  const outstanding = subs.reduce(
    (s, x) => s + remainingAmount(x.finalPrice, x.paidAmount),
    0
  );

  return {
    totalStudents,
    totalTeachers,
    totalCourses,
    incomeThisMonth,
    installmentsThisMonth,
    manualIncomeThisMonth,
    expensesThisMonth,
    salariesThisMonth,
    netProfit,
    outstanding,
  };
}

/// تقرير الاستحقاقات لكل أستاذ
export interface TeacherEntitlement {
  teacherId: number;
  name: string;
  subject: string;
  payType: "MONTHLY_SALARY" | "ENTITLEMENT";
  monthlySalary: number;
  accrued: number; // مستحقات: مجموع الحصص | راتب شهري: قيمة الراتب الشهري
  collected: number; // الحصة المحصّلة فعلياً (للمستحقات فقط)
  salariesPaid: number; // مستحقات: كل ما صُرف | راتب شهري: ما صُرف هذا الشهر
  netOwed: number; // accrued - salariesPaid
}

export async function getEntitlements(): Promise<TeacherEntitlement[]> {
  const now = new Date();
  const { start, end } = monthRange(now.getFullYear(), now.getMonth() + 1);

  const [teachers, shares, salariesAll, salariesMonth] = await Promise.all([
    prisma.teacher.findMany({
      select: { id: true, name: true, subject: true, payType: true, monthlySalary: true },
    }),
    computeAllShares(),
    prisma.salaryPayout.groupBy({ by: ["teacherId"], _sum: { amount: true } }),
    prisma.salaryPayout.groupBy({
      by: ["teacherId"],
      _sum: { amount: true },
      where: { payoutDate: { gte: start, lt: end } },
    }),
  ]);

  const paidAllMap = new Map(salariesAll.map((s) => [s.teacherId, s._sum.amount ?? 0]));
  const paidMonthMap = new Map(salariesMonth.map((s) => [s.teacherId, s._sum.amount ?? 0]));
  const accruedMap = new Map<number, number>();
  const collectedMap = new Map<number, number>();

  for (const sub of shares) {
    for (const [teacherId, teacherShare] of sub.perTeacherAccrued) {
      accruedMap.set(teacherId, (accruedMap.get(teacherId) ?? 0) + teacherShare);
      const collected = attributeCollected(sub.paidAmount, teacherShare, sub.finalPrice);
      collectedMap.set(teacherId, (collectedMap.get(teacherId) ?? 0) + collected);
    }
  }

  return teachers
    .map((t) => {
      if (t.payType === "MONTHLY_SALARY") {
        // راتب شهري: المستحق = الراتب، المصروف = ما صُرف هذا الشهر، المتبقّي هذا الشهر
        const paidThisMonth = paidMonthMap.get(t.id) ?? 0;
        return {
          teacherId: t.id,
          name: t.name,
          subject: t.subject,
          payType: t.payType,
          monthlySalary: t.monthlySalary,
          accrued: t.monthlySalary,
          collected: 0,
          salariesPaid: paidThisMonth,
          netOwed: t.monthlySalary - paidThisMonth,
        };
      }
      // مستحقات: المستحق = مجموع الحصص التراكمي، المصروف = كل ما صُرف
      const accrued = accruedMap.get(t.id) ?? 0;
      const salariesPaid = paidAllMap.get(t.id) ?? 0;
      return {
        teacherId: t.id,
        name: t.name,
        subject: t.subject,
        payType: t.payType,
        monthlySalary: 0,
        accrued,
        collected: collectedMap.get(t.id) ?? 0,
        salariesPaid,
        netOwed: accrued - salariesPaid,
      };
    })
    .sort((a, b) => b.netOwed - a.netOwed);
}

/// تقرير شهري
export async function getMonthlyReport(year: number, month: number) {
  const { start, end } = monthRange(year, month);
  const where = { gte: start, lt: end };

  const [payments, manualIncome, expenses, salaries, expenseRows] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amount: true }, _count: true, where: { paymentDate: where } }),
    prisma.income.aggregate({ _sum: { amount: true }, where: { date: where } }),
    prisma.expense.aggregate({ _sum: { amount: true }, where: { date: where } }),
    prisma.salaryPayout.aggregate({ _sum: { amount: true }, where: { payoutDate: where } }),
    prisma.expense.groupBy({ by: ["category"], _sum: { amount: true }, where: { date: where } }),
  ]);

  const installmentsCollected = payments._sum.amount ?? 0;
  const manualIncomeTotal = manualIncome._sum.amount ?? 0;
  const totalIncome = installmentsCollected + manualIncomeTotal;
  const totalExpenses = expenses._sum.amount ?? 0;
  const salariesPaid = salaries._sum.amount ?? 0;
  const netProfit = totalIncome - totalExpenses - salariesPaid;

  return {
    year,
    month,
    installmentsCollected,
    installmentsCount: payments._count,
    manualIncome: manualIncomeTotal,
    totalIncome,
    totalExpenses,
    salariesPaid,
    netProfit,
    expensesByCategory: expenseRows
      .map((r) => ({ category: r.category, amount: r._sum.amount ?? 0 }))
      .sort((a, b) => b.amount - a.amount),
  };
}

/// تقرير أستاذ مفصّل
export async function getTeacherReport(teacherId: number) {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: { courses: true },
  });
  if (!teacher) return null;

  const now = new Date();
  const { start, end } = monthRange(now.getFullYear(), now.getMonth() + 1);

  const [shares, salaryAgg, salaryMonthAgg] = await Promise.all([
    computeAllShares(),
    prisma.salaryPayout.aggregate({ _sum: { amount: true }, where: { teacherId } }),
    prisma.salaryPayout.aggregate({
      _sum: { amount: true },
      where: { teacherId, payoutDate: { gte: start, lt: end } },
    }),
  ]);

  const students = new Set<number>();
  const perCourseAccrued = new Map<number, number>();
  let shareAccrued = 0;
  let collected = 0;

  for (const sub of shares) {
    let teachesThisSub = false;
    for (const pc of sub.perCourse) {
      if (pc.teacherId === teacherId) {
        teachesThisSub = true;
        perCourseAccrued.set(
          pc.courseId,
          (perCourseAccrued.get(pc.courseId) ?? 0) + pc.teacherShare
        );
      }
    }
    if (teachesThisSub) {
      students.add(sub.studentId);
      const share = sub.perTeacherAccrued.get(teacherId) ?? 0;
      shareAccrued += share;
      collected += attributeCollected(sub.paidAmount, share, sub.finalPrice);
    }
  }

  const paidAll = salaryAgg._sum.amount ?? 0;
  const paidThisMonth = salaryMonthAgg._sum.amount ?? 0;
  const isMonthly = teacher.payType === "MONTHLY_SALARY";

  const accrued = isMonthly ? teacher.monthlySalary : shareAccrued;
  const salariesPaid = isMonthly ? paidThisMonth : paidAll;
  const netOwed = accrued - salariesPaid;

  return {
    teacher,
    studentCount: students.size,
    accrued,
    collected: isMonthly ? 0 : collected,
    salariesPaid,
    salariesPaidAll: paidAll,
    netOwed,
    courses: teacher.courses.map((c) => ({
      id: c.id,
      name: c.name,
      grade: c.grade,
      price: c.price,
      accrued: perCourseAccrued.get(c.id) ?? 0,
    })),
  };
}

/// عدد الطلاب (المميّزين) لكل أستاذ — يعتمد على الاشتراكات غير الملغاة
export async function getTeacherStudentCounts(): Promise<Map<number, number>> {
  const shares = await computeAllShares();
  const perTeacherStudents = new Map<number, Set<number>>();
  for (const sub of shares) {
    for (const [teacherId, share] of sub.perTeacherAccrued) {
      if (share <= 0) continue;
      if (!perTeacherStudents.has(teacherId)) perTeacherStudents.set(teacherId, new Set());
      perTeacherStudents.get(teacherId)!.add(sub.studentId);
    }
  }
  const counts = new Map<number, number>();
  for (const [teacherId, students] of perTeacherStudents) {
    counts.set(teacherId, students.size);
  }
  return counts;
}

/// تقرير الأقساط المتبقية
export async function getRemainingInstallments() {
  const subs = await prisma.subscription.findMany({
    where: { status: { not: "CANCELLED" } },
    include: {
      student: { select: { name: true, phone: true } },
      courses: { include: { course: { select: { name: true } } } },
    },
  });

  return subs
    .map((s) => ({
      subscriptionId: s.id,
      studentName: s.student.name,
      phone: s.student.phone,
      courses: s.courses.map((c) => c.course?.name ?? c.subjectName ?? "—"),
      finalPrice: s.finalPrice,
      paidAmount: s.paidAmount,
      remaining: remainingAmount(s.finalPrice, s.paidAmount),
    }))
    .filter((s) => s.remaining > 0)
    .sort((a, b) => b.remaining - a.remaining);
}
