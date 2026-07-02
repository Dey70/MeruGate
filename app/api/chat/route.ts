import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { anthropic, CHAT_MAX_TOKENS, CHAT_MODEL } from "@/lib/anthropic/client";
import { SYSTEM_PROMPT } from "@/lib/anthropic/system-prompt";
import { chatRequestSchema } from "@/lib/validation/chat";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = chatRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { sessionId, message, topicId } = parsed.data;

  const { data: historyRows, error: historyError } = await supabase
    .from("chat_history")
    .select("role, content")
    .eq("user_id", user.id)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(20);

  if (historyError) {
    return NextResponse.json({ error: historyError.message }, { status: 500 });
  }

  const isFirstMessage = (historyRows?.length ?? 0) === 0;

  let contentForModel = message;
  if (isFirstMessage && topicId) {
    const { data: topic } = await supabase
      .from("topics")
      .select("title, subject")
      .eq("id", topicId)
      .maybeSingle();

    if (topic) {
      contentForModel = `[Context: I'm currently studying "${topic.title}" (${topic.subject}).]\n\n${message}`;
    }
  }

  const { error: insertUserError } = await supabase.from("chat_history").insert({
    user_id: user.id,
    session_id: sessionId,
    role: "user",
    content: message,
    topic_id: topicId ?? null,
  });

  if (insertUserError) {
    return NextResponse.json({ error: insertUserError.message }, { status: 500 });
  }

  const modelMessages = [
    ...(historyRows ?? []).map((row) => ({
      role: row.role as "user" | "assistant",
      content: row.content,
    })),
    { role: "user" as const, content: contentForModel },
  ];

  const encoder = new TextEncoder();
  let fullText = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const anthropicStream = anthropic.messages.stream({
          model: CHAT_MODEL,
          max_tokens: CHAT_MAX_TOKENS,
          system: SYSTEM_PROMPT,
          messages: modelMessages,
        });

        anthropicStream.on("text", (delta) => {
          fullText += delta;
          controller.enqueue(encoder.encode(delta));
        });

        await anthropicStream.finalMessage();
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong.";
        controller.enqueue(encoder.encode(`\n\n[Error: ${message}]`));
        controller.close();
      }

      if (fullText.trim().length > 0) {
        await supabase.from("chat_history").insert({
          user_id: user.id,
          session_id: sessionId,
          role: "assistant",
          content: fullText,
          topic_id: topicId ?? null,
        });
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
