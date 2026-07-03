"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2, Plus, Save, X } from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  upsertNoteAction,
  type NoteActionState,
} from "@/app/(app)/planner/[topicId]/actions";
import type { ResourceLink, ResourceType } from "@/lib/validation/notes";

const initialState: NoteActionState = {};

const RESOURCE_TYPE_OPTIONS: { value: ResourceType; label: string }[] = [
  { value: "youtube", label: "YouTube" },
  { value: "article", label: "Article" },
  { value: "pdf", label: "PDF" },
  { value: "practice", label: "Practice" },
  { value: "other", label: "Other" },
];

export function NoteEditor({
  topicId,
  initialContentMd,
  initialResources,
}: {
  topicId: string;
  initialContentMd: string;
  initialResources: ResourceLink[];
}) {
  const [state, formAction, isPending] = useActionState(upsertNoteAction, initialState);
  const lastSavedAt = useRef<number | undefined>(undefined);
  const [resources, setResources] = useState<ResourceLink[]>(initialResources);

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    } else if (state.savedAt && state.savedAt !== lastSavedAt.current) {
      lastSavedAt.current = state.savedAt;
      toast.success("Note saved");
    }
  }, [state]);

  function addResource() {
    setResources((prev) => [...prev, { id: nanoid(), label: "", url: "", type: "other" }]);
  }

  function removeResource(id: string) {
    setResources((prev) => prev.filter((r) => r.id !== id));
  }

  function updateResource(id: string, patch: Partial<ResourceLink>) {
    setResources((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="topicId" value={topicId} />
      <input type="hidden" name="resourcesJson" value={JSON.stringify(resources)} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contentMd">Notes (markdown)</Label>
        <Textarea
          id="contentMd"
          name="contentMd"
          defaultValue={initialContentMd}
          placeholder="Write your opinions, pointers, remarks..."
          className="min-h-48 font-mono text-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Resources</Label>
        {resources.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No resources yet — add a YouTube video, article, or practice link.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {resources.map((resource) => (
              <div key={resource.id} className="flex flex-wrap items-center gap-2">
                <select
                  value={resource.type}
                  onChange={(event) =>
                    updateResource(resource.id, { type: event.target.value as ResourceType })
                  }
                  className={cn(
                    "h-9 w-28 shrink-0 rounded-md border border-input bg-white/70 px-2 text-sm outline-none",
                    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  )}
                >
                  {RESOURCE_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Input
                  value={resource.label}
                  onChange={(event) => updateResource(resource.id, { label: event.target.value })}
                  placeholder="Label"
                  className="w-32 flex-1 sm:w-auto"
                />
                <Input
                  value={resource.url}
                  onChange={(event) => updateResource(resource.id, { url: event.target.value })}
                  placeholder="https://..."
                  className="min-w-0 flex-2"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove resource"
                  onClick={() => removeResource(resource.id)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={addResource}>
          <Plus className="size-3.5" />
          Add resource
        </Button>
      </div>

      <Button type="submit" variant="accent" disabled={isPending} className="h-10 self-start">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Save note
      </Button>
    </form>
  );
}
