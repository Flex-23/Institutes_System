import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { INSTITUTE_NAME } from "@/lib/constants";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${INSTITUTE_NAME} — نظام الإدارة`,
  description: "نظام إدارة المعاهد الأهلية: الطلاب، الأساتذة، الدورات، الأقساط والتقارير",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full">
        {/* تطبيق الثيم المحفوظ قبل الرسم لتفادي وميض الألوان */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t!=='dark'&&t!=='night')t='light';document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='light';}})();`,
          }}
        />
        {children}
        <Toaster
          position="top-center"
          dir="rtl"
          richColors
          toastOptions={{ style: { fontFamily: "var(--font-cairo)" } }}
        />
      </body>
    </html>
  );
}
