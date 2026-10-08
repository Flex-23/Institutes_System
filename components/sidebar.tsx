"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Icon } from "./icon";
import { ThemeToggle } from "./theme-toggle";
import { NAV_GROUPS, INSTITUTE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4">
      {NAV_GROUPS.map((group, gi) => (
        <div key={gi}>
          {group.title && (
            <div className="mb-1.5 px-3 text-[11px] font-semibold text-[var(--sidebar-muted)]/80">
              {group.title}
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            {group.items.map((s) => {
              const active = isActive(pathname, s.href);
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                    active
                      ? "bg-gradient-to-l from-[var(--color-primary)] to-[var(--color-primary-2)] text-white shadow-lg shadow-[var(--color-primary)]/25"
                      : "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-fg)]"
                  )}
                >
                  {/* مؤشّر العنصر النشط على الحافة اليمنى (RTL) */}
                  <span
                    className={cn(
                      "absolute -right-3 h-5 w-1 rounded-l-full bg-white/90 transition-opacity",
                      active ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Icon
                    name={s.icon}
                    className={cn(
                      "size-[18px] shrink-0 transition-colors",
                      active ? "text-white" : "text-[var(--sidebar-muted)] group-hover:text-[var(--sidebar-fg)]"
                    )}
                  />
                  <span>{s.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function Brand({ small }: { small?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", !small && "border-b border-[var(--sidebar-border)] px-5 py-4")}>
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-2)] font-bold text-white shadow-lg shadow-[var(--color-primary)]/30",
          small ? "size-8 text-sm" : "size-10"
        )}
      >
        م
      </div>
      <div className="leading-tight">
        <div className={cn("font-bold", small ? "text-sm text-[var(--color-foreground)]" : "text-sm text-[var(--sidebar-fg)]")}>
          {INSTITUTE_NAME}
        </div>
        {!small && <div className="text-[11px] text-[var(--sidebar-muted)]">نظام إدارة المعهد</div>}
      </div>
    </div>
  );
}

function SidebarFooter() {
  return (
    <div className="border-t border-[var(--sidebar-border)] p-3">
      <ThemeToggle />
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* شريط علوي للموبايل */}
      <div className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-card)]/90 px-4 py-3 backdrop-blur lg:hidden">
        <Brand small />
        <button
          onClick={() => setOpen(true)}
          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100"
          aria-label="القائمة"
        >
          <Menu className="size-6" />
        </button>
      </div>

      {/* الشريط الجانبي الثابت (يمين) — سطح المكتب */}
      <aside className="sidebar-shell no-print fixed inset-y-0 right-0 z-20 hidden w-72 flex-col lg:flex">
        <Brand />
        <NavLinks />
        <SidebarFooter />
      </aside>

      {/* درج جانبي للموبايل */}
      {open && (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <div className="animate-fade-in absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="sidebar-shell animate-drawer-in absolute inset-y-0 right-0 flex w-[85vw] max-w-72 flex-col shadow-2xl">
            <div className="relative">
              <Brand />
              <button
                onClick={() => setOpen(false)}
                aria-label="إغلاق"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-fg)]"
              >
                <X className="size-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <SidebarFooter />
          </aside>
        </div>
      )}
    </>
  );
}
