"use server";

import { revalidatePath } from "next/cache";
import { formatISO, startOfMonth, startOfWeek } from "date-fns";

import { createClient } from "@/lib/supabase/server";
import { upsertGoalSchema } from "@/lib/validation/goals";

export interface GoalActionState {
  error?: string;
}

async function upsertGoal(
  periodType: "weekly" | "monthly",
  formData: FormData
): Promise<GoalActionState> {
  const parsed = upsertGoalSchema.safeParse({
    periodType,
    targetTopicCount: formData.get("targetTopicCount"),
    subject: formData.get("subject") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid goal." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const now = new Date();
  const periodStart = formatISO(
    periodType === "weekly" ? startOfWeek(now, { weekStartsOn: 1 }) : startOfMonth(now),
    { representation: "date" }
  );

  const { error } = await supabase.from("goals").upsert(
    {
      user_id: user.id,
      period_type: parsed.data.periodType,
      period_start: periodStart,
      target_topic_count: parsed.data.targetTopicCount,
      subject: parsed.data.subject,
    },
    { onConflict: "user_id,period_type,period_start,subject" }
  );

  if (error) return { error: error.message };

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return {};
}

export async function upsertWeeklyGoalAction(
  _prevState: GoalActionState,
  formData: FormData
): Promise<GoalActionState> {
  return upsertGoal("weekly", formData);
}

export async function upsertMonthlyGoalAction(
  _prevState: GoalActionState,
  formData: FormData
): Promise<GoalActionState> {
  return upsertGoal("monthly", formData);
}
