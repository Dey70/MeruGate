import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ArrowRight, Flame, ListChecks, Sparkles, Target, Users2 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getTopicsWithProgress, getUserActivityDates } from "@/lib/queries/planner";
import { getMySquad } from "@/lib/queries/squad";
import { getCurrentGoals } from "@/lib/queries/goals";
import { computeStreaks } from "@/lib/streaks";
import { progressPercent } from "@/lib/progress";
import { GlassCard, GlassCardHeader, GlassCardTitle } from "@/components/glass/glass-card";
import { StreakBadge } from "@/components/shared/streak-badge";
import { TopicChecklistItem } from "@/components/planner/topic-checklist-item";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [topics, activityDates, squad, goals] = await Promise.all([
    getTopicsWithProgress(user.id),
    getUserActivityDates(user.id),
    getMySquad(user.id),
    getCurrentGoals(user.id),
  ]);

  const { currentStreak, longestStreak } = computeStreaks(activityDates);
  const completedCount = topics.filter((t) => t.completed).length;
  const overallProgress = progressPercent(completedCount, topics.length);
  const upNext = topics.filter((t) => !t.completed).slice(0, 5);

  const weeklyPercent = goals.weekly.goal
    ? progressPercent(goals.weekly.actualCount, goals.weekly.goal.target_topic_count)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back{user.email ? `, ${user.email.split("@")[0]}` : ""}
        </h1>
        <p className="mt-1 text-muted-foreground">Here&rsquo;s where your prep stands today.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GlassCard strong className="sm:col-span-1" style={{ animationDelay: "0ms" }}>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Flame className="size-4 text-brand" />
            Current streak
          </div>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-4xl font-bold tracking-tight">{currentStreak}</span>
            <span className="mb-1 text-sm text-muted-foreground">
              day{currentStreak === 1 ? "" : "s"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Longest: {longestStreak} days</p>
        </GlassCard>

        <GlassCard strong className="sm:col-span-2" style={{ animationDelay: "60ms" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ListChecks className="size-4 text-brand" />
              Overall syllabus progress
            </div>
            <span className="text-sm font-semibold">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="mt-3" />
          <p className="mt-2 text-xs text-muted-foreground">
            {completedCount} of {topics.length} topics complete
          </p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <GlassCard strong className="lg:col-span-2" style={{ animationDelay: "120ms" }}>
          <GlassCardHeader>
            <GlassCardTitle>Up next</GlassCardTitle>
            <Link href="/planner" className="text-sm text-muted-foreground hover:text-foreground">
              <ArrowRight className="size-4" />
            </Link>
          </GlassCardHeader>
          {upNext.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You&rsquo;ve completed every topic. Time to hit Goals and Ask AI for a quiz.
            </p>
          ) : (
            <div className="flex flex-col">
              {upNext.map((topic) => (
                <TopicChecklistItem
                  key={topic.id}
                  topicId={topic.id}
                  title={topic.title}
                  completed={topic.completed}
                />
              ))}
            </div>
          )}
        </GlassCard>

        <div className="flex flex-col gap-4">
          <GlassCard strong style={{ animationDelay: "180ms" }}>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Users2 className="size-4 text-brand" />
                Squad
              </GlassCardTitle>
            </GlassCardHeader>
            {squad ? (
              <div className="flex flex-col gap-2">
                {squad.members.slice(0, 4).map((member) => (
                  <div key={member.userId} className="flex items-center justify-between text-sm">
                    <span className="truncate">{member.displayName ?? "Squad member"}</span>
                    <StreakBadge streak={member.currentStreak} className="px-2 py-0.5 text-xs" />
                  </div>
                ))}
                <Button asChild variant="ghost" size="sm" className="mt-1 self-start">
                  <Link href="/squad">
                    View squad <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  You haven&rsquo;t joined a squad yet.
                </p>
                <Button asChild variant="accent" size="sm" className="self-start">
                  <Link href="/squad">Join your squad</Link>
                </Button>
              </div>
            )}
          </GlassCard>

          <GlassCard strong style={{ animationDelay: "240ms" }}>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Target className="size-4 text-brand" />
                This week&rsquo;s goal
              </GlassCardTitle>
            </GlassCardHeader>
            {goals.weekly.goal ? (
              <>
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>
                    {goals.weekly.actualCount}/{goals.weekly.goal.target_topic_count} topics
                  </span>
                  <span className="text-muted-foreground">{weeklyPercent}%</span>
                </div>
                <Progress value={weeklyPercent ?? 0} className="mt-2" />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No goal set for the week of {format(parseISO(goals.weekly.periodStart), "MMM d")}.
              </p>
            )}
            <Button asChild variant="ghost" size="sm" className="mt-3 self-start">
              <Link href="/goals">
                Manage goals <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </GlassCard>

          <GlassCard strong interactive style={{ animationDelay: "300ms" }}>
            <Link href="/chat" className="flex items-center gap-3">
              <span className="bg-accent-gradient flex size-9 items-center justify-center rounded-full text-white">
                <Sparkles className="size-4" />
              </span>
              <div>
                <p className="font-semibold">Ask AI</p>
                <p className="text-xs text-muted-foreground">Doubt-solving & quizzing</p>
              </div>
            </Link>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
