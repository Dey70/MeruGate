"use server";

import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createSquadSchema, joinSquadSchema } from "@/lib/validation/squad";

export interface SquadActionState {
  error?: string;
}

export async function joinSquadAction(
  _prevState: SquadActionState,
  formData: FormData
): Promise<SquadActionState> {
  const parsed = joinSquadSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) {
    return { error: "Enter a valid invite code." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("redeem_invite", { invite_code: parsed.data.code });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/squad");
  revalidatePath("/dashboard");
  return {};
}

export async function createSquadAction(
  _prevState: SquadActionState,
  formData: FormData
): Promise<SquadActionState> {
  const parsed = createSquadSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: "Give your squad a name (2-60 characters)." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_squad", { squad_name: parsed.data.name });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/squad");
  revalidatePath("/dashboard");
  return {};
}

export async function createInviteAction(squadId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const code = nanoid(10);
  const { error } = await supabase
    .from("squad_invites")
    .insert({ squad_id: squadId, code, created_by: user.id });

  if (error) throw error;

  revalidatePath("/squad");
}
