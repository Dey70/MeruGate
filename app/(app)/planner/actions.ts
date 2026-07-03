"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { toggleTopicSchema } from "@/lib/validation/planner";

export async function toggleTopicCompletion(topicId: string, completed: boolean) {
  const { topicId: safeTopicId, completed: safeCompleted } = toggleTopicSchema.parse({
    topicId,
    completed,
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("user_topic_progress").upsert(
    {
      user_id: user.id,
      topic_id: safeTopicId,
      completed: safeCompleted,
      completed_at: safeCompleted ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,topic_id" }
  );

  if (error) throw error;

  revalidatePath("/planner");
  revalidatePath("/subjects");
  revalidatePath("/dashboard");
  revalidatePath("/squad");
}
