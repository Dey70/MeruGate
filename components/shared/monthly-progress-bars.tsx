import { progressPercent } from "@/lib/progress";
import { Progress } from "@/components/ui/progress";

// Generic, domain-agnostic (lives in components/shared, not components/squad)
// even though squad is its only consumer today. Plain CSS bars, no charting
// library — consistent with the rest of the app.
export function MonthlyProgressBars({
  data,
}: {
  data: { month: number; completed: number; total: number }[];
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No monthly data yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {data.map(({ month, completed, total }) => (
        <div key={month} className="flex items-center gap-3">
          <span className="w-16 shrink-0 text-xs text-muted-foreground">Month {month}</span>
          <Progress value={progressPercent(completed, total)} className="flex-1" />
          <span className="w-12 shrink-0 text-right text-xs text-muted-foreground">
            {completed}/{total}
          </span>
        </div>
      ))}
    </div>
  );
}
