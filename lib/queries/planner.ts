import { createClient } from "@/lib/supabase/server";

export interface TopicRow {
  id: string;
  subject: string;
  title: string;
  month: number;
  week_number: number;
  order_index: number;
}

export interface TopicWithProgress extends TopicRow {
  completed: boolean;
  completedAt: string | null;
}

export async function getAllTopics(): Promise<TopicRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("topics")
    .select("id, subject, title, month, week_number, order_index")
    .order("order_index");

  if (error) throw error;
  return data ?? [];
}

export async function getUserProgressMap(
  userId: string
): Promise<Map<string, { completed: boolean; completedAt: string | null }>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_topic_progress")
    .select("topic_id, completed, completed_at")
    .eq("user_id", userId);

  if (error) throw error;

  const map = new Map<string, { completed: boolean; completedAt: string | null }>();
  for (const row of data ?? []) {
    map.set(row.topic_id, { completed: row.completed, completedAt: row.completed_at });
  }
  return map;
}

export async function getTopicsWithProgress(userId: string): Promise<TopicWithProgress[]> {
  const [topics, progressMap] = await Promise.all([getAllTopics(), getUserProgressMap(userId)]);

  return topics.map((topic) => {
    const progress = progressMap.get(topic.id);
    return {
      ...topic,
      completed: progress?.completed ?? false,
      completedAt: progress?.completedAt ?? null,
    };
  });
}

export async function getUserActivityDates(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_activity_days")
    .select("activity_date")
    .eq("user_id", userId);

  if (error) throw error;
  return (data ?? []).map((row) => row.activity_date);
}

export function groupTopicsByMonth<T extends TopicRow>(topics: T[]) {
  const byMonth = new Map<number, Map<number, T[]>>();

  for (const topic of topics) {
    if (!byMonth.has(topic.month)) byMonth.set(topic.month, new Map());
    const weeks = byMonth.get(topic.month)!;
    if (!weeks.has(topic.week_number)) weeks.set(topic.week_number, []);
    weeks.get(topic.week_number)!.push(topic);
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a - b)
    .map(([month, weeks]) => ({
      month,
      weeks: Array.from(weeks.entries())
        .sort(([a], [b]) => a - b)
        .map(([weekNumber, weekTopics]) => ({ weekNumber, topics: weekTopics })),
    }));
}
