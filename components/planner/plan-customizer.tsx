"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, Sparkles } from "lucide-react";

import { GlassCard } from "@/components/glass/glass-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { groupTopicsByMonth } from "@/lib/topic-grouping";
import { applyScheduleAction } from "@/app/(app)/planner/customize/actions";
import type { PreviewScheduleEntry } from "@/lib/validation/planner-customize";

export function PlanCustomizer() {
  const [prompt, setPrompt] = useState("");
  // Refinement doesn't send the previous schedule back as data (a full
  // ~176-entry schedule alongside the ~176-topic context routinely blew
  // Groq's per-minute token budget) — instead each follow-up instruction is
  // appended here and the whole thing is sent as one combined text prompt,
  // regenerated fresh each time.
  const [instructions, setInstructions] = useState<string[]>([]);
  const [preview, setPreview] = useState<PreviewScheduleEntry[] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, startApplying] = useTransition();

  async function handleGenerate() {
    const text = prompt.trim();
    if (!text || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    const nextInstructions = [...instructions, text];
    const combinedPrompt =
      nextInstructions.length === 1
        ? nextInstructions[0]
        : `${nextInstructions[0]}\n\n${nextInstructions
            .slice(1)
            .map((instruction) => `Additional refinement: ${instruction}`)
            .join("\n\n")}`;

    try {
      const response = await fetch("/api/planner/customize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: combinedPrompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setInstructions(nextInstructions);
      setPreview(data.schedule);
      setNote(data.note ?? null);
      setPrompt("");
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleApply() {
    if (!preview || preview.length === 0) return;
    startApplying(async () => {
      await applyScheduleAction(preview);
    });
  }

  const grouped = preview
    ? groupTopicsByMonth(
        preview.map((entry) => ({
          ...entry,
          week_number: entry.weekNumber,
        }))
      )
    : [];

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/planner"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to planner
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create your own plan</h1>
        <p className="mt-1 text-muted-foreground">
          Describe how you want to study — the AI reschedules the real GATE CSE syllabus to fit.
          It won&rsquo;t invent new topics, only rearrange the existing ones.
        </p>
      </div>

      <GlassCard strong>
        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={
            preview
              ? "Describe a change, e.g. \"give DBMS one more week and drop Compiler Design\""
              : "e.g. \"I only have 4 months, I'm weak in DBMS and OS so give them extra weeks, skip Compiler Design entirely\""
          }
          className="min-h-24"
        />
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
        <Button
          type="button"
          variant="accent"
          className="mt-3"
          disabled={isGenerating || !prompt.trim()}
          onClick={handleGenerate}
        >
          {isGenerating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {preview ? "Refine plan" : "Generate plan"}
        </Button>
      </GlassCard>

      {preview ? (
        <>
          <GlassCard>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Preview</p>
                {note ? <p className="mt-1 text-sm text-muted-foreground">{note}</p> : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  {preview.length} topic{preview.length === 1 ? "" : "s"} scheduled
                </p>
              </div>
              <Button type="button" variant="accent" disabled={isApplying} onClick={handleApply}>
                {isApplying ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                Apply to my planner
              </Button>
            </div>
          </GlassCard>

          <div className="flex flex-col gap-3">
            {grouped.map(({ month, weeks }) => (
              <GlassCard key={month} strong>
                <h2 className="font-semibold">Month {month}</h2>
                <div className="mt-3 flex flex-col gap-3">
                  {weeks.map(({ weekNumber, topics }) => (
                    <div key={weekNumber}>
                      <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Week {weekNumber}
                      </h3>
                      <ul className="flex flex-col gap-1">
                        {topics.map((topic) => (
                          <li key={topic.topicId} className="text-sm">
                            <span className="text-muted-foreground">{topic.subject}:</span>{" "}
                            {topic.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </GlassCard>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
