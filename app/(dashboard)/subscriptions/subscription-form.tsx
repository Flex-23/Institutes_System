"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { ModalForm } from "@/components/ui/modal";
import { Field, Label } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { Combobox, MultiCombobox, type Option } from "@/components/ui/combobox";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/lib/action-state";

type Target = "INSTITUTE" | "TEACHER" | "BOTH";

const TARGETS: { value: Target; label: string }[] = [
  { value: "INSTITUTE", label: "على المعهد" },
  { value: "TEACHER", label: "على الأستاذ" },
  { value: "BOTH", label: "على الاثنين" },
];

type Sub = {
  id: number;
  studentId: number;
  discountAmount: number;
  discountTarget: Target;
  paidAmount: number;
  courseIds: string[];
};

export function SubscriptionForm({
  action,
  students,
  courses,
  coursePrices,
  subscription,
}: {
  action: (fd: FormData) => Promise<ActionState>;
  students: Option[];
  courses: Option[];
  coursePrices: Record<string, number>;
  subscription?: Sub;
}) {
  const editing = !!subscription;
  const [selected, setSelected] = useState<string[]>(subscription?.courseIds ?? []);
  const [discount, setDiscount] = useState(subscription?.discountAmount ?? 0);
  const [target, setTarget] = useState<Target>(subscription?.discountTarget ?? "INSTITUTE");

  const totalPrice = selected.reduce((s, id) => s + (coursePrices[id] ?? 0), 0);
  const finalPrice = Math.max(0, totalPrice - discount);

  return (
    <ModalForm
      title={editing ? "تعديل الاشتراك" : "إضافة اشتراك"}
      action={action}
      submitLabel={editing ? "حفظ التعديلات" : "إضافة"}
      wide
      trigger={
        editing ? (
          <Pencil className="size-4" />
        ) : (
          <>
            <Plus className="size-4" /> إضافة اشتراك
          </>
        )
      }
      triggerVariant={editing ? "ghost" : "primary"}
      triggerSize={editing ? "icon" : "md"}
    >
      {(errors) => (
        <>
          {editing && <input type="hidden" name="id" value={subscription!.id} />}
          <input type="hidden" name="discountTarget" value={target} />

          <Field label="الطالب" required error={errors.studentId}>
            <Combobox
              name="studentId"
              options={students}
              defaultValue={subscription ? String(subscription.studentId) : undefined}
              placeholder="اختر الطالب..."
            />
          </Field>

          <Field label="الدورات" required error={errors.courseIds}>
            <MultiCombobox
              name="courseIds"
              options={courses}
              value={selected}
              onChange={setSelected}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="مبلغ الخصم" error={errors.discountAmount}>
              <MoneyInput
                name="discountAmount"
                value={discount}
                onValueChange={setDiscount}
              />
            </Field>
            <div>
              <Label>جهة الخصم</Label>
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
                {TARGETS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTarget(t.value)}
                    className={cn(
                      "rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                      target === t.value
                        ? "bg-[var(--color-elevated)] text-[var(--color-primary)] shadow-sm"
                        : "text-slate-500 hover:text-[var(--color-primary)]"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-xl border border-[var(--color-border)] bg-slate-50 p-4 text-center">
            <Summary label="المبلغ الكلي" value={formatMoney(totalPrice)} />
            <Summary label="الخصم" value={formatMoney(discount)} tone="warning" />
            <Summary label="السعر النهائي" value={formatMoney(finalPrice)} tone="primary" />
          </div>
          {editing && subscription!.paidAmount > 0 && (
            <p className="text-xs text-slate-500">
              المدفوع مسبقاً: {formatMoney(subscription!.paidAmount)} — لا يمكن جعل السعر النهائي أقل منه.
            </p>
          )}
        </>
      )}
    </ModalForm>
  );
}

function Summary({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warning" | "primary";
}) {
  const color =
    tone === "primary" ? "text-[var(--color-primary)]" : tone === "warning" ? "text-[var(--color-warning)]" : "text-slate-800";
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={cn("mt-1 font-bold tnum", color)}>{value}</div>
    </div>
  );
}
