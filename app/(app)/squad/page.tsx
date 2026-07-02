import { Users2 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getMySquad } from "@/lib/queries/squad";
import { GlassCard } from "@/components/glass/glass-card";
import { MemberCard } from "@/components/squad/member-card";
import { InviteCodeCard } from "@/components/squad/invite-code-card";
import { JoinSquadForm } from "@/components/squad/join-squad-form";
import { CreateSquadForm } from "@/components/squad/create-squad-form";
import { Separator } from "@/components/ui/separator";

export default async function SquadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const squad = await getMySquad(user.id);

  if (!squad) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Squad</h1>
          <p className="mt-1 text-muted-foreground">You&rsquo;re not in a squad yet.</p>
        </div>

        <GlassCard className="mx-auto w-full max-w-sm" strong>
          <div className="mb-5 text-center">
            <Users2 className="mx-auto size-8 text-brand" />
            <p className="mt-2 text-sm text-muted-foreground">
              Join with the invite code your team shared, or start a new squad.
            </p>
          </div>
          <JoinSquadForm />
          <div className="my-5 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>
          <CreateSquadForm />
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{squad.name}</h1>
          <p className="mt-1 text-muted-foreground">
            {squad.members.length} member{squad.members.length === 1 ? "" : "s"} · streaks and
            progress only, no leaderboard
          </p>
        </div>
      </div>

      <InviteCodeCard squadId={squad.id} code={squad.inviteCode} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {squad.members.map((member) => (
          <MemberCard
            key={member.userId}
            displayName={member.displayName}
            avatarUrl={member.avatarUrl}
            completedCount={member.completedCount}
            totalTopics={member.totalTopics}
            currentStreak={member.currentStreak}
            isYou={member.userId === user.id}
          />
        ))}
      </div>
    </div>
  );
}
