"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { ModalForm } from "@/components/ui/modal";
import { Field, Input, Label } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { Combobox, type Option } from "@/components/ui/combobox";
import { formatMoney } from "@/lib/format";
import type { ActionState } from "@/lib/action-state";

type PayType = "MONTHLY_SALARY" | "ENTITLEMENT";

type Course = {
  id: number;
  name: string;
  teacherId: number;
  grade: string;
  price: number;
  teacherPercent: number;
};

export function CourseForm({
  action,
  teachers,
  teacherPayTypes,
  course,
}: {
  action: (fd: FormData) => Promise<ActionState>;
  teachers: Option[];
  /// نوع أجر كل أستاذ لعرض حقل النسبة فقط لأساتذة المستحقات
  teacherPayTypes: Record<string, PayType>;
  course?: Course;
}) {
  const editing = !!course;
  const [teacherId, setTeacherId] = useState(course ? String(course.teacherId) : "");
  const [price, setPrice] = useState(course?.price ?? 0);
  const [percent, setPercent] = useState(course?.teacherPercent ?? 0);

  const isMonthly = teacherPayTypes[teacherId] === "MONTHLY_SALARY";
  const effectivePercent = isMonthly ? 0 : Math.max(0, Math.min(100, percent));
  const teacherShare = Math.round((price * effectivePercent) / 100);
  const instituteShare = Math.max(0, price - teacherShare);

  return (
    <ModalForm
      title={editing ? "تعديل الدورة" : "إضافة دورة"}
      action={action}
      submitLabel={editing ? "حفظ التعديلات" : "إضافة"}
      trigger={
        editing ? (
          <Pencil className="size-4" />
        ) : (
          <>
            <Plus className="size-4" /> إضافة دورة
          </>
        )
      }
      triggerVariant={editing ? "ghost" : "primary"}
      triggerSize={editing ? "icon" : "md"}
    >
      {(errors) => (
        <>
          {editing && <input type="hidden" name="id" value={course!.id} />}
          <input type="hidden" name="teacherPercent" value={effectivePercent} />

          <Field label="اسم الكورس" required error={errors.name}>
            <Input name="name" defaultValue={course?.name} placeholder="مثال: رياضيات السادس العلمي" />
          </Field>

          <Field label="الأستاذ" required error={errors.teacherId}>
            <Combobox
              name="teacherId"
              options={teachers}
              defaultValue={course ? String(course.teacherId) : undefined}
              onChange={setTeacherId}
              placeholder="اختر الأستاذ..."
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="الصف الدراسي" required error={errors.grade}>
              <Input name="grade" defaultValue={course?.grade} placeholder="مثال: السادس العلمي" />
            </Field>
            <Field label="السعر" required error={errors.price}>
              <MoneyInput name="price" value={price} onValueChange={setPrice} />
            </Field>
          </div>

          {isMonthly ? (
            <p className="rounded-lg border border-[var(--color-border)] bg-slate-50 p-3 text-xs text-slate-500">
              الأستاذ يتقاضى راتباً شهرياً، لذا لا يأخذ حصة من هذه الدورة — كامل الإيراد للمعهد.
            </p>
          ) : (
            <>
              <Field label="نسبة الأستاذ من سعر الدورة (%)" error={errors.teacherPercent}>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={percent || ""}
                  onChange={(e) =>
                    setPercent(Math.max(0, Math.min(100, Number(e.target.value) || 0)))
                  }
                  className="tnum"
                  placeholder="مثال: 50"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-center">
                <div>
                  <Label className="mb-0">حصة الأستاذ</Label>
                  <div className="mt-1 font-bold tnum text-[var(--color-primary)]">
                    {formatMoney(teacherShare)}
                  </div>
                </div>
                <div>
                  <Label className="mb-0">حصة المعهد</Label>
                  <div className="mt-1 font-bold tnum text-slate-800">
                    {formatMoney(instituteShare)}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </ModalForm>
  );
}
