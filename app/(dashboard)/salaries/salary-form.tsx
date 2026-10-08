"use client";

import { useState } from "react";
import { HandCoins, Plus } from "lucide-react";
import { ModalForm } from "@/components/ui/modal";
import { Field, Input, Textarea } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { Combobox, type Option } from "@/components/ui/combobox";
import { toDateInputValue, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/lib/action-state";

const PORTIONS: { label: string; factor: number }[] = [
  { label: "ربع", factor: 0.25 },
  { label: "نصف", factor: 0.5 },
  { label: "كامل المستحق", factor: 1 },
];

export function SalaryForm({
  action,
  teachers,
  teacherId,
  netOwed,
  compact,
}: {
  action: (fd: FormData) => Promise<ActionState>;
  teachers: Option[];
  teacherId?: number;
  /// الصافي المستحق للأستاذ (يُستخدم لصرف جزء منه)
  netOwed?: number;
  compact?: boolean;
}) {
  const [amount, setAmount] = useState(0);
  const owed = netOwed ?? 0;

  return (
    <ModalForm
      title="صرف راتب"
      action={action}
      submitLabel="صرف الراتب"
      trigger={
        compact ? (
          <>
            <HandCoins className="size-4" /> صرف راتب
          </>
        ) : (
          <>
            <Plus className="size-4" /> صرف راتب جديد
          </>
        )
      }
      triggerVariant={compact ? "outline" : "primary"}
      triggerSize={compact ? "sm" : "md"}
    >
      {(errors) => (
        <>
          {teacherId ? (
            <input type="hidden" name="teacherId" value={teacherId} />
          ) : (
            <Field label="الأستاذ" required error={errors.teacherId}>
              <Combobox name="teacherId" options={teachers} placeholder="اختر الأستاذ..." />
            </Field>
          )}

          {owed > 0 && (
            <div className="rounded-lg border border-[var(--color-border)] bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">الصافي المستحق</span>
                <span className="tnum font-bold text-[var(--color-warning)]">{formatMoney(owed)}</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {PORTIONS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setAmount(Math.round(owed * p.factor))}
                    className={cn(
                      "rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-1.5 text-xs font-medium text-slate-600 transition-colors",
                      "hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Field label="المبلغ المصروف" required error={errors.amount}>
            <MoneyInput
              name="amount"
              value={amount}
              onValueChange={setAmount}
              placeholder="0"
              autoFocus
            />
          </Field>

          {owed > 0 && amount > 0 && amount < owed && (
            <p className="-mt-2 text-xs text-slate-500">
              سيتبقّى بعد الصرف: {" "}
              <span className="tnum font-medium text-[var(--color-warning)]">
                {formatMoney(owed - amount)}
              </span>
            </p>
          )}

          <Field label="تاريخ الصرف" required error={errors.payoutDate}>
            <Input type="date" name="payoutDate" defaultValue={toDateInputValue(new Date())} />
          </Field>
          <Field label="ملاحظة (اختياري)">
            <Textarea name="note" placeholder="مثال: صرف جزء من راتب شهر..." />
          </Field>
        </>
      )}
    </ModalForm>
  );
}
