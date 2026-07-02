import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { groq, CHAT_MODEL } from "@/lib/groq/client";
import { getAllTopics } from "@/lib/queries/planner";
import {
  aiScheduleResponseSchema,
  customizeRequestSchema,
  type PreviewScheduleEntry,
} from "@/lib/validation/planner-customize";

const SYSTEM_PROMPT = `You build a personalized month/week study schedule for a GATE CSE student.

You are given the full list of available topics as JSON, each shortened to keys "i" (index), "s" (subject), "t" (title). You must ONLY use topics from this list, referenced by their exact "i" number — never invent a topic, a title, or an index that isn't in the list.

COMPLETENESS IS MANDATORY: every single topic belonging to a subject the student is keeping must appear in your output. Do not sample a handful of "highlights" from a subject — if you keep a subject, include ALL of its topics from the list, each assigned to some month/week. Only omit a topic if the student explicitly asked to skip that subject or topic entirely, or explicitly asked to drop specific topics. A schedule that only includes a fraction of the topics from a kept subject is wrong. Weeks in the source list typically hold 3-5 topics each — match that density; do not compress a subject down to one topic per week unless the student asked for a much shorter timeline than the subject needs.

Respond with JSON matching this shape: { "note": "one or two sentences summarizing what you did", "schedule": [ { "i": <integer index from the list>, "m": <integer month, 1-based>, "w": <integer week, 1-based, resets each new month> } ] }. The schedule array must contain one entry per topic you are keeping — for a student keeping most subjects, that means most of the ~176 available topics.

Group topics sensibly — keep related topics from the same subject together within a week or a short run of weeks rather than scattering them randomly. The student's request may contain multiple instructions accumulated over a conversation (an original request plus follow-up refinements) — satisfy ALL of them together as one coherent final plan. Be economical in your reasoning, but the schedule array itself must be complete — do not truncate or sample it.`;

const SCHEDULE_JSON_SCHEMA = {
  type: "object",
  properties: {
    note: { type: "string" },
    schedule: {
      type: "array",
      items: {
        type: "object",
        properties: {
          i: { type: "integer" },
          m: { type: "integer" },
          w: { type: "integer" },
        },
        required: ["i", "m", "w"],
        additionalProperties: false,
      },
    },
  },
  required: ["schedule"],
  additionalProperties: false,
};

// Empirically tuned against Groq's 8000 tokens/minute limit for
// openai/gpt-oss-120b: 176 topics as {i,s,t} context is ~4000 prompt
// tokens; this leaves room for the model's own (variable, low-effort)
// reasoning plus a full ~176-entry response without hitting the ceiling.
const MAX_COMPLETION_TOKENS = 3900;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = customizeRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { prompt } = parsed.data;

  const topics = await getAllTopics();
  const topicContext = topics.map((topic, index) => ({
    i: index,
    s: topic.subject,
    t: topic.title,
  }));

  const userContent = `Available topics (JSON):\n${JSON.stringify(topicContext)}\n\nStudent's request: ${prompt}`;

  let raw: string | null | undefined;
  try {
    const completion = await groq.chat.completions.create({
      model: CHAT_MODEL,
      max_completion_tokens: MAX_COMPLETION_TOKENS,
      reasoning_effort: "low",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "study_plan", strict: false, schema: SCHEDULE_JSON_SCHEMA },
      },
    });
    raw = completion.choices[0]?.message?.content;
  } catch (err) {
    const isRateLimited = err instanceof Error && /rate.?limit/i.test(err.message);
    return NextResponse.json(
      {
        error: isRateLimited
          ? "The AI is rate-limited right now — wait about a minute and try again."
          : "The AI request failed. Please try again.",
      },
      { status: 502 }
    );
  }

  if (!raw) {
    return NextResponse.json(
      { error: "The AI didn't return a plan. Try rephrasing your request." },
      { status: 502 }
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "The AI returned an unreadable plan. Please try again." },
      { status: 502 }
    );
  }

  const aiResult = aiScheduleResponseSchema.safeParse(parsedJson);
  if (!aiResult.success) {
    return NextResponse.json(
      { error: "The AI returned a plan in an unexpected shape. Please try again." },
      { status: 502 }
    );
  }

  const validEntries = aiResult.data.schedule.filter(
    (entry) => entry.i >= 0 && entry.i < topics.length
  );

  if (validEntries.length === 0) {
    return NextResponse.json(
      { error: "The AI didn't return any recognizable topics. Try rephrasing your request." },
      { status: 502 }
    );
  }
  if (validEntries.length < aiResult.data.schedule.length * 0.7) {
    return NextResponse.json(
      { error: "The AI returned too many unrecognized topics. Please try again." },
      { status: 502 }
    );
  }

  const orderCounters = new Map<string, number>();
  const schedule: PreviewScheduleEntry[] = validEntries.map((entry) => {
    const key = `${entry.m}:${entry.w}`;
    const orderIndex = (orderCounters.get(key) ?? 0) + 1;
    orderCounters.set(key, orderIndex);
    const topic = topics[entry.i];
    return {
      topicId: topic.id,
      subject: topic.subject,
      title: topic.title,
      month: entry.m,
      weekNumber: entry.w,
      orderIndex,
    };
  });

  return NextResponse.json({ schedule, note: aiResult.data.note ?? null });
}
