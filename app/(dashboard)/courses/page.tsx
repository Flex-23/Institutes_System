import type { Prisma } from "@prisma/client";
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
import { grossTeacherShare, grossInstituteShare } from "@/lib/finance";
import { CourseForm } from "./course-form";
import { createCourse, updateCourse, deleteCourse } from "./actions";

export const dynamic = "force-dynamic";

const BASE = "/courses";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { q, page, sort, dir, raw } = parseListParams(sp, "name");

  const where: Prisma.CourseWhereInput = q
    ? {
        OR: [
          { name: { contains: q } },
          { grade: { contains: q } },
          { teacher: { name: { contains: q } } },
        ],
      }
    : {};

  let orderBy: Prisma.CourseOrderByWithRelationInput = { name: dir };
  if (sort === "price") orderBy = { price: dir };
  else if (sort === "grade") orderBy = { grade: dir };

  const [courses, total, teachers] = await Promise.all([
    prisma.course.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { teacher: { select: { name: true } } },
    }),
    prisma.course.count({ where }),
    prisma.teacher.findMany({
      select: { id: true, name: true, subject: true, payType: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const teacherOptions = teachers.map((t) => ({
    value: String(t.id),
    label: t.name,
    hint: t.subject,
  }));
  const teacherPayTypes: Record<string, "MONTHLY_SALARY" | "ENTITLEMENT"> = Object.fromEntries(
    teachers.map((t) => [String(t.id), t.payType])
  );

  return (
    <div>
      <PageHeader
        title="الدورات"
        subtitle="إدارة الدورات وأسعارها وحصص الأساتذة"
        actions={<CourseForm action={createCourse} teachers={teacherOptions} teacherPayTypes={teacherPayTypes} />}
      />

      <Card className="overflow-hidden">
        <div className="border-b border-[var(--color-border)] p-4">
          <SearchBar placeholder="بحث باسم الكورس أو الصف أو الأستاذ..." />
        </div>
        <Table>
          <THead>
            <TR>
              <SortHeader label="اسم الكورس" field="name" currentSort={sort} currentDir={dir} searchParams={raw} basePath={BASE} />
              <TH>الأستاذ</TH>
              <SortHeader label="الصف" field="grade" currentSort={sort} currentDir={dir} searchParams={raw} basePath={BASE} />
              <SortHeader label="السعر" field="price" currentSort={sort} currentDir={dir} searchParams={raw} basePath={BASE} />
              <TH>نسبة الأستاذ</TH>
              <TH>حصة المعهد</TH>
              <TH>حصة الأستاذ</TH>
              <TH className="text-center">إجراءات</TH>
            </TR>
          </THead>
          <TBody>
            {courses.length === 0 && <EmptyRow colSpan={8} message="لا توجد دورات" />}
            {courses.map((c) => {
              const teacherShare = grossTeacherShare(c);
              const instituteShare = grossInstituteShare(c);
              return (
                <TR key={c.id}>
                  <TD className="font-medium text-slate-800">{c.name}</TD>
                  <TD>{c.teacher.name}</TD>
                  <TD>{c.grade}</TD>
                  <TD className="tnum">{formatMoney(c.price)}</TD>
                  <TD>
                    {c.teacherPercent > 0 ? (
                      <Badge tone="info">{c.teacherPercent}%</Badge>
                    ) : (
                      <Badge tone="neutral">—</Badge>
                    )}
                  </TD>
                  <TD className="tnum">{formatMoney(instituteShare)}</TD>
                  <TD className="tnum text-[var(--color-primary)]">{formatMoney(teacherShare)}</TD>
                  <TD>
                    <div className="flex items-center justify-center gap-1">
                      <CourseForm action={updateCourse} teachers={teacherOptions} teacherPayTypes={teacherPayTypes} course={c} />
                      <ConfirmDelete action={deleteCourse} id={c.id} />
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
