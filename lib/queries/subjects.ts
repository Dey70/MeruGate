import { createClient } from "@/lib/supabase/server";
import { progressPercent } from "@/lib/progress";
import { groupTopicsBySubject, type SubjectMeta } from "@/lib/topic-grouping";
import { getTopicsWithProgress, type TopicWithProgress } from "@/lib/queries/planner";

export type { SubjectMeta } from "@/lib/topic-grouping";

export async function getSubjectsMeta(): Promise<SubjectMeta[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subjects")
    .select("id, name, slug, icon, order_index")
    .order("order_index");

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon,
    orderIndex: row.order_index,
  }));
}

export interface SubjectWithTopics extends SubjectMeta {
  topics: TopicWithProgress[];
  completedCount: number;
  totalCount: number;
}

// Returned in planner order (subjects[].orderIndex) — /subjects reads this
// directly; SubjectProgressPanel re-sorts weakest-first itself when needed.
export async function getSubjectsWithTopics(userId: string): Promise<SubjectWithTopics[]> {
  const [topics, subjects] = await Promise.all([getTopicsWithProgress(userId), getSubjectsMeta()]);

  return groupTopicsBySubject(topics, subjects).map((subject) => ({
    ...subject,
    completedCount: subject.topics.filter((t) => t.completed).length,
    totalCount: subject.topics.length,
  }));
}

export interface SubjectSummary extends SubjectMeta {
  completedCount: number;
  totalCount: number;
  percent: number;
}

export async function getSubjectsWithProgress(userId: string): Promise<SubjectSummary[]> {
  const subjects = await getSubjectsWithTopics(userId);
  return subjects.map((subject) => ({
    id: subject.id,
    name: subject.name,
    slug: subject.slug,
    icon: subject.icon,
    orderIndex: subject.orderIndex,
    completedCount: subject.completedCount,
    totalCount: subject.totalCount,
    percent: progressPercent(subject.completedCount, subject.totalCount),
  }));
}
