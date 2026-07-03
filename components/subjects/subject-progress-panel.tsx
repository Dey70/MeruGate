import { SubjectIcon } from "@/components/subjects/subject-icon";
import { Progress } from "@/components/ui/progress";
import type { SubjectSummary } from "@/lib/queries/subjects";

// Purely presentational — no data fetching, no GlassCard wrapper (the
// caller owns the surrounding card so this can be reused verbatim on the
// Dashboard, Planner, and inside a squad member's expanded detail).
export function SubjectProgressPanel({
  subjects,
  sortBy = "weakest",
  limit,
}: {
  subjects: SubjectSummary[];
  sortBy?: "weakest" | "planner";
  limit?: number;
}) {
  const sorted =
    sortBy === "weakest" ? [...subjects].sort((a, b) => a.percent - b.percent) : subjects;
  const rows = limit ? sorted.slice(0, limit) : sorted;

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No subjects yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((subject) => (
        <div key={subject.id} className="flex items-center gap-3">
          <SubjectIcon icon={subject.icon} className="size-4 shrink-0 text-brand" />
          <span className="min-w-0 flex-1 truncate text-sm">{subject.name}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {subject.completedCount}/{subject.totalCount} · {subject.percent}%
          </span>
          <Progress value={subject.percent} className="hidden w-20 shrink-0 sm:block" />
        </div>
      ))}
    </div>
  );
}
