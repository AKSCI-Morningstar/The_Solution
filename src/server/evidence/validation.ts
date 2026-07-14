import { z } from "zod";

export const evaluationInputSchema = z.object({
  entityId: z.string().min(1, "Entity ID is required"),
  relationshipTypes: z.array(z.string()).optional(),
  maxDepth: z.coerce.number().int().min(1).max(10).default(5),
});

export type EvaluationInput = z.infer<typeof evaluationInputSchema>;

export const traceabilityFilterSchema = z.object({
  entityId: z.string().min(1, "Entity ID is required"),
  maxDepth: z.coerce.number().int().min(1).max(10).default(5),
  ...z.object({ page: z.coerce.number().int().min(1).max(100).optional() }).shape,
});

export type TraceabilityFilterInput = z.infer<typeof traceabilityFilterSchema>;

export const conflictFilterSchema = z.object({
  entityId: z.string().optional(),
  type: z.string().optional(),
  severity: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
});

export type ConflictFilterInput = z.infer<typeof conflictFilterSchema>;

export const missingEvidenceFilterSchema = z.object({
  entityId: z.string().optional(),
  type: z.string().optional(),
  severity: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
});

export type MissingEvidenceFilterInput = z.infer<typeof missingEvidenceFilterSchema>;
