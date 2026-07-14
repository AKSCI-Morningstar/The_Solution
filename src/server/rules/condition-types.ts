import { z } from "zod";
import { ENTITY_TYPES, RELATIONSHIP_TYPES } from "@/server/engineering/constants";
import { COMPARISON_OPERATORS, RELATIONSHIP_DIRECTIONS } from "./constants";

export const fieldRefSchema = z.object({
  source: z.enum(["subject", "related"]),
  attribute: z.string().min(1),
});
export type FieldRef = z.infer<typeof fieldRefSchema>;

export const comparisonValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
export type ComparisonValue = z.infer<typeof comparisonValueSchema>;

/**
 * A deterministic, JSON-serializable condition tree - no function bodies, no
 * arbitrary code, so a future visual rule editor can read/write it directly.
 * Recursive types need an explicit interface (Zod's z.lazy requires one for
 * TypeScript to infer without a circular reference error).
 */
export interface ComparisonCondition {
  type: "comparison";
  field: FieldRef;
  operator: (typeof COMPARISON_OPERATORS)[number];
  value: ComparisonValue | ComparisonValue[];
}

export interface GroupCondition {
  type: "group";
  operator: "AND" | "OR";
  conditions: RuleCondition[];
}

export interface NotCondition {
  type: "not";
  condition: RuleCondition;
}

export interface ExistsCondition {
  type: "exists";
  field: FieldRef;
}

export interface RelationshipCheckCondition {
  type: "relationshipCheck";
  relationshipType: (typeof RELATIONSHIP_TYPES)[number];
  direction: (typeof RELATIONSHIP_DIRECTIONS)[number];
  expectedCount?: { min?: number; max?: number };
  targetEntityType?: (typeof ENTITY_TYPES)[number];
  targetCondition?: RuleCondition;
}

export interface FragmentRefCondition {
  type: "fragmentRef";
  fragmentId: string;
}

export type RuleCondition =
  | ComparisonCondition
  | GroupCondition
  | NotCondition
  | ExistsCondition
  | RelationshipCheckCondition
  | FragmentRefCondition;

export const ruleConditionSchema: z.ZodType<RuleCondition> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({
      type: z.literal("comparison"),
      field: fieldRefSchema,
      operator: z.enum(COMPARISON_OPERATORS),
      value: z.union([comparisonValueSchema, z.array(comparisonValueSchema)]),
    }),
    z.object({
      type: z.literal("group"),
      operator: z.enum(["AND", "OR"]),
      conditions: z.array(ruleConditionSchema).min(1),
    }),
    z.object({
      type: z.literal("not"),
      condition: ruleConditionSchema,
    }),
    z.object({
      type: z.literal("exists"),
      field: fieldRefSchema,
    }),
    z.object({
      type: z.literal("relationshipCheck"),
      relationshipType: z.enum(RELATIONSHIP_TYPES),
      direction: z.enum(RELATIONSHIP_DIRECTIONS),
      expectedCount: z
        .object({
          min: z.number().int().min(0).optional(),
          max: z.number().int().min(0).optional(),
        })
        .optional(),
      targetEntityType: z.enum(ENTITY_TYPES).optional(),
      targetCondition: ruleConditionSchema.optional(),
    }),
    z.object({
      type: z.literal("fragmentRef"),
      fragmentId: z.string().min(1),
    }),
  ]),
);

export const ruleScopeSchema = z.object({
  entityType: z.enum(ENTITY_TYPES),
  filter: ruleConditionSchema.optional(),
});
export type RuleScope = z.infer<typeof ruleScopeSchema>;
