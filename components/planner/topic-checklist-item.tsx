"use client";

import { useTransition } from "react";
import Link from "next/link";
import { NotebookPen } from "lucide-react";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { toggleTopicCompletion } from "@/app/(app)/planner/actions";

export function TopicChecklistItem({
  topicId,
  title,
  completed,
}: {
  topicId: string;
  title: string;
  completed: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-glass-sm px-3 py-2.5 transition-colors hover:bg-white/50",
        isPending && "opacity-60"
      )}
    >
      <Checkbox
        checked={completed}
        disabled={isPending}
        aria-label={`Mark "${title}" as ${completed ? "incomplete" : "complete"}`}
        onCheckedChange={(checked) => {
          startTransition(async () => {
            await toggleTopicCompletion(topicId, checked === true);
          });
        }}
      />
      <span
        className={cn(
          "flex-1 text-sm",
          completed && "text-muted-foreground line-through decoration-muted-foreground/50"
        )}
      >
        {title}
      </span>
      <Link
        href={`/planner/${topicId}`}
        aria-label={`Open notes for "${title}"`}
        className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
      >
        <NotebookPen className="size-4" />
      </Link>
    </div>
  );
}
