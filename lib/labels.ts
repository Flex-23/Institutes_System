// تسميات عربية للقيم المعدودة (enums) + لون الشارة المناسب

type Tone = "neutral" | "primary" | "success" | "danger" | "warning" | "info";

export const SUB_STATUS: Record<string, { label: string; tone: Tone }> = {
  ACTIVE: { label: "فعّال", tone: "success" },
  COMPLETED: { label: "مكتمل", tone: "info" },
  CANCELLED: { label: "ملغى", tone: "danger" },
};

export const DISCOUNT_TARGET: Record<string, string> = {
  INSTITUTE: "على المعهد",
  TEACHER: "على الأستاذ",
  BOTH: "على الاثنين بالتساوي",
};

export const TEACHER_PAY_TYPE: Record<string, { label: string; tone: Tone }> = {
  MONTHLY_SALARY: { label: "راتب شهري", tone: "info" },
  ENTITLEMENT: { label: "مستحقات", tone: "primary" },
};

export const ADMIN_ROLE: Record<string, { label: string; tone: Tone }> = {
  SUPER_ADMIN: { label: "مدير عام", tone: "primary" },
  ADMIN: { label: "أدمن", tone: "info" },
};
