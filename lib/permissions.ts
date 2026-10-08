// صلاحيات مستخدمي النظام — يختارها المدير العام عند إضافة مستخدم (أدمن)
// المدير العام (SUPER_ADMIN) يملك جميع الصلاحيات تلقائياً.

export const PERMISSIONS = [
  { key: "PAYMENTS", label: "الوصول إلى تسديد الأقساط" },
  { key: "EDIT_PEOPLE", label: "تعديل بيانات الطلاب والأساتذة" },
  { key: "SALARIES", label: "صرف الرواتب" },
  { key: "ENROLLMENT", label: "إضافة طالب إلى كورس أو حذفه" },
  { key: "FINANCE", label: "كل ما يتعلق بالمالية" },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

export const PERMISSION_KEYS: PermissionKey[] = PERMISSIONS.map((p) => p.key);

/// يحوّل نص الصلاحيات المخزّن (مفصول بفواصل) إلى مصفوفة مفاتيح صالحة
export function parsePermissions(csv: string | null | undefined): PermissionKey[] {
  if (!csv) return [];
  const valid = new Set<string>(PERMISSION_KEYS);
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is PermissionKey => valid.has(s));
}

/// التسمية العربية لمفتاح صلاحية
export function permissionLabel(key: string): string {
  return PERMISSIONS.find((p) => p.key === key)?.label ?? key;
}
