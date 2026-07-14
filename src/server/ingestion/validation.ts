import { z } from "zod";
import { paginationSchema } from "@/shared/validation/schemas";
import { JOB_STATUSES, MAX_UPLOAD_FILENAME_LENGTH, SUPPORTED_EXTENSIONS } from "./constants";

export const fileNameSchema = z
  .string()
  .min(1, "File name is required")
  .max(
    MAX_UPLOAD_FILENAME_LENGTH,
    `File name must be at most ${MAX_UPLOAD_FILENAME_LENGTH} characters`,
  );

export const supportedExtensionSchema = z.enum(SUPPORTED_EXTENSIONS);

export const startJobSchema = z.object({
  documentId: z.string().min(1),
  documentVersionId: z.string().min(1).optional(),
  priority: z.coerce.number().int().min(0).max(100).default(0),
  scheduledAt: z.coerce.date().optional(),
});

export const jobFilterSchema = paginationSchema.extend({
  status: z.enum(JOB_STATUSES).optional(),
  documentId: z.string().optional(),
});

export const documentFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
});

export const jobResultsFilterSchema = paginationSchema;

export type StartJobInput = z.infer<typeof startJobSchema>;
export type JobFilterInput = z.infer<typeof jobFilterSchema>;
export type DocumentFilterInput = z.infer<typeof documentFilterSchema>;
