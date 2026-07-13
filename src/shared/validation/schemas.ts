import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const dateRangeSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
});

export const searchSchema = z.object({
  query: z.string().min(1).max(500),
  filters: z.record(z.unknown()).optional(),
});

export const idSchema = z.string().min(1, "ID is required");

export type PaginationInput = z.infer<typeof paginationSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
