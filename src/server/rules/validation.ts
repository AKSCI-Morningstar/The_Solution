import { z } from "zod";
import { paginationSchema } from "@/shared/validation/schemas";
import { RULE_OUTCOMES, RULE_SEVERITIES, RULE_STATUSES } from "./constants";
import { ruleConditionSchema, ruleScopeSchema } from "./condition-types";

export const createRuleSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  category: z.string().min(1).max(100),
  priority: z.number().int().min(0).max(1000).default(0),
  severity: z.enum(RULE_SEVERITIES).default("WARNING"),
  tags: z.array(z.string().max(50)).max(20).optional(),
  labels: z.record(z.string(), z.string()).optional(),
  ownerId: z.string().optional(),
  scope: ruleScopeSchema,
  conditionRoot: ruleConditionSchema,
  dependsOnRuleIds: z.array(z.string()).max(50).optional(),
});
export type CreateRuleInput = z.infer<typeof createRuleSchema>;

export const updateRuleSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  category: z.string().min(1).max(100).optional(),
  priority: z.number().int().min(0).max(1000).optional(),
  severity: z.enum(RULE_SEVERITIES).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  labels: z.record(z.string(), z.string()).optional(),
  ownerId: z.string().optional(),
  scope: ruleScopeSchema.optional(),
  conditionRoot: ruleConditionSchema.optional(),
  dependsOnRuleIds: z.array(z.string()).max(50).optional(),
  changeDescription: z.string().max(1000).optional(),
});
export type UpdateRuleInput = z.infer<typeof updateRuleSchema>;

export const ruleFilterSchema = paginationSchema.extend({
  status: z.enum(RULE_STATUSES).optional(),
  category: z.string().optional(),
  severity: z.enum(RULE_SEVERITIES).optional(),
  search: z.string().optional(),
  tag: z.string().optional(),
});
export type RuleFilterInput = z.infer<typeof ruleFilterSchema>;

export const executeRuleSchema = z.object({
  subjectEntityId: z.string().optional(),
  force: z.coerce.boolean().default(false),
});
export type ExecuteRuleInput = z.infer<typeof executeRuleSchema>;

export const executeBatchSchema = z.object({
  ruleIds: z.array(z.string().min(1)).min(1).max(500),
  force: z.coerce.boolean().default(false),
});
export type ExecuteBatchInput = z.infer<typeof executeBatchSchema>;

export const ruleResultsFilterSchema = paginationSchema.extend({
  outcome: z.enum(RULE_OUTCOMES).optional(),
  batchId: z.string().optional(),
});
export type RuleResultsFilterInput = z.infer<typeof ruleResultsFilterSchema>;

export const createFragmentSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  condition: ruleConditionSchema,
});
export type CreateFragmentInput = z.infer<typeof createFragmentSchema>;

export const fragmentFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
});
export type FragmentFilterInput = z.infer<typeof fragmentFilterSchema>;
