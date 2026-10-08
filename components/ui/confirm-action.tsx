"use client";

import * as React from "react";
import { useState } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/lib/action-state";
import { Modal } from "./modal";
import { Button, type ButtonProps } from "./button";
import { SubmitButton } from "./submit-button";

/** زر يفتح نافذة تأكيد لتنفيذ Server Action يستقبل الـ id عبر حقل مخفي. */
export function ConfirmAction({
  action,
  id,
  trigger,
  triggerVariant = "ghost",
  triggerSize = "icon",
  triggerClassName,
  title,
  message,
  confirmLabel = "تأكيد",
  confirmVariant = "primary",
}: {
  action: (formData: FormData) => Promise<ActionState>;
  id: number | string;
  trigger: React.ReactNode;
  triggerVariant?: ButtonProps["variant"];
  triggerSize?: ButtonProps["size"];
  triggerClassName?: string;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: ButtonProps["variant"];
}) {
  const [open, setOpen] = useState(false);

  async function handle(formData: FormData) {
    const res = await action(formData);
    if (res?.ok) {
      toast.success(res.message ?? "تم");
      setOpen(false);
    } else if (res?.message) {
      toast.error(res.message);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={triggerVariant}
        size={triggerSize}
        className={triggerClassName}
        onClick={() => setOpen(true)}
        title={title}
      >
        {trigger}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={title}>
        <p className="text-sm text-slate-600">{message}</p>
        <form action={handle} className="mt-6 flex justify-end gap-2">
          <input type="hidden" name="id" value={id} />
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
          <SubmitButton variant={confirmVariant}>{confirmLabel}</SubmitButton>
        </form>
      </Modal>
    </>
  );
}
