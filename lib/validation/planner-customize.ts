import { z } from "zod";

export const customizeRequestSchema = z.object({
  prompt: z.string().trim().min(3).max(2000),
  previousSchedule: z
    .array(
      z.object({
        topicId: z.string().uuid(),
        month: z.number().int(),
        weekNumber: z.number().int(),
      })
    )
    .max(300)
    .optional(),
});

export const aiScheduleResponseSchema = z.object({
  note: z.string().max(500).optional(),
  schedule: z
    .array(
      z.object({
        topicId: z.string(),
        month: z.number().int().min(1).max(36),
        weekNumber: z.number().int().min(1).max(12),
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
