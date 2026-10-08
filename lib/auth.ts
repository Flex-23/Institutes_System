import "server-only";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

// تجزئة كلمات مرور المدراء باستخدام scrypt (بدون اعتماد مكتبات خارجية).
// الصيغة المخزّنة: "<salt-hex>:<hash-hex>"

/// يُنشئ تجزئة آمنة لكلمة المرور
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

/// يتحقّق من مطابقة كلمة المرور للتجزئة المخزّنة (مقارنة ثابتة الزمن)
export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derived = scryptSync(password, salt, expected.length);
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}
