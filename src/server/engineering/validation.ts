import { z } from "zod";
import {
  ENTITY_TYPES,
  ENTITY_STATUSES,
  RELATIONSHIP_TYPES,
  LIFECYCLE_TRANSITIONS,
} from "./constants";

export const entityTypeSchema = z.enum(ENTITY_TYPES as unknown as [string, ...string[]]);
export const entityStatusSchema = z.enum(ENTITY_STATUSES as unknown as [string, ...string[]]);
export const relationshipTypeSchema = z.enum(
  RELATIONSHIP_TYPES as unknown as [string, ...string[]],
);

export const identifierSchema = z
  .string()
  .min(1, "Identifier is required")
  .max(100)
  .regex(/^[A-Z0-9_-]+$/, "Identifier must be uppercase alphanumeric with hyphens or underscores");

export const tagsSchema = z.array(z.string().max(50)).max(20).optional();
export const labelsSchema = z.record(z.string(), z.string()).optional();
export const metadataSchema = z.record(z.string(), z.unknown()).optional();

export const createEntitySchema = z.object({
  entityType: entityTypeSchema,
  identifier: identifierSchema,
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(5000).optional(),
  status: entityStatusSchema.default("DRAFT"),
  tags: tagsSchema,
  labels: labelsSchema,
  metadata: metadataSchema,
});

export const updateEntitySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  tags: tagsSchema,
  labels: labelsSchema,
  metadata: metadataSchema,
});

export const changeEntityStatusSchema = z.object({
  status: entityStatusSchema,
  reason: z.string().max(1000).optional(),
});

export const createRelationshipSchema = z.object({
  sourceEntityId: z.string().min(1),
  targetEntityId: z.string().min(1),
  relationshipType: relationshipTypeSchema,
  metadata: metadataSchema,
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const entityFilterSchema = z.object({
  entityType: entityTypeSchema.optional(),
  status: entityStatusSchema.optional(),
  search: z.string().optional(),
  ...paginationSchema.shape,
});

export const relationshipFilterSchema = z.object({
  sourceEntityId: z.string().optional(),
  targetEntityId: z.string().optional(),
  relationshipType: relationshipTypeSchema.optional(),
  ...paginationSchema.shape,
});

export function validateLifecycleTransition(
  currentStatus: string,
  newStatus: string,
): string | null {
  const allowed = LIFECYCLE_TRANSITIONS[currentStatus];
  if (!allowed) return `Unknown status: ${currentStatus}`;
  if (!allowed.includes(newStatus)) {
    return `Cannot transition from ${currentStatus} to ${newStatus}`;
  }
  return null;
}

export type CreateEntityInput = z.infer<typeof createEntitySchema>;
export type UpdateEntityInput = z.infer<typeof updateEntitySchema>;
export type ChangeEntityStatusInput = z.infer<typeof changeEntityStatusSchema>;
export type CreateRelationshipInput = z.infer<typeof createRelationshipSchema>;
export type EntityFilterInput = z.infer<typeof entityFilterSchema>;
export type RelationshipFilterInput = z.infer<typeof relationshipFilterSchema>;
