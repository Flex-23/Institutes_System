"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Option {
  value: string;
  label: string;
  hint?: string;
}

/* قائمة اختيار واحدة قابلة للبحث (autocomplete) — تُرسل القيمة عبر حقل مخفي */
export function Combobox({
  name,
  options,
  defaultValue,
  placeholder = "اختر...",
  required,
  onChange,
}: {
  name: string;
  options: Option[];
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  onChange?: (value: string) => void;
}) {
  const [selected, setSelected] = useState(defaultValue ?? "");
  const selectedLabel = options.find((o) => o.value === selected)?.label ?? "";
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = query
    ? options.filter((o) => o.label.includes(query))
    : options;

  return (
    <div className="relative" ref={ref}>
      <input type="hidden" name={name} value={selected} required={required} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm transition-colors hover:border-[var(--color-primary)]/60 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
      >
        <span className={cn(selectedLabel ? "text-slate-800" : "text-slate-400")}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className="size-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] shadow-lg">
          <div className="p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="بحث..."
              className="w-full rounded-md border border-[var(--color-border)] px-2 py-1.5 text-sm focus:outline-none"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto pb-2">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-center text-sm text-slate-400">لا نتائج</li>
            )}
            {filtered.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(o.value);
                    onChange?.(o.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-right text-sm transition-colors hover:bg-[var(--color-primary-soft)]"
                >
                  <span>
                    {o.label}
                    {o.hint && <span className="mr-2 text-xs text-slate-400">{o.hint}</span>}
                  </span>
                  {selected === o.value && <Check className="size-4 text-[var(--color-primary)]" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* اختيار متعدد قابل للبحث (متحكَّم به) — يُرسل عدة قيم بنفس الاسم */
export function MultiCombobox({
  name,
  options,
  value,
  onChange,
  placeholder = "اختر دورة أو أكثر...",
}: {
  name: string;
  options: Option[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const selectedOptions = options.filter((o) => value.includes(o.value));
  const available = options.filter(
    (o) => !value.includes(o.value) && (!query || o.label.includes(query))
  );

  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  return (
    <div className="relative" ref={ref}>
      {value.map((v, i) => (
        <input key={`${v}-${i}`} type="hidden" name={name} value={v} />
      ))}
      <div
        onClick={() => setOpen(true)}
        className="flex min-h-10 w-full cursor-text flex-wrap items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-1.5 transition-colors hover:border-[var(--color-primary)]/60 focus-within:border-[var(--color-primary)]"
      >
        {selectedOptions.length === 0 && (
          <span className="px-1 text-sm text-slate-400">{placeholder}</span>
        )}
        {selectedOptions.map((o) => (
          <span
            key={o.value}
            className="inline-flex items-center gap-1 rounded-md bg-[var(--color-primary-soft)] px-2 py-0.5 text-xs text-teal-800"
          >
            {o.label}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggle(o.value);
              }}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>

      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] shadow-lg">
          <div className="p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="بحث..."
              className="w-full rounded-md border border-[var(--color-border)] px-2 py-1.5 text-sm focus:outline-none"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto pb-2">
            {available.length === 0 && (
              <li className="px-3 py-2 text-center text-sm text-slate-400">لا نتائج</li>
            )}
            {available.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  onClick={() => {
                    toggle(o.value);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-right text-sm transition-colors hover:bg-[var(--color-primary-soft)]"
                >
                  <span>{o.label}</span>
                  {o.hint && <span className="text-xs text-slate-400">{o.hint}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
