import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { computeSubscriptionShares, type SubCourseInput } from "../lib/finance";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 بدء بذر البيانات...");

  // تنظيف (بالترتيب الصحيح لاحترام المفاتيح الأجنبية)
  await prisma.payment.deleteMany();
  await prisma.subscriptionCourse.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.salaryPayout.deleteMany();
  await prisma.course.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.income.deleteMany();

  // ---------------- الأساتذة ----------------
  const ahmed = await prisma.teacher.create({
    data: {
      name: "أحمد الجبوري",
      phone: "07701234567",
      startDate: new Date("2023-09-01"),
      subject: "الرياضيات",
      payType: "ENTITLEMENT",
    },
  });
  const sara = await prisma.teacher.create({
    data: {
      name: "سارة العبيدي",
      phone: "07712345678",
      startDate: new Date("2024-01-15"),
      subject: "الإنكليزي",
      payType: "ENTITLEMENT",
    },
  });
  const mustafa = await prisma.teacher.create({
    data: {
      name: "مصطفى الكناني",
      phone: "07723456789",
      startDate: new Date("2022-10-10"),
      subject: "الفيزياء",
      payType: "MONTHLY_SALARY",
      monthlySalary: 500000,
    },
  });
  const noor = await prisma.teacher.create({
    data: {
      name: "نور الحسيني",
      phone: "07734567890",
      startDate: new Date("2024-09-01"),
      subject: "الكيمياء",
      payType: "ENTITLEMENT",
    },
  });

  // ---------------- الدورات ----------------
  // أحمد يأخذ حصة بالتقسيم
  const mathSixth = await prisma.course.create({
    data: {
      name: "رياضيات السادس العلمي",
      grade: "السادس العلمي",
      price: 150000,
      teacherPercent: 60, // الأستاذ يأخذ 90000
      teacherId: ahmed.id,
    },
  });
  const mathThird = await prisma.course.create({
    data: {
      name: "رياضيات الثالث متوسط",
      grade: "الثالث متوسط",
      price: 100000,
      teacherPercent: 60,
      teacherId: ahmed.id,
    },
  });
  // سارة: الحصة كاملة للأستاذ
  const englishSixth = await prisma.course.create({
    data: {
      name: "إنكليزي السادس الأدبي",
      grade: "السادس الأدبي",
      price: 120000,
      teacherPercent: 100,
      teacherId: sara.id,
    },
  });
  // مصطفى: براتب شهري — لا حصة من الدورة (النسبة 0)
  const physicsSixth = await prisma.course.create({
    data: {
      name: "فيزياء السادس العلمي",
      grade: "السادس العلمي",
      price: 130000,
      teacherPercent: 0,
      teacherId: mustafa.id,
    },
  });
  // نور: حصة نسبية
  const chemSixth = await prisma.course.create({
    data: {
      name: "كيمياء السادس العلمي",
      grade: "السادس العلمي",
      price: 130000,
      teacherPercent: 46, // ≈ 60000 للأستاذ
      teacherId: noor.id,
    },
  });

  // ---------------- الطلاب ----------------
  const students = await Promise.all(
    [
      { name: "حسين علي كريم", phone: "07801111111", birthDate: new Date("2007-03-12") },
      { name: "زينب عمار", phone: "07802222222", birthDate: new Date("2007-07-25") },
      { name: "مريم صادق", phone: "07803333333", birthDate: new Date("2008-01-05") },
      { name: "علي محمد", phone: "07804444444", birthDate: new Date("2009-11-19") },
      { name: "فاطمة حيدر", phone: "07805555555", birthDate: new Date("2007-09-30") },
      { name: "عبدالله ناصر", phone: "07806666666", birthDate: new Date("2008-06-14") },
    ].map((d) => prisma.student.create({ data: d }))
  );

  // خريطة الدورات لبناء اللقطات
  const courseMap = new Map(
    [mathSixth, mathThird, englishSixth, physicsSixth, chemSixth].map((c) => [c.id, c])
  );

  function toSubCourse(courseId: number): SubCourseInput {
    const c = courseMap.get(courseId)!;
    return {
      courseId: c.id,
      teacherId: c.teacherId,
      price: c.price,
      teacherPercent: c.teacherPercent,
    };
  }

  let receiptCounter = 1;
  const nextReceipt = () => `R-${String(receiptCounter++).padStart(5, "0")}`;

  // مساعد لإنشاء اشتراك كامل مع لقطات ودفعات
  async function createSubscription(opts: {
    studentId: number;
    courseIds: number[];
    discountAmount?: number;
    discountTarget?: "INSTITUTE" | "TEACHER" | "BOTH";
    payments?: { amount: number; date: Date }[];
  }) {
    const subCourses = opts.courseIds.map(toSubCourse);
    const shares = computeSubscriptionShares(
      subCourses,
      opts.discountAmount ?? 0,
      opts.discountTarget ?? "INSTITUTE"
    );
    const payments = opts.payments ?? [];
    const paidAmount = payments.reduce((s, p) => s + p.amount, 0);
    const lastPaymentDate =
      payments.length > 0
        ? payments.reduce((a, b) => (a.date > b.date ? a : b)).date
        : null;
    const status =
      paidAmount >= shares.finalPrice && shares.finalPrice > 0 ? "COMPLETED" : "ACTIVE";

    await prisma.subscription.create({
      data: {
        studentId: opts.studentId,
        totalPrice: shares.totalPrice,
        discountAmount: shares.discountAmount,
        discountTarget: opts.discountTarget ?? "INSTITUTE",
        finalPrice: shares.finalPrice,
        paidAmount,
        lastPaymentDate,
        status,
        courses: {
          create: subCourses.map((sc) => ({
            courseId: sc.courseId,
            priceAtSubscription: sc.price,
            teacherPercentAtSub: sc.teacherPercent,
          })),
        },
        payments: {
          create: payments.map((p) => ({
            amount: p.amount,
            paymentDate: p.date,
            receiptNo: nextReceipt(),
            note: "دفعة قسط",
          })),
        },
      },
    });
  }

  // حسين — رياضيات + فيزياء، خصم على المعهد، دفعتان
  await createSubscription({
    studentId: students[0].id,
    courseIds: [mathSixth.id, physicsSixth.id],
    discountAmount: 20000,
    discountTarget: "INSTITUTE",
    payments: [
      { amount: 100000, date: new Date("2025-09-10") },
      { amount: 60000, date: new Date("2025-10-05") },
    ],
  });

  // زينب — إنكليزي فقط، بلا خصم، مدفوع بالكامل
  await createSubscription({
    studentId: students[1].id,
    courseIds: [englishSixth.id],
    payments: [{ amount: 120000, date: new Date("2025-09-12") }],
  });

  // مريم — رياضيات ثالث متوسط، خصم على الأستاذ، دفعة واحدة جزئية
  await createSubscription({
    studentId: students[2].id,
    courseIds: [mathThird.id],
    discountAmount: 10000,
    discountTarget: "TEACHER",
    payments: [{ amount: 40000, date: new Date("2025-09-20") }],
  });

  // علي — كيمياء + رياضيات سادس، خصم على الاثنين، لم يدفع بعد
  await createSubscription({
    studentId: students[3].id,
    courseIds: [chemSixth.id, mathSixth.id],
    discountAmount: 30000,
    discountTarget: "BOTH",
    payments: [{ amount: 50000, date: new Date("2025-10-01") }],
  });

  // فاطمة — فيزياء + كيمياء، بلا خصم، دفعة كبيرة
  await createSubscription({
    studentId: students[4].id,
    courseIds: [physicsSixth.id, chemSixth.id],
    payments: [{ amount: 150000, date: new Date("2025-09-15") }],
  });

  // عبدالله — إنكليزي، بلا دفعات (مدين بالكامل)
  await createSubscription({
    studentId: students[5].id,
    courseIds: [englishSixth.id],
  });

  // ---------------- صرف رواتب ----------------
  await prisma.salaryPayout.createMany({
    data: [
      { teacherId: mustafa.id, amount: 500000, payoutDate: new Date("2025-09-30"), note: "راتب أيلول" },
      { teacherId: ahmed.id, amount: 100000, payoutDate: new Date("2025-10-02"), note: "دفعة على الحساب" },
    ],
  });

  // ---------------- المصروفات ----------------
  await prisma.expense.createMany({
    data: [
      { title: "إيجار المبنى", amount: 750000, category: "إيجار", date: new Date("2025-09-01"), note: "شهر أيلول" },
      { title: "فاتورة كهرباء", amount: 120000, category: "خدمات", date: new Date("2025-09-05") },
      { title: "قرطاسية ومطبوعات", amount: 85000, category: "لوازم", date: new Date("2025-09-18") },
      { title: "صيانة أجهزة", amount: 60000, category: "صيانة", date: new Date("2025-10-03") },
    ],
  });

  // ---------------- إيرادات يدوية ----------------
  await prisma.income.createMany({
    data: [
      { title: "بيع كتب ملازم", amount: 200000, source: "مبيعات", date: new Date("2025-09-08") },
      { title: "تأجير قاعة لدورة خارجية", amount: 150000, source: "تأجير", date: new Date("2025-09-22") },
    ],
  });

  console.log("✅ اكتمل البذر بنجاح.");
}

main()
  .catch((e) => {
    console.error("❌ فشل البذر:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
