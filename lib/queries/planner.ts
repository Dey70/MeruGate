import { createClient } from "@/lib/supabase/server";

export { groupTopicsByMonth } from "@/lib/topic-grouping";

export interface TopicRow {
  id: string;
  subjectId: string;
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

// subject is a display-name join against `subjects`, not an embedded
// select — same "fetch separately, join in JS" convention getAllUserNotes
// already uses for topic titles, kept low-risk against the hand-maintained
// database types (see lib/database.types.ts header).
export async function getAllTopics(): Promise<TopicRow[]> {
  const supabase = await createClient();
  const [{ data, error }, { data: subjects, error: subjectsError }] = await Promise.all([
    supabase
      .from("topics")
      .select("id, subject_id, title, month, week_number, order_index")
      .order("order_index"),
    supabase.from("subjects").select("id, name"),
  ]);

  if (error) throw error;
  if (subjectsError) throw subjectsError;

  const subjectNameMap = new Map((subjects ?? []).map((s) => [s.id, s.name]));

  return (data ?? []).map((topic) => ({
    id: topic.id,
    subjectId: topic.subject_id,
    subject: subjectNameMap.get(topic.subject_id) ?? "",
    title: topic.title,
    month: topic.month,
    week_number: topic.week_number,
    order_index: topic.order_index,
  }));
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

export interface ScheduleEntry {
  topicId: string;
  month: number;
  weekNumber: number;
  orderIndex: number;
}

export async function getUserSchedule(userId: string): Promise<ScheduleEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_topic_schedule")
    .select("topic_id, month, week_number, order_index")
    .eq("user_id", userId);

  if (error) throw error;
  return (data ?? []).map((row) => ({
    topicId: row.topic_id,
    month: row.month,
    weekNumber: row.week_number,
    orderIndex: row.order_index,
  }));
}

// A user with no schedule rows is on the default plan. A user with any rows
// sees only those topics, at the month/week they were scheduled — everything
// else stays hidden (but their completion history on it is untouched).
export async function getEffectiveTopics(userId: string): Promise<TopicRow[]> {
  const schedule = await getUserSchedule(userId);
  if (schedule.length === 0) return getAllTopics();

  const supabase = await createClient();
  const topicIds = schedule.map((entry) => entry.topicId);
  const [{ data, error }, { data: subjects, error: subjectsError }] = await Promise.all([
    supabase.from("topics").select("id, subject_id, title").in("id", topicIds),
    supabase.from("subjects").select("id, name"),
  ]);

  if (error) throw error;
  if (subjectsError) throw subjectsError;

  const topicMap = new Map((data ?? []).map((topic) => [topic.id, topic]));
  const subjectNameMap = new Map((subjects ?? []).map((s) => [s.id, s.name]));

  return schedule
    .map((entry): TopicRow | null => {
      const topic = topicMap.get(entry.topicId);
      if (!topic) return null;
      return {
        id: topic.id,
        subjectId: topic.subject_id,
        subject: subjectNameMap.get(topic.subject_id) ?? "",
        title: topic.title,
        month: entry.month,
        week_number: entry.weekNumber,
        order_index: entry.orderIndex,
      };
    })
    .filter((topic): topic is TopicRow => topic !== null)
    .sort((a, b) => a.order_index - b.order_index);
}

export async function getTopicsWithProgress(userId: string): Promise<TopicWithProgress[]> {
  const [topics, progressMap] = await Promise.all([
    getEffectiveTopics(userId),
    getUserProgressMap(userId),
  ]);

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
