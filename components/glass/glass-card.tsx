import * as React from "react";

import { cn } from "@/lib/utils";

function GlassCard({
  className,
  strong = false,
  interactive = false,
  ...props
}: React.ComponentProps<"div"> & {
  strong?: boolean;
  interactive?: boolean;
}) {
  return (
    <div
      data-slot="glass-card"
      className={cn(
        "rounded-glass shadow-glass p-6",
        strong ? "glass-surface-strong" : "glass-surface",
        interactive &&
          "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glass hover:glass-surface-strong",
        className
      )}
      {...props}
    />
  );
}

function GlassCardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="glass-card-header"
      className={cn("mb-4 flex items-center justify-between gap-3", className)}
      {...props}
    />
  );
}

function GlassCardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="glass-card-title"
      className={cn("text-lg font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

export { GlassCard, GlassCardHeader, GlassCardTitle };
