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
