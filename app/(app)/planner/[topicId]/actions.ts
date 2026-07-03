"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { upsertNoteSchema } from "@/lib/validation/notes";

export interface NoteActionState {
  error?: string;
  savedAt?: number;
}

export async function upsertNoteAction(
  _prevState: NoteActionState,
  formData: FormData
): Promise<NoteActionState> {
  let resources: unknown = [];
  try {
    resources = JSON.parse((formData.get("resourcesJson") as string | null) ?? "[]");
  } catch {
    return { error: "Invalid resource list." };
  }

  const parsed = upsertNoteSchema.safeParse({
    topicId: formData.get("topicId"),
    contentMd: formData.get("contentMd") ?? "",
    resources,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid note." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.from("notes").upsert(
    {
      user_id: user.id,
      topic_id: parsed.data.topicId,
      content_md: parsed.data.contentMd,
      resources: parsed.data.resources,
    },
    { onConflict: "user_id,topic_id" }
  );

  if (error) return { error: error.message };

  revalidatePath(`/planner/${parsed.data.topicId}`);
  revalidatePath("/notes");
  return { savedAt: Date.now() };
}
