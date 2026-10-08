"use client";

import { useId, useState } from "react";
import { Plus, X } from "lucide-react";
import { Input, Label } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { formatMoney } from "@/lib/format";

export type SubjectSuggestion = { name: string; price: number };

type Row = { name: string; price: number };

/**
 * إدخال مواد الطالب: اسم المادة (مع اقتراحات محفوظة) + السعر يدوياً.
 * يمكن إضافة أكثر من مادة. تُرسل القيم عبر subjectName[] و subjectPrice[].
 */
export function SubjectFields({
  suggestions,
  error,
}: {
  suggestions: SubjectSuggestion[];
  error?: string;
}) {
  const listId = useId();
  const priceByName = new Map(suggestions.map((s) => [s.name, s.price]));
  const [rows, setRows] = useState<Row[]>([{ name: "", price: 0 }]);

  const total = rows.reduce((s, r) => s + (r.name.trim() ? r.price : 0), 0);

  function updateName(i: number, name: string) {
    setRows((rs) =>
      rs.map((r, idx) => {
        if (idx !== i) return r;
        const known = priceByName.get(name.trim());
        return { name, price: known != null ? known : r.price };
      })
    );
  }

  function updatePrice(i: number, price: number) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, price } : r)));
  }

  function addRow() {
    setRows((rs) => [...rs, { name: "", price: 0 }]);
  }

  function removeRow(i: number) {
    setRows((rs) => (rs.length === 1 ? [{ name: "", price: 0 }] : rs.filter((_, idx) => idx !== i)));
  }

  return (
    <div>
      <Label>المواد التي يرغب بدراستها</Label>

      <datalist id={listId}>
        {suggestions.map((s) => (
          <option key={s.name} value={s.name} />
        ))}
      </datalist>

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="flex-1">
              <Input
                name="subjectName"
                list={listId}
                value={row.name}
                onChange={(e) => updateName(i, e.target.value)}
                placeholder="اسم المادة"
                autoComplete="off"
              />
            </div>
            <div className="w-40">
              <MoneyInput
                name="subjectPrice"
                value={row.price}
                onValueChange={(n) => updatePrice(i, n)}
                placeholder="السعر"
              />
            </div>
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="mt-1 rounded-lg p-2 text-slate-400 transition-colors hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
              title="حذف المادة"
              aria-label="حذف المادة"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>

      {error && <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p>}

      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] transition-colors hover:underline"
        >
          <Plus className="size-4" /> إضافة مادة أخرى
        </button>
        <div className="text-sm">
          <span className="text-slate-500">الإجمالي: </span>
          <span className="tnum font-bold text-[var(--color-primary)]">{formatMoney(total)}</span>
        </div>
      </div>
    </div>
  );
}
