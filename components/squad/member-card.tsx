import { GlassCard } from "@/components/glass/glass-card";
import { StreakBadge } from "@/components/shared/streak-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { progressPercent } from "@/lib/progress";

export function MemberCard({
  displayName,
  avatarUrl,
  completedCount,
  totalTopics,
  currentStreak,
  isYou,
}: {
  displayName: string | null;
  avatarUrl: string | null;
  completedCount: number;
  totalTopics: number;
  currentStreak: number;
  isYou: boolean;
}) {
  const percent = progressPercent(completedCount, totalTopics);
  const name = displayName ?? "Squad member";

  return (
    <GlassCard interactive>
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
            {isYou ? <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span> : null}
          </p>
          <p className="text-xs text-muted-foreground">
            {completedCount}/{totalTopics} topics
          </p>
        </div>
        <StreakBadge streak={currentStreak} />
      </div>
      <Progress value={percent} className="mt-4" />
    </GlassCard>
  );
}
