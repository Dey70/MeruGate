import { z } from "zod";

// No "previous schedule" field: refinement is done by the client
// concatenating the original prompt + follow-up instructions into one text
// prompt and regenerating fresh, rather than sending the whole prior
// schedule back as data. Sending a ~176-entry previous schedule alongside
// the ~176-topic context routinely blew Groq's 8000 tokens/minute limit for
// this model; a growing text prompt costs a few hundred tokens at most.
export const customizeRequestSchema = z.object({
  prompt: z.string().trim().min(3).max(2000),
});

// Short keys (i/m/w, not topicIndex/month/weekNumber) because this schema
// repeats per schedule entry — up to ~176 times for a full plan — and
// gpt-oss-120b is a reasoning model that spends a meaningful, variable
// chunk of its own completion budget on hidden reasoning tokens before any
// JSON is written, so every token saved on structural overhead matters.
// Topics are referenced by index into the topic list, not UUID, for the
// same reason (a UUID costs ~12 tokens; an index costs ~1).
export const aiScheduleResponseSchema = z.object({
  note: z.string().max(500).optional(),
  schedule: z
    .array(
      z.object({
        i: z.number().int().min(0),
        m: z.number().int().min(1).max(36),
        w: z.number().int().min(1).max(12),
      })
    )
    .min(1)
    .max(300),
});

export interface PreviewScheduleEntry {
  topicId: string;
  subject: string;
  title: string;
  month: number;
  weekNumber: number;
  orderIndex: number;
}
