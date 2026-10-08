"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { ActionState } from "@/lib/action-state";
import { Modal } from "./modal";
import { Button } from "./button";
import { SubmitButton } from "./submit-button";

/**
 * زر حذف مع نافذة تأكيد.
 * يمرّر الـ id عبر حقل مخفي إلى الـ Server Action.
 */
export function ConfirmDelete({
  action,
  id,
  label = "حذف",
  title = "تأكيد الحذف",
  message = "هل أنت متأكد من الحذف؟ لا يمكن التراجع عن هذه العملية.",
  iconOnly = true,
}: {
  action: (formData: FormData) => Promise<ActionState>;
  id: number | string;
  label?: string;
  title?: string;
  message?: string;
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);

  async function handle(formData: FormData) {
    const res = await action(formData);
    if (res?.ok) {
      toast.success(res.message ?? "تم الحذف");
      setOpen(false);
    } else if (res?.message) {
      toast.error(res.message);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size={iconOnly ? "icon" : "sm"}
        className="text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
        onClick={() => setOpen(true)}
        title={label}
      >
        <Trash2 className="size-4" />
        {!iconOnly && <span className="mr-1">{label}</span>}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={title}>
        <p className="text-sm text-slate-600">{message}</p>
        <form action={handle} className="mt-6 flex justify-end gap-2">
          <input type="hidden" name="id" value={id} />
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
          <SubmitButton variant="danger">
            <Trash2 className="size-4" />
            حذف
          </SubmitButton>
        </form>
      </Modal>
    </>
  );
}
