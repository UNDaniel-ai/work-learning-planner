import { z } from "zod";

const nullableString = z.string().nullable().optional();
const nullableNumber = z.number().nullable().optional();

export const vikunjaLabelSchema = z.object({
  title: z.string()
});

export const vikunjaTaskSchema = z.object({
  id: z.number(),
  title: z.string().min(1),
  done: z.boolean(),
  description: nullableString,
  due_date: nullableString,
  done_at: nullableString,
  created: z.string(),
  updated: z.string(),
  labels: z.array(vikunjaLabelSchema).nullable().optional(),
  priority: nullableNumber,
  project_id: nullableNumber
});

export const paginatedTaskSchema = z.object({
  items: z.array(vikunjaTaskSchema),
  page: z.number().optional(),
  per_page: z.number().optional(),
  total: z.number().optional(),
  total_pages: z.number().optional()
});

export type VikunjaTask = z.infer<typeof vikunjaTaskSchema>;
