"use client";

import { useActionState } from "react";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSquadAction, type SquadActionState } from "@/app/(app)/squad/actions";

const initialState: SquadActionState = {};

export function CreateSquadForm() {
  const [state, formAction, isPending] = useActionState(createSquadAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Squad name</Label>
        <Input id="name" name="name" placeholder="GATE CSE Squad" required autoComplete="off" />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" variant="outline" disabled={isPending} className="h-10">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Create a new squad
      </Button>
    </form>
  );
}
