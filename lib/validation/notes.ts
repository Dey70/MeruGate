import { z } from "zod";

export const upsertNoteSchema = z.object({
  topicId: z.string().uuid(),
  contentMd: z.string().max(20000).default(""),
  notionLink: z
    .string()
    .trim()
    .max(2048)
    .optional()
    .transform((val) => (val ? val : undefined))
    .refine((val) => !val || /^https?:\/\/.+/i.test(val), {
      message: "Notion link must be a valid URL starting with http(s)://",
    }),
});
