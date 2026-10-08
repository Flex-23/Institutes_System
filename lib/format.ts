import { CURRENCY_LABEL } from "./constants";

/// تنسيق المبالغ مع فاصل الآلاف + رمز العملة (دينار عراقي)
export function formatMoney(amount: number): string {
  const formatted = new Intl.NumberFormat("en-US").format(Math.round(amount));
  return `${formatted} ${CURRENCY_LABEL}`;
}

/// تنسيق رقم فقط مع فاصل الآلاف (بدون عملة)
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

/// تنسيق التاريخ بصيغة ميلادية عربية مقروءة (يوم/شهر/سنة)
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ar-IQ-u-ca-gregory", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

/// تنسيق مختصر للتاريخ (رقمي) — مناسب للجداول والوصولات
export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${year}/${month}/${day}`;
}

/// تحويل تاريخ إلى صيغة حقل الإدخال YYYY-MM-DD
export function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/// اسم الشهر بالعربية من رقم الشهر (1-12)
export function arabicMonthName(month: number): string {
  const names = [
    "كانون الثاني",
    "شباط",
    "آذار",
    "نيسان",
    "أيار",
    "حزيران",
    "تموز",
    "آب",
    "أيلول",
    "تشرين الأول",
    "تشرين الثاني",
    "كانون الأول",
  ];
  return names[month - 1] ?? String(month);
}

/// تحويل قيمة من حقل نص إلى عدد صحيح موجب (للمبالغ)
export function parseAmount(value: FormDataEntryValue | null): number {
  if (value == null) return 0;
  const n = Math.round(Number(String(value).replace(/[^0-9.-]/g, "")));
  return Number.isFinite(n) ? n : 0;
}
