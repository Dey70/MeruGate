import { z } from "zod";

export const joinSquadSchema = z.object({
  code: z.string().trim().min(4).max(64),
});

export const createSquadSchema = z.object({
  name: z.string().trim().min(2).max(60),
});
