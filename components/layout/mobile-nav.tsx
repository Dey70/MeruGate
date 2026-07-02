"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";

import { signOutAction } from "@/lib/actions/auth";

export function MobileNav() {
  return (
    <header className="glass-surface shadow-glass-sm sticky top-0 z-40 mx-3 mt-3 flex items-center justify-between rounded-glass px-4 py-3 lg:hidden">
      <Link href="/dashboard" className="text-sm font-bold tracking-tight">
        MeeruGate
      </Link>
      <form action={signOutAction}>
        <button
          type="submit"
          aria-label="Sign out"
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/60 hover:text-foreground"
        >
          <LogOut className="size-4.5" />
        </button>
      </form>
    </header>
  );
}
