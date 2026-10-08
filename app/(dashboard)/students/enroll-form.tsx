"use client";

import { useState } from "react";
import { BookPlus } from "lucide-react";
import { ModalForm } from "@/components/ui/modal";
import type { Option } from "@/components/ui/combobox";
import type { ActionState } from "@/lib/action-state";
import { CourseSelector } from "./course-selector";

/// نموذج تسجيل طالب موجود في دورة/دورات (إنشاء اشتراك جديد)
export function EnrollForm({
  action,
  studentId,
  courses,
  coursePrices,
}: {
  action: (fd: FormData) => Promise<ActionState>;
  studentId: number;
  courses: Option[];
  coursePrices: Record<string, number>;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <ModalForm
      title="تسجيل في دورة"
      action={action}
      submitLabel="تسجيل"
      trigger={
        <>
          <BookPlus className="size-4" /> تسجيل في دورة
        </>
      }
      triggerVariant="primary"
      triggerSize="sm"
    >
      {(errors) => (
        <>
          <input type="hidden" name="studentId" value={studentId} />
          <CourseSelector
            label="الدورات"
            required
            courses={courses}
            coursePrices={coursePrices}
            value={selected}
            onChange={setSelected}
            error={errors.courseIds}
          />
          <p className="text-xs text-slate-500">
            سيُنشأ اشتراك جديد بالدورات المختارة ويُضاف مبلغها إلى إجمالي الطالب.
          </p>
        </>
      )}
    </ModalForm>
  );
}
