"use client";

import { MultiCombobox, type Option } from "@/components/ui/combobox";
import { Label, FieldError } from "@/components/ui/field";
import { formatMoney } from "@/lib/format";

/**
 * اختيار الدورات مع عرض سعر كل دورة والمجموع الكلي.
 * يُرسل معرّفات الدورات عبر الحقل courseIds.
 */
export function CourseSelector({
  courses,
  coursePrices,
  value,
  onChange,
  error,
  label = "الدورات",
  required,
}: {
  courses: Option[];
  coursePrices: Record<string, number>;
  value: string[];
  onChange: (v: string[]) => void;
  error?: string;
  label?: string;
  required?: boolean;
}) {
  const total = value.reduce((s, id) => s + (coursePrices[id] ?? 0), 0);
  const labelOf = (id: string) => courses.find((c) => c.value === id)?.label ?? id;

  return (
    <div>
      <Label required={required}>{label}</Label>
      <MultiCombobox name="courseIds" options={courses} value={value} onChange={onChange} />
      <FieldError>{error}</FieldError>

      {value.length > 0 && (
        <div className="mt-2 overflow-hidden rounded-lg border border-[var(--color-border)]">
          <ul>
            {value.map((id) => (
              <li
                key={id}
                className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2 text-sm last:border-0"
              >
                <span className="text-slate-700">{labelOf(id)}</span>
                <span className="tnum font-medium text-slate-800">
                  {formatMoney(coursePrices[id] ?? 0)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between bg-slate-50 px-3 py-2.5 text-sm">
            <span className="font-semibold text-slate-600">الإجمالي</span>
            <span className="tnum font-bold text-[var(--color-primary)]">{formatMoney(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
