"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { PreviewScheduleEntry } from "@/lib/validation/planner-customize";

export async function applyScheduleAction(schedule: PreviewScheduleEntry[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const entries = schedule.map((entry) => ({
    topicId: entry.topicId,
    month: entry.month,
    weekNumber: entry.weekNumber,
    orderIndex: entry.orderIndex,
  }));

  const { error } = await supabase.rpc("replace_user_schedule", { entries });
  if (error) throw error;

  revalidatePath("/planner");
  revalidatePath("/subjects");
  revalidatePath("/dashboard");
  revalidatePath("/squad");
  redirect("/planner");
}

export async function resetToDefaultAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.rpc("replace_user_schedule", { entries: [] });
  if (error) throw error;

  revalidatePath("/planner");
  revalidatePath("/subjects");
  revalidatePath("/dashboard");
  revalidatePath("/squad");
  redirect("/planner");
}
