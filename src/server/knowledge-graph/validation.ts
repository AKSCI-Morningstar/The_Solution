import { z } from "zod";
import { paginationSchema } from "@/shared/validation/schemas";

export const nodesQuerySchema = paginationSchema.extend({
  entityType: z.string().optional(),
  search: z.string().optional(),
});

export const edgesQuerySchema = paginationSchema.extend({
  relationshipType: z.string().optional(),
  sourceNodeId: z.string().optional(),
  targetNodeId: z.string().optional(),
});

export const subgraphQuerySchema = z.object({
  entityType: z.string().optional(),
  limit: z.coerce.number().int().positive().max(500).default(100),
});

export const expandSubgraphSchema = z.object({
  nodeIds: z.array(z.string().min(1)).min(1).max(200),
  depth: z.coerce.number().int().min(1).max(5).default(1),
});

export const nodePositionSchema = z.object({
  nodeIndexId: z.string().min(1),
  x: z.number(),
  y: z.number(),
});

export const saveLayoutSchema = z.object({
  name: z.string().min(1).max(200),
  nodePositions: z.array(nodePositionSchema).min(1).max(2000),
});

export type NodesQuery = z.infer<typeof nodesQuerySchema>;
export type EdgesQuery = z.infer<typeof edgesQuerySchema>;
export type SubgraphQuery = z.infer<typeof subgraphQuerySchema>;
export type ExpandSubgraphInput = z.infer<typeof expandSubgraphSchema>;
export type SaveLayoutInput = z.infer<typeof saveLayoutSchema>;
