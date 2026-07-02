import { z } from "zod";

export const upsertGoalSchema = z.object({
  periodType: z.enum(["weekly", "monthly"]),
  targetTopicCount: z.coerce.number().int().min(1).max(500),
  subject: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((val) => val ?? ""),
});
