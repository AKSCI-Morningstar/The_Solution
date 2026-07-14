import { z } from "zod";
import { CONTRADICTION_TYPES, CONTRADICTION_SEVERITIES, CONTRADICTION_STATUSES } from "./constants";

export const contradictionTypeSchema = z.enum(CONTRADICTION_TYPES);
export const contradictionSeveritySchema = z.enum(CONTRADICTION_SEVERITIES);
export const contradictionStatusSchema = z.enum(CONTRADICTION_STATUSES);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const contradictionFilterSchema = z.object({
  type: contradictionTypeSchema.optional(),
  severity: contradictionSeveritySchema.optional(),
  status: contradictionStatusSchema.optional(),
  entityId: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(["detectedAt", "severity", "type", "updatedAt"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  ...paginationSchema.shape,
});

export type ContradictionFilterInput = z.infer<typeof contradictionFilterSchema>;

export const detectContradictionSchema = z.object({
  entityId: z.string().min(1, "Entity ID is required"),
  maxDepth: z.coerce.number().int().min(1).max(10).default(5),
});

export type DetectContradictionInput = z.infer<typeof detectContradictionSchema>;

export const updateContradictionStatusSchema = z.object({
  status: contradictionStatusSchema,
  resolutionNotes: z.string().max(5000).optional(),
});

export type UpdateContradictionStatusInput = z.infer<typeof updateContradictionStatusSchema>;

export function validateLifecycleTransition(
  currentStatus: string,
  newStatus: string,
): string | null {
  const allowed = LIFECYCLE_TRANSITIONS_MAP[currentStatus];
  if (!allowed) return `Unknown status: ${currentStatus}`;
  if (!allowed.includes(newStatus)) {
    return `Cannot transition from ${currentStatus} to ${newStatus}`;
  }
  return null;
}

import { LIFECYCLE_TRANSITIONS } from "./constants";

const LIFECYCLE_TRANSITIONS_MAP: Record<string, string[]> = LIFECYCLE_TRANSITIONS;
