import { format, parseISO } from "date-fns";

import { createClient } from "@/lib/supabase/server";
import { getCurrentGoals } from "@/lib/queries/goals";
import { GoalCard } from "@/components/goals/goal-card";
import { upsertMonthlyGoalAction, upsertWeeklyGoalAction } from "@/app/(app)/goals/actions";

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { weekly, monthly } = await getCurrentGoals(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Goals</h1>
        <p className="mt-1 text-muted-foreground">Target vs. actual, this week and this month.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <GoalCard
          title="This week"
          periodLabel={`Week of ${format(parseISO(weekly.periodStart), "MMM d")}`}
          targetTopicCount={weekly.goal?.target_topic_count ?? null}
          subject={weekly.goal?.subject ?? ""}
          actualCount={weekly.actualCount}
          action={upsertWeeklyGoalAction}
        />
        <GoalCard
          title="This month"
          periodLabel={format(parseISO(monthly.periodStart), "MMMM yyyy")}
          targetTopicCount={monthly.goal?.target_topic_count ?? null}
          subject={monthly.goal?.subject ?? ""}
          actualCount={monthly.actualCount}
          action={upsertMonthlyGoalAction}
        />
      </div>
    </div>
  );
}
