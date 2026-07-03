import { createClient } from "@/lib/supabase/server";
import type { ResourceLink } from "@/lib/validation/notes";

export interface NoteRow {
  id: string;
  topicId: string;
  contentMd: string;
  resources: ResourceLink[];
  updatedAt: string;
}

export async function getNoteForTopic(userId: string, topicId: string): Promise<NoteRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select("id, topic_id, content_md, resources, updated_at")
    .eq("user_id", userId)
    .eq("topic_id", topicId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    topicId: data.topic_id,
    contentMd: data.content_md,
    resources: (data.resources as ResourceLink[] | null) ?? [],
    updatedAt: data.updated_at,
  };
}

export interface NoteWithTopic extends NoteRow {
  topicTitle: string;
  topicSubject: string;
}

export async function getAllUserNotes(userId: string): Promise<NoteWithTopic[]> {
  const supabase = await createClient();
  const { data: notes, error } = await supabase
    .from("notes")
    .select("id, topic_id, content_md, resources, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  if (!notes || notes.length === 0) return [];

  const topicIds = notes.map((n) => n.topic_id);
  const { data: topics, error: topicsError } = await supabase
    .from("topics")
    .select("id, title, subject_id")
    .in("id", topicIds);

  if (topicsError) throw topicsError;

  const subjectIds = Array.from(new Set((topics ?? []).map((t) => t.subject_id)));
  const { data: subjects, error: subjectsError } = await supabase
    .from("subjects")
    .select("id, name")
    .in("id", subjectIds);

  if (subjectsError) throw subjectsError;

  const subjectNameMap = new Map((subjects ?? []).map((s) => [s.id, s.name]));
  const topicMap = new Map((topics ?? []).map((t) => [t.id, t]));

  return notes.map((note) => {
    const topic = topicMap.get(note.topic_id);
    return {
      id: note.id,
      topicId: note.topic_id,
      contentMd: note.content_md,
      resources: (note.resources as ResourceLink[] | null) ?? [],
      updatedAt: note.updated_at,
      topicTitle: topic?.title ?? "Untitled topic",
      topicSubject: topic ? (subjectNameMap.get(topic.subject_id) ?? "") : "",
    };
  });
}
