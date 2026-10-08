import * as icons from "lucide-react";
import type { LucideProps } from "lucide-react";

/**
 * أيقونة ديناميكية بالاسم من مكتبة lucide-react.
 * تُستخدم مع أسماء الأيقونات المخزّنة في الإعدادات (NAV_SECTIONS).
 */
export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const Cmp = (icons as unknown as Record<string, React.ComponentType<LucideProps>>)[
    name
  ];
  if (!Cmp) return null;
  return <Cmp {...props} />;
}
