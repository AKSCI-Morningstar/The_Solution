import { z } from "zod";
import { paginationSchema } from "@/shared/validation/schemas";
import { EXPORT_FORMATS, REPORT_TYPES } from "./constants";

export const reportFiltersSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  entityType: z.string().optional(),
  search: z.string().max(500).optional(),
});
export type ReportFiltersInput = z.infer<typeof reportFiltersSchema>;

export const generateReportSchema = z.object({
  type: z.enum(REPORT_TYPES),
  title: z.string().min(1).max(200).optional(),
  filters: reportFiltersSchema.optional().default({}),
});
export type GenerateReportInput = z.infer<typeof generateReportSchema>;

export const reportListFilterSchema = paginationSchema.extend({
  type: z.enum(REPORT_TYPES).optional(),
  isFavorite: z.coerce.boolean().optional(),
  search: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  sortBy: z.enum(["createdAt", "title", "type"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
export type ReportListFilterInput = z.infer<typeof reportListFilterSchema>;

export const analyticsFilterSchema = z.object({
  trendWindowDays: z.coerce.number().int().min(7).max(365).default(30),
});
export type AnalyticsFilterInput = z.infer<typeof analyticsFilterSchema>;

export const exportFormatSchema = z.object({
  format: z.enum(EXPORT_FORMATS).default("JSON"),
});
export type ExportFormatInput = z.infer<typeof exportFormatSchema>;
