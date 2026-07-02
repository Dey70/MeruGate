import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getNoteForTopic } from "@/lib/queries/notes";
import { GlassCard } from "@/components/glass/glass-card";
import { NoteEditor } from "@/components/notes/note-editor";
import { Button } from "@/components/ui/button";
import { TopicCompletionToggle } from "@/components/planner/topic-completion-toggle";

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: topic, error: topicError }, { data: progress }, note] = await Promise.all([
    supabase
      .from("topics")
      .select("id, subject, title, month, week_number")
      .eq("id", topicId)
      .single(),
    supabase
      .from("user_topic_progress")
      .select("completed")
      .eq("user_id", user.id)
      .eq("topic_id", topicId)
      .maybeSingle(),
    getNoteForTopic(user.id, topicId),
  ]);

  if (topicError || !topic) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/planner"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to planner
      </Link>

      <GlassCard strong>
        <p className="text-xs font-semibold tracking-wide text-brand uppercase">
          {topic.subject} · Month {topic.month}, Week {topic.week_number}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">{topic.title}</h1>
          <div className="flex items-center gap-3">
            <TopicCompletionToggle topicId={topic.id} initialCompleted={progress?.completed ?? false} />
            <Button asChild variant="accent" size="sm">
              <Link href={`/chat?topicId=${topic.id}`}>
                <Sparkles className="size-4" />
                Ask AI
              </Link>
            </Button>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="mb-4 text-lg font-semibold">Notes</h2>
        <NoteEditor
          topicId={topic.id}
          initialContentMd={note?.contentMd ?? ""}
          initialNotionLink={note?.notionLink ?? null}
        />
      </GlassCard>
    </div>
  );
}
