import Link from "next/link";
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
import { getTeacherStudentCounts } from "@/lib/reports";
import { parseListParams, PAGE_SIZE } from "@/lib/list-params";
import { formatDateShort } from "@/lib/format";
import { TeacherForm } from "./teacher-form";
import { createTeacher, updateTeacher, deleteTeacher } from "./actions";

export const dynamic = "force-dynamic";

const BASE = "/teachers";

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { q, page, sort, dir, raw } = parseListParams(sp, "name");

  const where: Prisma.TeacherWhereInput = q
    ? {
        OR: [
          { name: { contains: q } },
          { subject: { contains: q } },
          { phone: { contains: q } },
        ],
      }
    : {};

  let orderBy: Prisma.TeacherOrderByWithRelationInput = { name: dir };
  if (sort === "startDate") orderBy = { startDate: dir };
  else if (sort === "subject") orderBy = { subject: dir };
  else if (sort === "courseCount") orderBy = { courses: { _count: dir } };

  const [teachers, total, studentCounts] = await Promise.all([
    prisma.teacher.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { courses: true } } },
    }),
    prisma.teacher.count({ where }),
    getTeacherStudentCounts(),
  ]);

  return (
    <div>
      <PageHeader
        title="الأساتذة"
        subtitle="إدارة بيانات الأساتذة ومتابعة دوراتهم"
        actions={<TeacherForm action={createTeacher} />}
      />

      <Card className="overflow-hidden">
        <div className="border-b border-[var(--color-border)] p-4">
          <SearchBar placeholder="بحث بالاسم أو المادة أو الهاتف..." />
        </div>
        <Table>
          <THead>
            <TR>
              <SortHeader label="الاسم" field="name" currentSort={sort} currentDir={dir} searchParams={raw} basePath={BASE} />
              <TH>رقم الهاتف</TH>
              <SortHeader label="تاريخ المباشرة" field="startDate" currentSort={sort} currentDir={dir} searchParams={raw} basePath={BASE} />
              <SortHeader label="المادة" field="subject" currentSort={sort} currentDir={dir} searchParams={raw} basePath={BASE} />
              <SortHeader label="عدد الدورات" field="courseCount" currentSort={sort} currentDir={dir} searchParams={raw} basePath={BASE} />
              <TH>عدد الطلاب</TH>
              <TH className="text-center">إجراءات</TH>
            </TR>
          </THead>
          <TBody>
            {teachers.length === 0 && <EmptyRow colSpan={7} message="لا يوجد أساتذة" />}
            {teachers.map((t) => (
              <TR key={t.id}>
                <TD className="font-medium">
                  <Link href={`/teachers/${t.id}`} className="text-[var(--color-primary)] hover:underline">
                    {t.name}
                  </Link>
                </TD>
                <TD className="tnum text-slate-500">{t.phone || "—"}</TD>
                <TD className="tnum">{formatDateShort(t.startDate)}</TD>
                <TD>{t.subject}</TD>
                <TD>
                  <Badge tone="primary">{t._count.courses}</Badge>
                </TD>
                <TD>
                  <Badge tone="info">{studentCounts.get(t.id) ?? 0}</Badge>
                </TD>
                <TD>
                  <div className="flex items-center justify-center gap-1">
                    <TeacherForm action={updateTeacher} teacher={t} />
                    <ConfirmDelete action={deleteTeacher} id={t.id} />
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
