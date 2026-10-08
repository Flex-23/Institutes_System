// الشكل الموحّد لنتيجة أي Server Action في النظام
export type ActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
} | null;

export const ok = (message?: string): ActionState => ({ ok: true, message });
export const fail = (
  message?: string,
  errors?: Record<string, string>
): ActionState => ({ ok: false, message, errors });
