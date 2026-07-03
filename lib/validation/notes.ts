import { z } from "zod";

export const resourceTypeEnum = z.enum(["youtube", "article", "pdf", "practice", "other"]);

export const resourceLinkSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1).max(100),
  url: z
    .string()
    .trim()
    .max(2048)
    .refine((val) => /^https?:\/\/.+/i.test(val), {
      message: "Resource links must be a valid URL starting with http(s)://",
    }),
  type: resourceTypeEnum,
});

export type ResourceType = z.infer<typeof resourceTypeEnum>;
export type ResourceLink = z.infer<typeof resourceLinkSchema>;

export const upsertNoteSchema = z.object({
  topicId: z.string().uuid(),
  contentMd: z.string().max(20000).default(""),
  resources: z.array(resourceLinkSchema).max(20).default([]),
});
