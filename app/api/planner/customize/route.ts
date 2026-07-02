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

You are given the full list of available topics as JSON, each with an "id", "subject", "title", and its default "defaultMonth"/"defaultWeek". You must ONLY use topics from this list, referenced by their exact "id" string — never invent a topic, a title, or an id that isn't in the list. If the student's request implies skipping a subject or topic, simply omit those topics from your output; you don't need to explain the omission.

Respond with JSON matching this shape: { "note": "one or two sentences summarizing what you did, e.g. which subjects you compressed, skipped, or emphasized", "schedule": [ { "topicId": "<id from the list>", "month": <integer, 1-based>, "weekNumber": <integer, 1-based, resets each new month, e.g. weeks 1-4 within month 1, weeks 1-4 within month 2, ...> } ] }.

Group topics sensibly — keep related topics from the same subject together within a week or a short run of weeks rather than scattering them randomly. Respect explicit constraints in the student's request (total number of months, subjects to skip or emphasize, pacing). If they're refining a previous draft, treat their new instruction as a change to make to that draft, not a request to start over from nothing.`;

const SCHEDULE_JSON_SCHEMA = {
  type: "object",
  properties: {
    note: { type: "string" },
    schedule: {
      type: "array",
      items: {
        type: "object",
        properties: {
          topicId: { type: "string" },
          month: { type: "integer" },
          weekNumber: { type: "integer" },
        },
        required: ["topicId", "month", "weekNumber"],
        additionalProperties: false,
      },
    },
  },
  required: ["schedule"],
  additionalProperties: false,
};

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

  const { prompt, previousSchedule } = parsed.data;

  const topics = await getAllTopics();
  const topicById = new Map(topics.map((topic) => [topic.id, topic]));

  const topicContext = topics.map((topic) => ({
    id: topic.id,
    subject: topic.subject,
    title: topic.title,
    defaultMonth: topic.month,
    defaultWeek: topic.week_number,
  }));

  let userContent = `Available topics (JSON):\n${JSON.stringify(topicContext)}\n\nStudent's request: ${prompt}`;
  if (previousSchedule && previousSchedule.length > 0) {
    userContent += `\n\nCurrent draft schedule to refine (JSON):\n${JSON.stringify(previousSchedule)}`;
  }

  let raw: string | null | undefined;
  try {
    const completion = await groq.chat.completions.create({
      model: CHAT_MODEL,
      max_completion_tokens: 8000,
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
  } catch {
    return NextResponse.json({ error: "The AI request failed. Please try again." }, { status: 502 });
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

  const validEntries = aiResult.data.schedule.filter((entry) => topicById.has(entry.topicId));

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
    const key = `${entry.month}:${entry.weekNumber}`;
    const orderIndex = (orderCounters.get(key) ?? 0) + 1;
    orderCounters.set(key, orderIndex);
    const topic = topicById.get(entry.topicId)!;
    return {
      topicId: entry.topicId,
      subject: topic.subject,
      title: topic.title,
      month: entry.month,
      weekNumber: entry.weekNumber,
      orderIndex,
    };
  });

  return NextResponse.json({ schedule, note: aiResult.data.note ?? null });
}
