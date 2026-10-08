"use client";

import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";

/**
 * زر إرسال رسالة واتساب للطالب (stub جاهز للتوسّع).
 * يفتح رابط wa.me في نافذة جديدة. عند غياب الرقم يعرض تنبيهاً.
 */
export function WhatsAppButton({
  url,
  size = "sm",
  label = "واتساب",
}: {
  url: string | null;
  size?: "sm" | "icon";
  label?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className="text-green-700 hover:bg-green-50"
      title="إرسال رسالة واتساب"
      onClick={() => {
        if (!url) {
          toast.error("رقم هاتف الطالب غير متوفّر أو غير صالح");
          return;
        }
        window.open(url, "_blank");
      }}
    >
      <MessageCircle className="size-4" />
      {size !== "icon" && label}
    </Button>
  );
}
