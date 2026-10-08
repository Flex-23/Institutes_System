"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <AlertTriangle className="size-12 text-[var(--color-danger)]" />
      <div>
        <h2 className="text-lg font-semibold text-slate-800">حدث خطأ غير متوقّع</h2>
        <p className="mt-1 text-sm text-slate-500">
          تعذّر تحميل هذه الصفحة. تأكّد من تشغيل قاعدة البيانات (MySQL في XAMPP).
        </p>
      </div>
      <Button onClick={() => unstable_retry()}>إعادة المحاولة</Button>
    </div>
  );
}
