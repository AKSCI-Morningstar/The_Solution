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

/** Query-string schema for GET /api/search */
export const searchQuerySchema = z.object({
  q: z.string().trim().max(500).default(""),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  type: z.enum(["entity", "document", "organization", "user"]).optional(),
});

export const idSchema = z.string().min(1, "ID is required");

export type PaginationInput = z.infer<typeof paginationSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
