"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListChecks,
  Users,
  NotebookPen,
  Target,
  MessageCircle,
  LogOut,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { signOutAction } from "@/lib/actions/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/planner", label: "Planner", icon: ListChecks },
  { href: "/squad", label: "Squad", icon: Users },
  { href: "/notes", label: "Notes", icon: NotebookPen },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/chat", label: "Ask AI", icon: MessageCircle },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-20 items-center py-6 max-lg:hidden">
      <nav className="glass-surface shadow-glass mx-4 flex w-16 flex-1 flex-col items-center gap-2 rounded-glass py-6">
        <Link
          href="/dashboard"
          className="bg-accent-gradient mb-4 flex size-9 items-center justify-center rounded-full text-sm font-bold text-white shadow-glass-sm"
        >
          M
        </Link>

        <div className="flex flex-1 flex-col items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-glass-sm transition-all duration-200",
                      active
                        ? "bg-accent-gradient text-white shadow-glass-sm"
                        : "text-muted-foreground hover:bg-white/60 hover:text-foreground"
                    )}
                  >
                    <item.icon className="size-[18px]" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        <form action={signOutAction}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="submit"
                aria-label="Sign out"
                className="flex size-10 items-center justify-center rounded-glass-sm text-muted-foreground transition-all duration-200 hover:bg-white/60 hover:text-foreground"
              >
                <LogOut className="size-[18px]" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Sign out</TooltipContent>
          </Tooltip>
        </form>
      </nav>
    </aside>
  );
}
