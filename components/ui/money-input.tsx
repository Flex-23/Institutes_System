"use client";

import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CURRENCY_LABEL } from "@/lib/constants";

const baseField =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 transition-colors hover:border-[var(--color-primary)]/60 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] disabled:bg-slate-50";

/// يُبقي الأرقام فقط من نصّ الإدخال
function onlyDigits(s: string): string {
  return s.replace(/[^0-9]/g, "");
}

/// يضيف فواصل الآلاف لسلسلة أرقام (١٢٣٤ → 1,234)
function withSeparators(digits: string): string {
  if (!digits) return "";
  const n = Number(digits);
  return Number.isFinite(n) ? new Intl.NumberFormat("en-US").format(n) : "";
}

/**
 * حقل إدخال المبالغ مع فواصل الآلاف التلقائية أثناء الكتابة.
 * - يعمل بوضع "متحكَّم به" عبر value + onValueChange (لحساب المجاميع الحيّة)
 * - أو بوضع "غير متحكَّم به" عبر defaultValue (يُرسل القيمة الخام عبر حقل مخفي)
 * تُرسل القيمة الرقمية الخام (بدون فواصل) عبر حقل مخفي بالاسم name.
 */
export function MoneyInput({
  name,
  value,
  onValueChange,
  defaultValue,
  placeholder = "0",
  className,
  autoFocus,
  required,
  disabled,
  suffix = CURRENCY_LABEL,
}: {
  name?: string;
  value?: number;
  onValueChange?: (n: number) => void;
  defaultValue?: number;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  required?: boolean;
  disabled?: boolean;
  suffix?: string | null;
}) {
  const controlled = value !== undefined;
  const [display, setDisplay] = useState(
    !controlled && defaultValue ? withSeparators(String(defaultValue)) : ""
  );

  const shown = controlled ? (value ? withSeparators(String(value)) : "") : display;
  const raw = onlyDigits(shown);

  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = onlyDigits(e.target.value);
    if (!controlled) setDisplay(withSeparators(digits));
    onValueChange?.(digits ? Number(digits) : 0);
  }

  return (
    <div className="relative">
      {name && <input type="hidden" name={name} value={raw} />}
      <input
        inputMode="numeric"
        dir="ltr"
        value={shown}
        onChange={handle}
        placeholder={placeholder}
        autoFocus={autoFocus}
        required={required}
        disabled={disabled}
        className={cn(baseField, "text-left tnum", suffix && "pr-12", className)}
      />
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-slate-400">
          {suffix}
        </span>
      )}
    </div>
  );
}
