import { Flame } from "lucide-react";

import { cn } from "@/lib/utils";

export function StreakBadge({ streak, className }: { streak: number; className?: string }) {
  const active = streak > 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold",
        active ? "bg-accent-gradient text-white shadow-glass-sm" : "glass-surface text-muted-foreground",
        className
      )}
    >
      <Flame className={cn("size-4", active ? "text-white" : "text-muted-foreground")} />
      {streak} day{streak === 1 ? "" : "s"}
    </span>
  );
}
