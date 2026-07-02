import { createClient } from "@/lib/supabase/server";

export interface NoteRow {
  id: string;
  topicId: string;
  contentMd: string;
  notionLink: string | null;
  updatedAt: string;
}

export async function getNoteForTopic(userId: string, topicId: string): Promise<NoteRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select("id, topic_id, content_md, notion_link, updated_at")
    .eq("user_id", userId)
    .eq("topic_id", topicId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    topicId: data.topic_id,
    contentMd: data.content_md,
    notionLink: data.notion_link,
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
    .select("id, topic_id, content_md, notion_link, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  if (!notes || notes.length === 0) return [];

  const topicIds = notes.map((n) => n.topic_id);
  const { data: topics, error: topicsError } = await supabase
    .from("topics")
    .select("id, title, subject")
    .in("id", topicIds);

  if (topicsError) throw topicsError;

  const topicMap = new Map((topics ?? []).map((t) => [t.id, t]));

  return notes.map((note) => {
    const topic = topicMap.get(note.topic_id);
    return {
      id: note.id,
      topicId: note.topic_id,
      contentMd: note.content_md,
      notionLink: note.notion_link,
      updatedAt: note.updated_at,
      topicTitle: topic?.title ?? "Untitled topic",
      topicSubject: topic?.subject ?? "",
    };
  });
}
