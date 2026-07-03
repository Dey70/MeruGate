import { createClient } from "@/lib/supabase/server";
import { getSubjectsWithTopics } from "@/lib/queries/subjects";
import { progressPercent } from "@/lib/progress";
import { GlassCard } from "@/components/glass/glass-card";
import { SubjectIcon } from "@/components/subjects/subject-icon";
import { TopicChecklistItem } from "@/components/planner/topic-checklist-item";
import { Progress } from "@/components/ui/progress";

export default async function SubjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const subjects = await getSubjectsWithTopics(user.id);

  const completedCount = subjects.reduce((sum, s) => sum + s.completedCount, 0);
  const totalCount = subjects.reduce((sum, s) => sum + s.totalCount, 0);

  const firstIncompleteSubjectId =
    subjects.find((s) => s.completedCount < s.totalCount)?.id ?? subjects[0]?.id;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
        <p className="mt-1 text-muted-foreground">
          {completedCount} of {totalCount} topics complete, by subject — ordered the way your plan
          sequences them, not the syllabus PDF.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {subjects.map((subject, index) => {
          const percent = progressPercent(subject.completedCount, subject.totalCount);

          return (
            <GlassCard
              key={subject.id}
              className="p-0"
              strong
              style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
            >
              <details open={subject.id === firstIncompleteSubjectId} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <SubjectIcon icon={subject.icon} className="size-5 shrink-0 text-brand" />
                    <h2 className="truncate font-semibold">{subject.name}</h2>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {subject.completedCount}/{subject.totalCount}
                    </span>
                    <Progress value={percent} className="hidden w-24 sm:block" />
                  </div>
                </summary>

                <div className="flex flex-col border-t border-white/40 px-4 pb-4 pt-2 sm:px-6">
                  {subject.topics.map((topic) => (
                    <TopicChecklistItem
                      key={topic.id}
                      topicId={topic.id}
                      title={topic.title}
                      completed={topic.completed}
                    />
                  ))}
                </div>
              </details>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
