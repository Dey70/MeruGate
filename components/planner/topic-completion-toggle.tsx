"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle } from "lucide-react";

import { cn } from "@/lib/utils";
import { toggleTopicCompletion } from "@/app/(app)/planner/actions";

export function TopicCompletionToggle({
  topicId,
  initialCompleted,
}: {
  topicId: string;
  initialCompleted: boolean;
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        const next = !completed;
        setCompleted(next);
        startTransition(async () => {
          await toggleTopicCompletion(topicId, next);
        });
      }}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
        completed
          ? "bg-accent-gradient text-white shadow-glass-sm"
          : "glass-surface text-muted-foreground hover:text-foreground",
        isPending && "opacity-60"
      )}
    >
      {completed ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
      {completed ? "Completed" : "Mark complete"}
    </button>
  );
}
