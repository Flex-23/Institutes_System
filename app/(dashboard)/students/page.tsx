import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Eye } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { SearchBar } from "@/components/search-bar";
import { Pagination } from "@/components/pagination";
import { SortHeader } from "@/components/sort-header";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { prisma } from "@/lib/prisma";
import { parseListParams, PAGE_SIZE } from "@/lib/list-params";
import { formatMoney } from "@/lib/format";
import { remainingAmount } from "@/lib/finance";
import { cn } from "@/lib/utils";

type EnrollmentFilter = "enrolled" | "not-enrolled" | "all";
import { StudentForm } from "./student-form";
import { createStudent, updateStudent, deleteStudent } from "./actions";

export const dynamic = "force-dynamic";

const BASE = "/students";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { q, page, sort, dir, raw } = parseListParams(sp, "name");

  const filterRaw = Array.isArray(sp.filter) ? sp.filter[0] : sp.filter;
  const filter: EnrollmentFilter =
    filterRaw === "not-enrolled" || filterRaw === "all" ? filterRaw : "enrolled";

  const searchWhere: Prisma.StudentWhereInput = q
    ? { OR: [{ name: { contains: q } }, { phone: { contains: q } }] }
    : {};

  // "مشترك" = لديه اشتراك فعّال يحوي دورة/مادة واحدة على الأقل
  const enrolledCond: Prisma.StudentWhereInput = {
    subscriptions: { some: { status: { not: "CANCELLED" }, courses: { some: {} } } },
  };
  const notEnrolledCond: Prisma.StudentWhereInput = {
    subscriptions: { none: { status: { not: "CANCELLED" }, courses: { some: {} } } },
  };
  const enrollmentCond: Prisma.StudentWhereInput =
    filter === "enrolled" ? enrolledCond : filter === "not-enrolled" ? notEnrolledCond : {};

  const where: Prisma.StudentWhereInput = { AND: [searchWhere, enrollmentCond] };

  let orderBy: Prisma.StudentOrderByWithRelationInput = { name: dir };
  if (sort === "createdAt") orderBy = { createdAt: dir };

  const [students, enrolledCount, notEnrolledCount, subjects] = await Promise.all([
    prisma.student.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        subscriptions: {
          where: { status: { not: "CANCELLED" } },
          select: {
            finalPrice: true,
            paidAmount: true,
            _count: { select: { courses: true } },
          },
        },
      },
    }),
    prisma.student.count({ where: { AND: [searchWhere, enrolledCond] } }),
    prisma.student.count({ where: { AND: [searchWhere, notEnrolledCond] } }),
    prisma.subject.findMany({
      orderBy: { name: "asc" },
      select: { name: true, price: true },
    }),
  ]);

  const total =
    filter === "enrolled"
      ? enrolledCount
      : filter === "not-enrolled"
        ? notEnrolledCount
        : enrolledCount + notEnrolledCount;

  const TABS: { value: EnrollmentFilter; label: string; count: number }[] = [
    { value: "enrolled", label: "المشتركون", count: enrolledCount },
    { value: "not-enrolled", label: "غير المشتركين", count: notEnrolledCount },
    { value: "all", label: "الكل", count: enrolledCount + notEnrolledCount },
  ];

  const filterHref = (f: EnrollmentFilter) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(raw)) {
      if (v == null || k === "page" || k === "filter") continue;
      params.set(k, v);
    }
    if (f !== "enrolled") params.set("filter", f);
    const qs = params.toString();
    return qs ? `${BASE}?${qs}` : BASE;
  };

  const emptyMessage =
    filter === "not-enrolled"
      ? "لا يوجد طلاب غير مشتركين"
      : filter === "enrolled"
        ? "لا يوجد طلاب مشتركون بدورات"
        : "لا يوجد طلاب";

  const rows = students.map((s) => {
    const courseCount = s.subscriptions.reduce((n, sub) => n + sub._count.courses, 0);
    const totalPrice = s.subscriptions.reduce((n, sub) => n + sub.finalPrice, 0);
    const remaining = s.subscriptions.reduce(
      (n, sub) => n + remainingAmount(sub.finalPrice, sub.paidAmount),
      0
    );
    return { ...s, courseCount, totalPrice, remaining };
  });

  return (
    <div>
      <PageHeader
        title="الطلاب"
        subtitle="إدارة بيانات الطلاب واشتراكاتهم"
        actions={<StudentForm action={createStudent} subjects={subjects} />}
      />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] p-4">
          <div className="min-w-56 flex-1">
            <SearchBar placeholder="بحث بالاسم أو رقم الهاتف..." />
          </div>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {TABS.map((t) => (
              <Link
                key={t.value}
                href={filterHref(t.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === t.value
                    ? "bg-[var(--color-elevated)] text-[var(--color-primary)] shadow-sm"
                    : "text-slate-500 hover:text-[var(--color-primary)]"
                )}
              >
                {t.label}
                <span className="tnum rounded-full bg-black/5 px-1.5 text-[10px]">{t.count}</span>
              </Link>
            ))}
          </div>
        </div>
        <Table>
          <THead>
            <TR>
              <SortHeader label="الاسم" field="name" currentSort={sort} currentDir={dir} searchParams={raw} basePath={BASE} />
              <TH>رقم الهاتف</TH>
              <TH>عدد الدورات</TH>
              <TH>المبلغ الكلي</TH>
              <TH>المتبقي</TH>
              <TH className="text-center">إجراءات</TH>
            </TR>
          </THead>
          <TBody>
            {rows.length === 0 && <EmptyRow colSpan={6} message={emptyMessage} />}
            {rows.map((s) => (
              <TR key={s.id}>
                <TD className="font-medium">
                  <Link href={`/students/${s.id}`} className="text-[var(--color-primary)] hover:underline">
                    {s.name}
                  </Link>
                </TD>
                <TD className="tnum text-slate-500">{s.phone || "—"}</TD>
                <TD>
                  <Badge tone="info">{s.courseCount}</Badge>
                </TD>
                <TD className="tnum">{formatMoney(s.totalPrice)}</TD>
                <TD className="tnum text-[var(--color-danger)]">{formatMoney(s.remaining)}</TD>
                <TD>
                  <div className="flex items-center justify-center gap-1">
                    <Link
                      href={`/students/${s.id}`}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                      title="عرض الدورات المشترك بها"
                    >
                      <Eye className="size-4" />
                    </Link>
                    <StudentForm action={updateStudent} student={s} />
                    <ConfirmDelete action={deleteStudent} id={s.id} />
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} searchParams={raw} basePath={BASE} />
      </Card>
    </div>
  );
}
