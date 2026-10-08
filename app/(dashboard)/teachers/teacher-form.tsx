"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { ModalForm } from "@/components/ui/modal";
import { Field, Input, Label } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { toDateInputValue } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/lib/action-state";

type PayType = "MONTHLY_SALARY" | "ENTITLEMENT";

type Teacher = {
  id: number;
  name: string;
  phone: string | null;
  startDate: Date | string;
  subject: string;
  payType: PayType;
  monthlySalary: number;
};

const PAY_TYPES: { value: PayType; label: string }[] = [
  { value: "ENTITLEMENT", label: "مستحقات (حصة من الدورات)" },
  { value: "MONTHLY_SALARY", label: "راتب شهري" },
];

export function TeacherForm({
  action,
  teacher,
}: {
  action: (fd: FormData) => Promise<ActionState>;
  teacher?: Teacher;
}) {
  const editing = !!teacher;
  const [payType, setPayType] = useState<PayType>(teacher?.payType ?? "ENTITLEMENT");

  return (
    <ModalForm
      title={editing ? "تعديل بيانات الأستاذ" : "إضافة أستاذ"}
      action={action}
      submitLabel={editing ? "حفظ التعديلات" : "إضافة"}
      trigger={
        editing ? (
          <Pencil className="size-4" />
        ) : (
          <>
            <Plus className="size-4" /> إضافة أستاذ
          </>
        )
      }
      triggerVariant={editing ? "ghost" : "primary"}
      triggerSize={editing ? "icon" : "md"}
    >
      {(errors) => (
        <>
          {editing && <input type="hidden" name="id" value={teacher!.id} />}
          <input type="hidden" name="payType" value={payType} />

          <Field label="الاسم" required error={errors.name}>
            <Input name="name" defaultValue={teacher?.name} placeholder="اسم الأستاذ" />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="رقم الهاتف" error={errors.phone}>
              <Input name="phone" defaultValue={teacher?.phone ?? ""} placeholder="07XXXXXXXXX" />
            </Field>
            <Field label="المادة" required error={errors.subject}>
              <Input name="subject" defaultValue={teacher?.subject} placeholder="مثال: الرياضيات" />
            </Field>
          </div>
          <Field label="تاريخ المباشرة" required error={errors.startDate}>
            <Input type="date" name="startDate" defaultValue={toDateInputValue(teacher?.startDate)} />
          </Field>

          <div>
            <Label>طريقة الأجر</Label>
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
              {PAY_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setPayType(t.value)}
                  className={cn(
                    "rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                    payType === t.value
                      ? "bg-[var(--color-elevated)] text-[var(--color-primary)] shadow-sm"
                      : "text-slate-500 hover:text-[var(--color-primary)]"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {payType === "MONTHLY_SALARY" ? (
            <Field label="الراتب الشهري" required error={errors.monthlySalary}>
              <MoneyInput name="monthlySalary" defaultValue={teacher?.monthlySalary} />
            </Field>
          ) : (
            <p className="rounded-lg border border-[var(--color-border)] bg-slate-50 p-3 text-xs text-slate-500">
              يتقاضى الأستاذ حصّته من كل دورة حسب النسبة التي تُحدَّد عند إضافة الدورة، ويُجمَع مجموع
              حصصه من دوراته.
            </p>
          )}
        </>
      )}
    </ModalForm>
  );
}
