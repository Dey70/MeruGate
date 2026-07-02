"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav-items";

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="glass-surface-strong shadow-glass fixed inset-x-3 bottom-3 z-40 flex items-stretch justify-between rounded-glass px-1 py-1 lg:hidden"
      style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
      aria-label="Primary"
    >
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-glass-sm py-1.5 transition-colors duration-200"
          >
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full transition-all duration-200",
                active ? "bg-accent-gradient text-white shadow-glass-sm" : "text-muted-foreground"
              )}
            >
              <item.icon className="size-4.5" />
            </span>
            <span
              className={cn(
                "max-w-full truncate px-0.5 text-[10px] font-medium",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
