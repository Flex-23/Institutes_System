"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/field";
import { arabicMonthName } from "@/lib/format";

export function MonthYearPicker({
  year,
  month,
  years,
}: {
  year: number;
  month: number;
  years: number[];
}) {
  const router = useRouter();
  const go = (y: number, m: number) => router.push(`/reports/monthly?year=${y}&month=${m}`);

  return (
    <div className="flex items-center gap-2">
      <Select value={month} onChange={(e) => go(year, Number(e.target.value))} className="w-40">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <option key={m} value={m}>
            {arabicMonthName(m)}
          </option>
        ))}
      </Select>
      <Select value={year} onChange={(e) => go(Number(e.target.value), month)} className="w-28">
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function TeacherPicker({
  teacherId,
  teachers,
}: {
  teacherId?: number;
  teachers: { id: number; name: string }[];
}) {
  const router = useRouter();
  return (
    <Select
      value={teacherId ?? ""}
      onChange={(e) => router.push(`/reports/teacher?teacherId=${e.target.value}`)}
      className="w-64"
    >
      <option value="" disabled>
        اختر الأستاذ...
      </option>
      {teachers.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </Select>
  );
}
