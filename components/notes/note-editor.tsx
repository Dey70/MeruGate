"use client";

import { useActionState, useEffect, useRef } from "react";
import { ExternalLink, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  upsertNoteAction,
  type NoteActionState,
} from "@/app/(app)/planner/[topicId]/actions";

const initialState: NoteActionState = {};

export function NoteEditor({
  topicId,
  initialContentMd,
  initialNotionLink,
}: {
  topicId: string;
  initialContentMd: string;
  initialNotionLink: string | null;
}) {
  const [state, formAction, isPending] = useActionState(upsertNoteAction, initialState);
  const lastSavedAt = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    } else if (state.savedAt && state.savedAt !== lastSavedAt.current) {
      lastSavedAt.current = state.savedAt;
      toast.success("Note saved");
    }
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="topicId" value={topicId} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contentMd">Notes (markdown)</Label>
        <Textarea
          id="contentMd"
          name="contentMd"
          defaultValue={initialContentMd}
          placeholder="Write your notes for this topic..."
          className="min-h-48 font-mono text-sm"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notionLink" className="flex items-center gap-1.5">
          Notion link <ExternalLink className="size-3.5 text-muted-foreground" />
        </Label>
        <Input
          id="notionLink"
          name="notionLink"
          type="url"
          defaultValue={initialNotionLink ?? ""}
          placeholder="https://notion.so/..."
        />
      </div>

      <Button type="submit" variant="accent" disabled={isPending} className="h-10 self-start">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Save note
      </Button>
    </form>
  );
}
