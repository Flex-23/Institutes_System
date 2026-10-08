// إعدادات عامة قابلة للتعديل من مكان واحد

/// اسم المعهد (يظهر في الوصولات والترويسة)
export const INSTITUTE_NAME = "معهد النخبة الأهلي";

/// رمز العملة الافتراضي — دينار عراقي
export const CURRENCY = "IQD";
export const CURRENCY_LABEL = "د.ع"; // دينار عراقي

/// أقسام النظام (الشريط الجانبي) — مجموعات مرتّبة بعناوين لتسهيل التنقّل
export const NAV_GROUPS = [
  {
    title: null,
    items: [{ href: "/", label: "لوحة التحكم", icon: "LayoutDashboard" }],
  },
  {
    title: "شؤون المعهد",
    items: [
      { href: "/students", label: "الطلاب", icon: "GraduationCap" },
      { href: "/teachers", label: "الأساتذة", icon: "Users" },
      { href: "/courses", label: "الدورات", icon: "BookOpen" },
      { href: "/entitlements", label: "الاستحقاقات", icon: "Scale" },
      { href: "/subscriptions", label: "الاشتراكات", icon: "ClipboardList" },
    ],
  },
  {
    title: "المالية",
    items: [
      { href: "/payments", label: "استلام قسط", icon: "Wallet" },
      { href: "/receipts", label: "طباعة إشعار دفع", icon: "Printer" },
      { href: "/salaries", label: "صرف رواتب", icon: "HandCoins" },
      { href: "/expenses", label: "المصروفات", icon: "Receipt" },
      { href: "/income", label: "الايرادات", icon: "TrendingUp" },
    ],
  },
  {
    title: "التقارير",
    items: [
      { href: "/reports/monthly", label: "تقرير شهري", icon: "CalendarRange" },
      { href: "/reports/teacher", label: "تقرير الأستاذ", icon: "UserSearch" },
      { href: "/reports/remaining", label: "الأقساط المتبقية", icon: "AlertCircle" },
    ],
  },
  {
    title: "النظام",
    items: [{ href: "/settings", label: "إضافة مستخدم", icon: "UserPlus" }],
  },
] as const;
