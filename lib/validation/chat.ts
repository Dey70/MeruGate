import { z } from "zod";

export const chatRequestSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().trim().min(1).max(8000),
  topicId: z.string().uuid().optional(),
});
