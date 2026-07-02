import { endOfMonth, endOfWeek, formatISO, startOfMonth, startOfWeek } from "date-fns";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";

type GoalRow = Tables<"goals">;

export interface GoalPeriod {
  goal: GoalRow | null;
  periodStart: string;
  actualCount: number;
}

export interface CurrentGoals {
  weekly: GoalPeriod;
  monthly: GoalPeriod;
}

async function countCompletedInRange(
  userId: string,
  start: Date,
  end: Date,
  subject: string
): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_topic_progress")
    .select("topic_id")
    .eq("user_id", userId)
    .eq("completed", true)
    .gte("completed_at", start.toISOString())
    .lte("completed_at", end.toISOString());

  if (error) throw error;
  const rows = data ?? [];
  if (!subject || rows.length === 0) return rows.length;

  const topicIds = rows.map((row) => row.topic_id);
  const { data: topics, error: topicsError } = await supabase
    .from("topics")
    .select("id")
    .in("id", topicIds)
    .eq("subject", subject);

  if (topicsError) throw topicsError;
  return topics?.length ?? 0;
}

export async function getCurrentGoals(userId: string): Promise<CurrentGoals> {
  const supabase = await createClient();
  const now = new Date();

  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const weekStartStr = formatISO(weekStart, { representation: "date" });
  const monthStartStr = formatISO(monthStart, { representation: "date" });

  const [weeklyResult, monthlyResult] = await Promise.all([
    supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .eq("period_type", "weekly")
      .eq("period_start", weekStartStr)
      .maybeSingle(),
    supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .eq("period_type", "monthly")
      .eq("period_start", monthStartStr)
      .maybeSingle(),
  ]);

  if (weeklyResult.error) throw weeklyResult.error;
  if (monthlyResult.error) throw monthlyResult.error;

  const [weeklyActual, monthlyActual] = await Promise.all([
    countCompletedInRange(userId, weekStart, weekEnd, weeklyResult.data?.subject ?? ""),
    countCompletedInRange(userId, monthStart, monthEnd, monthlyResult.data?.subject ?? ""),
  ]);

  return {
    weekly: { goal: weeklyResult.data, periodStart: weekStartStr, actualCount: weeklyActual },
    monthly: { goal: monthlyResult.data, periodStart: monthStartStr, actualCount: monthlyActual },
  };
}
