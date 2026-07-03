import type { CSSProperties } from "react";
import { ChevronDown } from "lucide-react";

import { GlassCard } from "@/components/glass/glass-card";
import { StreakBadge } from "@/components/shared/streak-badge";
import { MonthlyProgressBars } from "@/components/shared/monthly-progress-bars";
import { SubjectProgressPanel } from "@/components/subjects/subject-progress-panel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { progressPercent } from "@/lib/progress";
import type { SubjectSummary } from "@/lib/queries/subjects";

export function MemberCard({
  displayName,
  avatarUrl,
  completedCount,
  totalTopics,
  currentStreak,
  subjects,
  monthlyTrend,
  isYou,
  style,
}: {
  displayName: string | null;
  avatarUrl: string | null;
  completedCount: number;
  totalTopics: number;
  currentStreak: number;
  subjects: SubjectSummary[];
  monthlyTrend: { month: number; completed: number; total: number }[];
  isYou: boolean;
  style?: CSSProperties;
}) {
  const percent = progressPercent(completedCount, totalTopics);
  const name = displayName ?? "Squad member";

  return (
    <GlassCard className="p-0" style={style}>
      <details className="group">
        <summary className="flex cursor-pointer list-none flex-col gap-4 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Avatar className="size-11">
              <AvatarImage src={avatarUrl ?? undefined} alt={name} />
              <AvatarFallback className="bg-accent-gradient text-white">
                {name.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {name}
                {isYou ? (
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>
                ) : null}
              </p>
              <p className="text-xs text-muted-foreground">
                {completedCount}/{totalTopics} topics
              </p>
            </div>
            <StreakBadge streak={currentStreak} />
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </div>
          <Progress value={percent} />
        </summary>

        <div className="flex flex-col gap-5 border-t border-white/40 p-5 pt-4 sm:p-6 sm:pt-4">
          <div>
            <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Subject progress
            </h3>
            <SubjectProgressPanel subjects={subjects} sortBy="weakest" />
          </div>
          <div>
            <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Monthly trend
            </h3>
            <MonthlyProgressBars data={monthlyTrend} />
          </div>
        </div>
      </details>
    </GlassCard>
  );
}
