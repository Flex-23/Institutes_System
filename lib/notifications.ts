// ============================================================================
// إشعارات الطلاب (واتساب / SMS) — بنية جاهزة للتوسّع
// حالياً: توليد رابط واتساب فقط (stub). لاحقاً يمكن ربط API حقيقي هنا.
// ============================================================================

import { INSTITUTE_NAME } from "./constants";
import { formatMoney, formatDateShort } from "./format";

/// تطبيع رقم الهاتف العراقي إلى صيغة دولية للواتساب (964...)
export function normalizeIraqiPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let p = phone.replace(/[^0-9]/g, "");
  if (p.startsWith("00964")) p = p.slice(5);
  else if (p.startsWith("964")) p = p.slice(3);
  if (p.startsWith("0")) p = p.slice(1);
  if (p.length < 9) return null;
  return `964${p}`;
}

export function buildPaymentMessage(opts: {
  studentName: string;
  amount: number;
  remaining: number;
  date: Date | string;
  receiptNo: string;
}): string {
  return (
    `مرحباً ${opts.studentName}،\n` +
    `تم استلام دفعة بمبلغ ${formatMoney(opts.amount)} بتاريخ ${formatDateShort(opts.date)}.\n` +
    `المبلغ المتبقي: ${formatMoney(opts.remaining)}.\n` +
    `رقم الوصل: ${opts.receiptNo}\n` +
    `${INSTITUTE_NAME}`
  );
}

/// رابط واتساب جاهز للفتح في المتصفح
export function buildWhatsappUrl(phone: string | null | undefined, message: string): string | null {
  const normalized = normalizeIraqiPhone(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

/**
 * نقطة ربط مستقبلية لإرسال رسالة عبر مزوّد حقيقي (Twilio / WhatsApp Cloud API...).
 * حالياً غير مفعّلة — تُترك كواجهة موحّدة.
 */
export async function sendNotification(phone: string, message: string): Promise<{ sent: boolean }> {
  // TODO: ربط مزوّد رسائل حقيقي هنا مستقبلاً (Twilio / WhatsApp Cloud API...)
  void phone;
  void message;
  return { sent: false };
}
