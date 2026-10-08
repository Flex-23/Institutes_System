import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Ban } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { SearchBar } from "@/components/search-bar";
import { Pagination } from "@/components/pagination";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { prisma } from "@/lib/prisma";
import { parseListParams, PAGE_SIZE } from "@/lib/list-params";
import { formatMoney } from "@/lib/format";
import { remainingAmount } from "@/lib/finance";
import { SUB_STATUS, DISCOUNT_TARGET } from "@/lib/labels";
import { SubscriptionForm } from "./subscription-form";
import {
  createSubscription,
  updateSubscription,
  cancelSubscription,
  deleteSubscription,
} from "./actions";

export const dynamic = "force-dynamic";

const BASE = "/subscriptions";

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { q, page, raw } = parseListParams(sp);

  // قائمة الاشتراكات تخصّ التسجيل داخل الكورسات فقط.
  // الاشتراكات التي تحوي "مواد" مُدخلة يدوياً فقط (courseId = null) لا تظهر هنا،
  // بل تظهر فقط عند تسجيل الطالب داخل كورس فعلي.
  const courseEnrolled: Prisma.SubscriptionWhereInput = {
    courses: { some: { courseId: { not: null } } },
  };
  const where: Prisma.SubscriptionWhereInput = q
    ? { AND: [courseEnrolled, { student: { name: { contains: q } } }] }
    : courseEnrolled;

  const [subs, total, students, courses] = await Promise.all([
    prisma.subscription.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        student: { select: { id: true, name: true } },
        courses: { include: { course: { select: { name: true } } } },
      },
    }),
    prisma.subscription.count({ where }),
    prisma.student.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.course.findMany({
      select: { id: true, name: true, grade: true, price: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const studentOptions = students.map((s) => ({ value: String(s.id), label: s.name }));
  const courseOptions = courses.map((c) => ({
    value: String(c.id),
    label: c.name,
    hint: formatMoney(c.price),
  }));
  const coursePrices = Object.fromEntries(courses.map((c) => [String(c.id), c.price]));

  return (
    <div>
      <PageHeader
        title="الاشتراكات"
        subtitle="إنشاء الاشتراكات وتحديد الدورات والخصومات"
        actions={
          <SubscriptionForm
            action={createSubscription}
            students={studentOptions}
            courses={courseOptions}
            coursePrices={coursePrices}
          />
        }
      />

      <Card className="overflow-hidden">
        <div className="border-b border-[var(--color-border)] p-4">
          <SearchBar placeholder="بحث باسم الطالب..." />
        </div>
        <Table>
          <THead>
            <TR>
              <TH>الطالب</TH>
              <TH>الدورات</TH>
              <TH>الكلي</TH>
              <TH>الخصم</TH>
              <TH>النهائي</TH>
              <TH>المدفوع</TH>
              <TH>المتبقي</TH>
              <TH>الحالة</TH>
              <TH className="text-center">إجراءات</TH>
            </TR>
          </THead>
          <TBody>
            {subs.length === 0 && <EmptyRow colSpan={9} message="لا توجد اشتراكات" />}
            {subs.map((s) => {
              const remaining = remainingAmount(s.finalPrice, s.paidAmount);
              return (
                <TR key={s.id}>
                  <TD className="font-medium">
                    <Link href={`/students/${s.student.id}`} className="text-[var(--color-primary)] hover:underline">
                      {s.student.name}
                    </Link>
                  </TD>
                  <TD className="max-w-xs text-xs text-slate-500">
                    {s.courses.map((c) => c.course?.name ?? c.subjectName ?? "—").join("، ")}
                  </TD>
                  <TD className="tnum">{formatMoney(s.totalPrice)}</TD>
                  <TD className="tnum">
                    {s.discountAmount > 0 ? (
                      <span title={DISCOUNT_TARGET[s.discountTarget]}>{formatMoney(s.discountAmount)}</span>
                    ) : (
                      "—"
                    )}
                  </TD>
                  <TD className="tnum font-medium">{formatMoney(s.finalPrice)}</TD>
                  <TD className="tnum text-[var(--color-success)]">{formatMoney(s.paidAmount)}</TD>
                  <TD className="tnum text-[var(--color-danger)]">{formatMoney(remaining)}</TD>
                  <TD>
                    <Badge tone={SUB_STATUS[s.status].tone}>{SUB_STATUS[s.status].label}</Badge>
                  </TD>
                  <TD>
                    <div className="flex items-center justify-center gap-1">
                      <SubscriptionForm
                        action={updateSubscription}
                        students={studentOptions}
                        courses={courseOptions}
                        coursePrices={coursePrices}
                        subscription={{
                          id: s.id,
                          studentId: s.student.id,
                          discountAmount: s.discountAmount,
                          discountTarget: s.discountTarget,
                          paidAmount: s.paidAmount,
                          courseIds: s.courses
                            .filter((c) => c.courseId != null)
                            .map((c) => String(c.courseId)),
                        }}
                      />
                      {s.status !== "CANCELLED" && (
                        <ConfirmAction
                          action={cancelSubscription}
                          id={s.id}
                          title="إلغاء الاشتراك"
                          message="سيتم تعليم الاشتراك كملغى مع الاحتفاظ بسجلاته. هل تريد المتابعة؟"
                          confirmLabel="إلغاء الاشتراك"
                          confirmVariant="danger"
                          trigger={<Ban className="size-4" />}
                          triggerClassName="text-[var(--color-warning)] hover:bg-[var(--color-warning-soft)]"
                        />
                      )}
                      <ConfirmDelete action={deleteSubscription} id={s.id} />
                    </div>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} searchParams={raw} basePath={BASE} />
      </Card>
    </div>
  );
}
