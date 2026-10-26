"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  LibraryBig,
  Settings2,
  type LucideIcon
} from "lucide-react";
import type { ReactNode } from "react";
import { StatusBanner } from "./status-banner";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { href: "/today", label: "Today", icon: CheckCircle2 },
  { href: "/weekly", label: "Weekly", icon: CalendarDays },
  { href: "/goals", label: "Goals & Learning", icon: BookOpen },
  { href: "/learning", label: "Learning", icon: LibraryBig },
  { href: "/review", label: "Review", icon: ClipboardCheck },
  { href: "/settings", label: "Settings", icon: Settings2 }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f7f7f4] text-stone-950">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-64 shrink-0 border-r border-stone-200 bg-[#f7f7f4] md:flex md:flex-col">
          <div className="flex h-full flex-col px-4 py-5">
            <Link
              className="flex items-center gap-3 rounded-lg px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              href="/today"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-950 text-xs font-semibold text-white">
                WL
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-semibold text-stone-950">
                  Work & Learning
                </span>
                <span className="block text-xs text-stone-500">Planner</span>
              </span>
            </Link>

            <nav aria-label="Primary" className="mt-8 space-y-1">
              {navItems.map((item) => (
                <ShellNavLink
                  item={item}
                  key={item.href}
                  pathname={pathname}
                />
              ))}
            </nav>

            <div className="mt-auto border-t border-stone-200 px-3 pt-4">
              <p className="text-xs leading-5 text-stone-500">
                Local planning layer
                <br />
                over your task system
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-b border-stone-200 bg-[#f7f7f4] px-4 py-4 md:hidden">
            <div className="flex items-center justify-between gap-4">
              <Link className="flex items-center gap-2" href="/today">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-950 text-[11px] font-semibold text-white">
                  WL
                </span>
                <span className="text-sm font-semibold text-stone-950">
                  Work & Learning
                </span>
              </Link>
              <Link
                aria-label="Settings"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600"
                href="/settings"
                title="Settings"
              >
                <Settings2 aria-hidden="true" size={17} strokeWidth={1.8} />
              </Link>
            </div>
            <nav
              aria-label="Primary mobile"
              className="mt-4 flex gap-2 overflow-x-auto pb-1"
            >
              {navItems.filter((item) => item.href !== "/settings").map((item) => (
                <ShellNavLink
                  compact
                  item={item}
                  key={item.href}
                  pathname={pathname}
                />
              ))}
            </nav>
          </header>

          <div className="border-b border-stone-200 px-4 sm:px-6 lg:px-10">
            <StatusBanner />
          </div>

          <main className="px-4 py-7 sm:px-6 lg:px-10 lg:py-10">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

function ShellNavLink({
  item,
  pathname,
  compact = false
}: {
  item: NavItem;
  pathname: string;
  compact?: boolean;
}) {
  const Icon = item.icon;
  const isActive =
    pathname === item.href ||
    (item.href !== "/today" && pathname.startsWith(`${item.href}/`));

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={[
        "flex min-h-10 items-center gap-3 rounded-lg text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700",
        compact ? "shrink-0 border px-3" : "w-full px-3",
        isActive
          ? "border-teal-200 bg-teal-50 text-teal-900"
          : "border-transparent text-stone-600 hover:bg-white hover:text-stone-950"
      ].join(" ")}
      href={item.href}
    >
      <Icon aria-hidden="true" size={17} strokeWidth={1.8} />
      <span>{item.label}</span>
    </Link>
  );
}
