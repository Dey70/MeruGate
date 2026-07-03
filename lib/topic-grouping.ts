// Pure, no server imports — safe to use from both server queries and
// client components (e.g. the AI plan preview, which groups a draft
// schedule before it's ever written to the database).
export function groupTopicsByMonth<T extends { month: number; week_number: number }>(
  topics: T[]
) {
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

export interface SubjectMeta {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  orderIndex: number;
}

// Groups by subject in planner order (subjects[].orderIndex — each
// subject's earliest appearance in the plan), with each subject's own
// topics ordered by (month, week_number, order_index) regardless of the
// order the caller's query returned them in. Subjects with no topics in
// the caller's effective plan (e.g. dropped by a custom AI schedule) are
// omitted rather than shown empty.
export function groupTopicsBySubject<
  T extends { subjectId: string; month: number; week_number: number; order_index: number },
>(topics: T[], subjects: SubjectMeta[]) {
  const bySubject = new Map<string, T[]>();
  for (const topic of topics) {
    if (!bySubject.has(topic.subjectId)) bySubject.set(topic.subjectId, []);
    bySubject.get(topic.subjectId)!.push(topic);
  }

  return subjects
    .filter((subject) => bySubject.has(subject.id))
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((subject) => ({
      ...subject,
      topics: bySubject
        .get(subject.id)!
        .sort((a, b) => a.month - b.month || a.week_number - b.week_number || a.order_index - b.order_index),
    }));
}
