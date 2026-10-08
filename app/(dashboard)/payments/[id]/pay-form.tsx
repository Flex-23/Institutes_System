"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Field, Textarea } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { formatMoney } from "@/lib/format";
import { createPayment } from "../actions";

export function PayForm({
  subscriptionId,
  finalPrice,
  remaining,
}: {
  subscriptionId: number;
  finalPrice: number;
  remaining: number;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handle(formData: FormData) {
    const res = await createPayment(formData);
    if (res?.ok) {
      toast.success(res.message ?? "تم استلام القسط");
      setErrors({});
      setAmount(0);
      setOpen(false);
    } else {
      if (res?.message) toast.error(res.message);
      setErrors(res?.errors ?? {});
    }
  }

  const afterPayment = Math.max(0, remaining - amount);
  const invalid = amount <= 0 || amount > remaining;

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Wallet className="size-4" /> تسديد قسط
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="تسديد قسط">
        <form action={handle} className="space-y-4">
          <input type="hidden" name="subscriptionId" value={subscriptionId} />

          <div className="grid grid-cols-2 gap-3 rounded-xl border border-[var(--color-border)] bg-slate-50 p-3 text-center">
            <div>
              <div className="text-xs text-slate-500">المبلغ الكلي</div>
              <div className="mt-1 font-bold tnum text-slate-800">{formatMoney(finalPrice)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">المتبقي</div>
              <div className="mt-1 font-bold tnum text-[var(--color-danger)]">{formatMoney(remaining)}</div>
            </div>
          </div>

          <Field label="المبلغ المدفوع حالياً" required error={errors.amount}>
            <MoneyInput
              name="amount"
              value={amount}
              onValueChange={setAmount}
              className="text-lg"
              autoFocus
            />
          </Field>

          <div className="rounded-xl bg-[var(--color-primary-soft)] p-3 text-center">
            <span className="text-sm text-[var(--color-primary)]">الباقي بعد الدفع: </span>
            <span className="font-bold tnum text-[var(--color-primary)]">{formatMoney(afterPayment)}</span>
          </div>

          <Field label="ملاحظة (اختياري)">
            <Textarea name="note" placeholder="ملاحظة على الدفعة..." />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <SubmitButton disabled={invalid}>حفظ الدفعة</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
