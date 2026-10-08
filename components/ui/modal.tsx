"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/lib/action-state";
import { Button, type ButtonProps } from "./button";
import { SubmitButton } from "./submit-button";

/* نافذة منبثقة أساسية (overlay) */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  // النافذة تُفتح فقط عبر تفاعل العميل، لذا document متاح دائماً عند open=true
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "animate-modal-in relative z-10 my-8 w-full overflow-hidden rounded-2xl bg-[var(--color-card)] shadow-2xl ring-1 ring-black/5",
          wide ? "max-w-3xl" : "max-w-lg"
        )}
      >
        {/* خيط علوي بتدرّج الهوية */}
        <div className="h-1 w-full bg-gradient-to-l from-[var(--color-primary)] to-[var(--color-primary-2)]" />
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-4 sm:px-5">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="إغلاق"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

/* نافذة تحتوي نموذجاً موصولاً بـ Server Action مع تنبيهات (toast) */
export function ModalForm({
  trigger,
  triggerVariant = "primary",
  triggerSize = "md",
  triggerClassName,
  title,
  action,
  children,
  submitLabel = "حفظ",
  wide,
}: {
  trigger: React.ReactNode;
  triggerVariant?: ButtonProps["variant"];
  triggerSize?: ButtonProps["size"];
  triggerClassName?: string;
  title: string;
  action: (formData: FormData) => Promise<ActionState>;
  children: (errors: Record<string, string>) => React.ReactNode;
  submitLabel?: string;
  wide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // معالجة النتيجة داخل دالة الإرسال (وليس داخل useEffect) لتفادي إعادة العرض المتتالية
  async function handle(formData: FormData) {
    const res = await action(formData);
    if (res?.ok) {
      toast.success(res.message ?? "تم الحفظ بنجاح");
      setErrors({});
      setOpen(false);
    } else {
      if (res?.message) toast.error(res.message);
      setErrors(res?.errors ?? {});
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={triggerVariant}
        size={triggerSize}
        className={triggerClassName}
        onClick={() => {
          setErrors({});
          setOpen(true);
        }}
      >
        {trigger}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={title} wide={wide}>
        {/* remount on open => يمسح الحقول للإضافة الجديدة */}
        <form action={handle} className="space-y-4">
          {children(errors)}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <SubmitButton>{submitLabel}</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
