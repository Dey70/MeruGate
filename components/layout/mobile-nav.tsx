"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/actions/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/planner", label: "Planner", icon: ListChecks },
  { href: "/squad", label: "Squad", icon: Users },
  { href: "/notes", label: "Notes", icon: NotebookPen },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/chat", label: "Ask AI", icon: MessageCircle },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <header className="glass-surface shadow-glass-sm sticky top-0 z-40 mx-4 mt-4 hidden items-center justify-between rounded-glass px-4 py-3 max-lg:flex">
      <Link href="/dashboard" className="text-sm font-bold tracking-tight">
        MeeruGate
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open navigation">
            <Menu className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <DropdownMenuItem key={item.href} asChild className={cn(active && "bg-muted")}>
                <Link href={item.href} className="flex items-center gap-2">
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <form action={signOutAction} className="w-full">
              <button type="submit" className="flex w-full items-center gap-2">
                <LogOut className="size-4" />
                Sign out
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
