import Link from "next/link";
import { Sparkles, RotateCcw } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import {
  getTopicsWithProgress,
  getUserActivityDates,
  getUserSchedule,
  groupTopicsByMonth,
} from "@/lib/queries/planner";
import { computeStreaks } from "@/lib/streaks";
import { progressPercent } from "@/lib/progress";
import { GlassCard } from "@/components/glass/glass-card";
import { StreakBadge } from "@/components/shared/streak-badge";
import { TopicChecklistItem } from "@/components/planner/topic-checklist-item";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { resetToDefaultAction } from "@/app/(app)/planner/customize/actions";

export default async function PlannerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [topics, activityDates, schedule] = await Promise.all([
    getTopicsWithProgress(user.id),
    getUserActivityDates(user.id),
    getUserSchedule(user.id),
  ]);

  const hasCustomPlan = schedule.length > 0;
  const { currentStreak } = computeStreaks(activityDates);
  const completedCount = topics.filter((t) => t.completed).length;
  const overallProgress = progressPercent(completedCount, topics.length);
  const months = groupTopicsByMonth(topics);

  const firstIncompleteMonth =
    months.find((m) => m.weeks.some((w) => w.topics.some((t) => !t.completed)))?.month ??
    months[0]?.month;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planner</h1>
          <p className="mt-1 text-muted-foreground">
            {completedCount} of {topics.length} topics complete
          </p>
        </div>
        <StreakBadge streak={currentStreak} />
      </div>

      <GlassCard className="flex flex-wrap items-center justify-between gap-3">
        {hasCustomPlan ? (
          <>
            <span className="text-sm text-muted-foreground">Using your custom plan</span>
            <form action={resetToDefaultAction}>
              <Button type="submit" variant="ghost" size="sm">
                <RotateCcw className="size-3.5" />
                Reset to default plan
              </Button>
            </form>
          </>
        ) : (
          <>
            <span className="text-sm text-muted-foreground">
              Don&rsquo;t like this plan?
            </span>
            <Button asChild variant="accent" size="sm">
              <Link href="/planner/customize">
                <Sparkles className="size-3.5" />
                Create your own with AI
              </Link>
            </Button>
          </>
        )}
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between text-sm font-medium">
          <span>Overall progress</span>
          <span className="text-muted-foreground">{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="mt-3" />
      </GlassCard>

      <div className="flex flex-col gap-4">
        {months.map(({ month, weeks }) => {
          const monthTopics = weeks.flatMap((w) => w.topics);
          const monthCompleted = monthTopics.filter((t) => t.completed).length;
          const monthProgress = progressPercent(monthCompleted, monthTopics.length);
          const subjects = Array.from(new Set(monthTopics.map((t) => t.subject)));

          return (
            <GlassCard key={month} className="p-0" strong>
              <details open={month === firstIncompleteMonth} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold">Month {month}</h2>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {subjects.join(" · ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {monthCompleted}/{monthTopics.length}
                    </span>
                    <Progress value={monthProgress} className="hidden w-24 sm:block" />
                  </div>
                </summary>

                <div className="flex flex-col gap-4 border-t border-white/40 px-4 pb-6 pt-4 sm:px-6">
                  {weeks.map(({ weekNumber, topics: weekTopics }) => (
                    <div key={weekNumber}>
                      <h3 className="mb-1 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Week {weekNumber}
                      </h3>
                      <div className="flex flex-col">
                        {weekTopics.map((topic) => (
                          <TopicChecklistItem
                            key={topic.id}
                            topicId={topic.id}
                            title={topic.title}
                            completed={topic.completed}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
