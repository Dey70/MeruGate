"use client";

import { useActionState } from "react";
import { Loader2, Target } from "lucide-react";

import { GlassCard } from "@/components/glass/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { progressPercent } from "@/lib/progress";
import type { GoalActionState } from "@/app/(app)/goals/actions";

const initialState: GoalActionState = {};

export function GoalCard({
  title,
  periodLabel,
  targetTopicCount,
  subject,
  actualCount,
  action,
}: {
  title: string;
  periodLabel: string;
  targetTopicCount: number | null;
  subject: string;
  actualCount: number;
  action: (prevState: GoalActionState, formData: FormData) => Promise<GoalActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const hasGoal = targetTopicCount !== null;
  const percent = hasGoal ? progressPercent(actualCount, targetTopicCount) : 0;

  return (
    <GlassCard strong>
      <div className="flex items-center gap-2">
        <Target className="size-5 text-orange-500" />
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{periodLabel}</p>
        </div>
      </div>

      {hasGoal ? (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>
              {actualCount} / {targetTopicCount} topics
              {subject ? <span className="text-muted-foreground"> · {subject}</span> : null}
            </span>
            <span className="text-muted-foreground">{percent}%</span>
          </div>
          <Progress value={percent} className="mt-2" />
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          No goal set yet — you&rsquo;ve completed {actualCount} topic
          {actualCount === 1 ? "" : "s"} so far this period.
        </p>
      )}

      <form action={formAction} className="mt-5 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${title}-target`} className="text-xs">
            Target topics
          </Label>
          <Input
            id={`${title}-target`}
            name="targetTopicCount"
            type="number"
            min={1}
            max={500}
            defaultValue={targetTopicCount ?? undefined}
            required
            className="w-28"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${title}-subject`} className="text-xs">
            Subject (optional)
          </Label>
          <Input
            id={`${title}-subject`}
            name="subject"
            defaultValue={subject}
            placeholder="Any topic"
            className="w-40"
          />
        </div>
        <Button type="submit" variant="outline" disabled={isPending} className="h-9">
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {hasGoal ? "Update goal" : "Set goal"}
        </Button>
      </form>
      {state.error ? <p className="mt-2 text-sm text-destructive">{state.error}</p> : null}
    </GlassCard>
  );
}
