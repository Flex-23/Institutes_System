"use client";

import { Pencil, Plus } from "lucide-react";
import { ModalForm } from "@/components/ui/modal";
import { Field, Input, Textarea } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { toDateInputValue } from "@/lib/format";
import type { ActionState } from "@/lib/action-state";

type Expense = {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: Date | string;
  note: string | null;
};

export function ExpenseForm({
  action,
  expense,
}: {
  action: (fd: FormData) => Promise<ActionState>;
  expense?: Expense;
}) {
  const editing = !!expense;
  return (
    <ModalForm
      title={editing ? "تعديل المصروف" : "إضافة مصروف"}
      action={action}
      submitLabel={editing ? "حفظ التعديلات" : "إضافة"}
      trigger={editing ? <Pencil className="size-4" /> : (<><Plus className="size-4" /> إضافة مصروف</>)}
      triggerVariant={editing ? "ghost" : "primary"}
      triggerSize={editing ? "icon" : "md"}
    >
      {(errors) => (
        <>
          {editing && <input type="hidden" name="id" value={expense!.id} />}
          <Field label="العنوان" required error={errors.title}>
            <Input name="title" defaultValue={expense?.title} placeholder="مثال: إيجار المبنى" />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="المبلغ" required error={errors.amount}>
              <MoneyInput name="amount" defaultValue={expense?.amount} />
            </Field>
            <Field label="الفئة" required error={errors.category}>
              <Input name="category" defaultValue={expense?.category} placeholder="مثال: إيجار / خدمات" />
            </Field>
          </div>
          <Field label="التاريخ" required error={errors.date}>
            <Input type="date" name="date" defaultValue={toDateInputValue(expense?.date ?? new Date())} />
          </Field>
          <Field label="ملاحظة (اختياري)">
            <Textarea name="note" defaultValue={expense?.note ?? ""} />
          </Field>
        </>
      )}
    </ModalForm>
  );
}
