"use client";

import { useState, useTransition } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createInviteAction } from "@/app/(app)/squad/actions";

export function InviteCodeCard({ squadId, code }: { squadId: string; code: string | null }) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleCopy() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="glass-surface-strong shadow-glass-sm flex flex-wrap items-center justify-between gap-3 rounded-glass-sm px-4 py-3">
      <div>
        <p className="text-xs font-medium text-muted-foreground">Invite code</p>
        <p className="font-mono text-lg font-semibold tracking-wide">{code ?? "—"}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleCopy} disabled={!code}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => startTransition(() => createInviteAction(squadId))}
        >
          <RefreshCw className={isPending ? "size-4 animate-spin" : "size-4"} />
          New code
        </Button>
      </div>
    </div>
  );
}
