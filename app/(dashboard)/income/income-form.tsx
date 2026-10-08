"use client";

import { Pencil, Plus } from "lucide-react";
import { ModalForm } from "@/components/ui/modal";
import { Field, Input, Textarea } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { toDateInputValue } from "@/lib/format";
import type { ActionState } from "@/lib/action-state";

type Income = {
  id: number;
  title: string;
  amount: number;
  source: string;
  date: Date | string;
  note: string | null;
};

export function IncomeForm({
  action,
  income,
}: {
  action: (fd: FormData) => Promise<ActionState>;
  income?: Income;
}) {
  const editing = !!income;
  return (
    <ModalForm
      title={editing ? "تعديل الإيراد" : "إضافة إيراد"}
      action={action}
      submitLabel={editing ? "حفظ التعديلات" : "إضافة"}
      trigger={editing ? <Pencil className="size-4" /> : (<><Plus className="size-4" /> إضافة إيراد</>)}
      triggerVariant={editing ? "ghost" : "primary"}
      triggerSize={editing ? "icon" : "md"}
    >
      {(errors) => (
        <>
          {editing && <input type="hidden" name="id" value={income!.id} />}
          <Field label="العنوان" required error={errors.title}>
            <Input name="title" defaultValue={income?.title} placeholder="مثال: بيع ملازم" />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="المبلغ" required error={errors.amount}>
              <MoneyInput name="amount" defaultValue={income?.amount} />
            </Field>
            <Field label="المصدر" required error={errors.source}>
              <Input name="source" defaultValue={income?.source} placeholder="مثال: مبيعات / تأجير" />
            </Field>
          </div>
          <Field label="التاريخ" required error={errors.date}>
            <Input type="date" name="date" defaultValue={toDateInputValue(income?.date ?? new Date())} />
          </Field>
          <Field label="ملاحظة (اختياري)">
            <Textarea name="note" defaultValue={income?.note ?? ""} />
          </Field>
        </>
      )}
    </ModalForm>
  );
}
