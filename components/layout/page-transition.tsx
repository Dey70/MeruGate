"use client";

import { usePathname } from "next/navigation";

// Keying on pathname forces a remount on real navigation (not on
// search-param-only changes, since usePathname ignores those), which
// re-triggers the fade-in-up CSS animation — a lightweight page-transition
// effect with no extra animation library.
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="animate-fade-in-up">
      {children}
    </div>
  );
}
