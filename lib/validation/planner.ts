import { z } from "zod";

export const toggleTopicSchema = z.object({
  topicId: z.string().uuid(),
  completed: z.boolean(),
});
