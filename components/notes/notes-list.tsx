"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, NotebookPen, Search } from "lucide-react";

import { GlassCard } from "@/components/glass/glass-card";
import { Input } from "@/components/ui/input";
import type { NoteWithTopic } from "@/lib/queries/notes";

export function NotesList({ notes }: { notes: NoteWithTopic[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (note) =>
        note.topicTitle.toLowerCase().includes(q) ||
        note.topicSubject.toLowerCase().includes(q) ||
        note.contentMd.toLowerCase().includes(q)
    );
  }, [notes, query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search notes..."
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <GlassCard className="text-center text-sm text-muted-foreground">
          {notes.length === 0
            ? "No notes yet — add one from any topic in the planner."
            : "No notes match your search."}
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((note, index) => (
            <Link key={note.id} href={`/planner/${note.topicId}`}>
              <GlassCard
                interactive
                className="h-full"
                style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wide text-brand uppercase">
                      {note.topicSubject}
                    </p>
                    <h3 className="mt-0.5 truncate font-semibold">{note.topicTitle}</h3>
                  </div>
                  <NotebookPen className="size-4 shrink-0 text-muted-foreground" />
                </div>
                {note.contentMd ? (
                  <p className="mt-2 line-clamp-3 text-sm whitespace-pre-line text-muted-foreground">
                    {note.contentMd}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground italic">No content yet.</p>
                )}
                {note.resources.length > 0 ? (
                  <span className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <ExternalLink className="size-3" />
                    {note.resources.length} resource{note.resources.length === 1 ? "" : "s"} attached
                  </span>
                ) : null}
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
