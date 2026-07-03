import { createClient } from "@/lib/supabase/server";
import { computeStreaks } from "@/lib/streaks";
import { progressPercent } from "@/lib/progress";
import { getSubjectsMeta, type SubjectSummary } from "@/lib/queries/subjects";

export interface SquadMemberProgress {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  completedCount: number;
  totalTopics: number;
  currentStreak: number;
  subjects: SubjectSummary[];
  monthlyTrend: { month: number; completed: number; total: number }[];
}

export interface SquadInfo {
  id: string;
  name: string;
  inviteCode: string | null;
  members: SquadMemberProgress[];
}

export async function getMySquad(userId: string): Promise<SquadInfo | null> {
  const supabase = await createClient();

  const { data: membership, error: membershipError } = await supabase
    .from("squad_members")
    .select("squad_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership) return null;

  const squadId = membership.squad_id;

  const [squadResult, memberRowsResult, inviteResult, defaultTopicsResult, subjectsMeta] =
    await Promise.all([
      supabase.from("squads").select("id, name").eq("id", squadId).single(),
      supabase.from("squad_members").select("user_id").eq("squad_id", squadId),
      supabase
        .from("squad_invites")
        .select("code")
        .eq("squad_id", squadId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
      // Full rows, not just a count: this is the shared reference frame used
      // to bucket every member's completions into subject/month totals below.
      supabase.from("topics").select("id, subject_id, month"),
      getSubjectsMeta(),
    ]);

  if (squadResult.error) throw squadResult.error;
  if (memberRowsResult.error) throw memberRowsResult.error;
  if (defaultTopicsResult.error) throw defaultTopicsResult.error;

  const memberIds = (memberRowsResult.data ?? []).map((row) => row.user_id);
  const defaultTopics = defaultTopicsResult.data ?? [];
  const defaultTopicsCount = defaultTopics.length;
  const topicMetaMap = new Map(
    defaultTopics.map((t) => [t.id, { subjectId: t.subject_id, month: t.month }])
  );

  const totalBySubject = new Map<string, number>();
  const totalByMonth = new Map<number, number>();
  for (const topic of defaultTopics) {
    totalBySubject.set(topic.subject_id, (totalBySubject.get(topic.subject_id) ?? 0) + 1);
    totalByMonth.set(topic.month, (totalByMonth.get(topic.month) ?? 0) + 1);
  }
  const months = Array.from(totalByMonth.keys()).sort((a, b) => a - b);

  const [usersResult, progressResult, activityResult, scheduleCountsResult] = await Promise.all([
    supabase.from("users").select("id, display_name, avatar_url").in("id", memberIds),
    supabase
      .from("user_topic_progress")
      .select("user_id, topic_id, completed")
      .in("user_id", memberIds),
    supabase.from("user_activity_days").select("user_id, activity_date").in("user_id", memberIds),
    // RLS on user_topic_schedule is owner-only (custom plans are private),
    // so per-member counts have to come through this security-definer
    // function rather than a direct table select — see 0004_user_topic_schedule.sql.
    supabase.rpc("squad_topic_counts"),
  ]);

  if (usersResult.error) throw usersResult.error;
  if (progressResult.error) throw progressResult.error;
  if (activityResult.error) throw activityResult.error;
  if (scheduleCountsResult.error) throw scheduleCountsResult.error;

  const userMap = new Map((usersResult.data ?? []).map((u) => [u.id, u]));

  // Subject/month breakdown is bucketed against the shared default-plan
  // topic list above (topicMetaMap), not each member's personal
  // user_topic_schedule — that table is owner-only by RLS design (see
  // 0004_user_topic_schedule.sql), so a member on a heavily customized plan
  // will see their monthly "total" computed against the default plan's
  // shape, same simplification squad_topic_counts() already makes for the
  // overall topic-count case. No schedule details leak either way — only
  // aggregate completed/total counts are ever exposed to squad-mates.
  const completedByUser = new Map<string, number>();
  const completedBySubjectByUser = new Map<string, Map<string, number>>();
  const completedByMonthByUser = new Map<string, Map<number, number>>();
  for (const row of progressResult.data ?? []) {
    if (!row.completed) continue;
    completedByUser.set(row.user_id, (completedByUser.get(row.user_id) ?? 0) + 1);

    const meta = topicMetaMap.get(row.topic_id);
    if (!meta) continue;

    const bySubject = completedBySubjectByUser.get(row.user_id) ?? new Map<string, number>();
    bySubject.set(meta.subjectId, (bySubject.get(meta.subjectId) ?? 0) + 1);
    completedBySubjectByUser.set(row.user_id, bySubject);

    const byMonth = completedByMonthByUser.get(row.user_id) ?? new Map<number, number>();
    byMonth.set(meta.month, (byMonth.get(meta.month) ?? 0) + 1);
    completedByMonthByUser.set(row.user_id, byMonth);
  }

  const activityByUser = new Map<string, string[]>();
  for (const row of activityResult.data ?? []) {
    const list = activityByUser.get(row.user_id) ?? [];
    list.push(row.activity_date);
    activityByUser.set(row.user_id, list);
  }

  // Each member's own topic count if they're on a custom plan, else the
  // shared default — so progress % stays fair when plans differ.
  const topicCountByUser = new Map<string, number>();
  for (const row of scheduleCountsResult.data ?? []) {
    topicCountByUser.set(row.user_id, row.topic_count);
  }

  const members: SquadMemberProgress[] = memberIds.map((id) => {
    const profile = userMap.get(id);
    const { currentStreak } = computeStreaks(activityByUser.get(id) ?? []);
    const completedBySubject = completedBySubjectByUser.get(id) ?? new Map<string, number>();
    const completedByMonth = completedByMonthByUser.get(id) ?? new Map<number, number>();

    const subjects: SubjectSummary[] = subjectsMeta.map((subject) => {
      const completedCount = completedBySubject.get(subject.id) ?? 0;
      const totalCount = totalBySubject.get(subject.id) ?? 0;
      return {
        ...subject,
        completedCount,
        totalCount,
        percent: progressPercent(completedCount, totalCount),
      };
    });

    const monthlyTrend = months.map((month) => ({
      month,
      completed: completedByMonth.get(month) ?? 0,
      total: totalByMonth.get(month) ?? 0,
    }));

    return {
      userId: id,
      displayName: profile?.display_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      completedCount: completedByUser.get(id) ?? 0,
      totalTopics: topicCountByUser.get(id) || defaultTopicsCount,
      currentStreak,
      subjects,
      monthlyTrend,
    };
  });

  // Alphabetical, not ranked by streak/progress — the spec explicitly rules
  // out anything leaderboard-shaped, even within a single squad.
  members.sort((a, b) => (a.displayName ?? "").localeCompare(b.displayName ?? ""));

  return {
    id: squadResult.data.id,
    name: squadResult.data.name,
    inviteCode: inviteResult.data?.code ?? null,
    members,
  };
}
