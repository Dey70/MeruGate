import { createClient } from "@/lib/supabase/server";
import { computeStreaks } from "@/lib/streaks";

export interface SquadMemberProgress {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  completedCount: number;
  currentStreak: number;
}

export interface SquadInfo {
  id: string;
  name: string;
  inviteCode: string | null;
  totalTopics: number;
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

  const [squadResult, memberRowsResult, inviteResult, topicsCountResult] = await Promise.all([
    supabase.from("squads").select("id, name").eq("id", squadId).single(),
    supabase.from("squad_members").select("user_id").eq("squad_id", squadId),
    supabase
      .from("squad_invites")
      .select("code")
      .eq("squad_id", squadId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase.from("topics").select("id", { count: "exact", head: true }),
  ]);

  if (squadResult.error) throw squadResult.error;
  if (memberRowsResult.error) throw memberRowsResult.error;
  if (topicsCountResult.error) throw topicsCountResult.error;

  const memberIds = (memberRowsResult.data ?? []).map((row) => row.user_id);

  const [usersResult, progressResult, activityResult] = await Promise.all([
    supabase.from("users").select("id, display_name, avatar_url").in("id", memberIds),
    supabase.from("user_topic_progress").select("user_id, completed").in("user_id", memberIds),
    supabase.from("user_activity_days").select("user_id, activity_date").in("user_id", memberIds),
  ]);

  if (usersResult.error) throw usersResult.error;
  if (progressResult.error) throw progressResult.error;
  if (activityResult.error) throw activityResult.error;

  const userMap = new Map((usersResult.data ?? []).map((u) => [u.id, u]));

  const completedByUser = new Map<string, number>();
  for (const row of progressResult.data ?? []) {
    if (!row.completed) continue;
    completedByUser.set(row.user_id, (completedByUser.get(row.user_id) ?? 0) + 1);
  }

  const activityByUser = new Map<string, string[]>();
  for (const row of activityResult.data ?? []) {
    const list = activityByUser.get(row.user_id) ?? [];
    list.push(row.activity_date);
    activityByUser.set(row.user_id, list);
  }

  const members: SquadMemberProgress[] = memberIds.map((id) => {
    const profile = userMap.get(id);
    const { currentStreak } = computeStreaks(activityByUser.get(id) ?? []);
    return {
      userId: id,
      displayName: profile?.display_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      completedCount: completedByUser.get(id) ?? 0,
      currentStreak,
    };
  });

  // Alphabetical, not ranked by streak/progress — the spec explicitly rules
  // out anything leaderboard-shaped, even within a single squad.
  members.sort((a, b) => (a.displayName ?? "").localeCompare(b.displayName ?? ""));

  return {
    id: squadResult.data.id,
    name: squadResult.data.name,
    inviteCode: inviteResult.data?.code ?? null,
    totalTopics: topicsCountResult.count ?? 0,
    members,
  };
}
