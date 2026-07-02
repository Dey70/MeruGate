"use client";

import { useActionState } from "react";
import { Loader2, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { joinSquadAction, type SquadActionState } from "@/app/(app)/squad/actions";

const initialState: SquadActionState = {};

export function JoinSquadForm() {
  const [state, formAction, isPending] = useActionState(joinSquadAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="code">Invite code</Label>
        <Input id="code" name="code" placeholder="MEERUGATE2026" required autoComplete="off" />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" variant="accent" disabled={isPending} className="h-10">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
        Join squad
      </Button>
    </form>
  );
}
