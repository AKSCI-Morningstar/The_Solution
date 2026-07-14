import { executeRule, listRules } from "@/server/rules";
import type { WorkflowStage } from "../../workflow-engine";
import type { PipelineContext } from "../../types";

/**
 * Stage 6 - evaluates the subject entity against either the explicitly
 * requested rule ids, or (if none were requested) every ACTIVE rule whose
 * scope matches the subject's entity type. Each rule is evaluated with
 * `executeRule()` scoped to just this subject entity - the Orchestrator
 * never calls `executeBatch()`, which evaluates a rule against its entire
 * scoped population rather than one specific subject.
 */
export const executeRuleEngineStage: WorkflowStage<PipelineContext> = {
  name: "EXECUTE_RULE_ENGINE",
  execute: async (ctx) => {
    const entityType = ctx.subjectEntity?.entityType;

    let ruleIds = ctx.requestedRuleIds ?? [];
    if (ruleIds.length === 0 && entityType) {
      const active = await listRules(ctx.organizationId, {
        status: "ACTIVE",
        page: 1,
        pageSize: 100,
      });
      ruleIds = active.data
        .filter((rule) => (rule.scope as { entityType?: string }).entityType === entityType)
        .map((rule) => rule.id);
    }

    const outcomes = await Promise.all(
      ruleIds.map(async (ruleId) => {
        const results = await executeRule(ruleId, ctx.organizationId, {
          subjectEntityId: ctx.subjectEntityId,
          triggeredById: ctx.triggeredById,
        });
        return results[0];
      }),
    );

    const ruleResults = outcomes
      .filter((outcome): outcome is NonNullable<typeof outcome> => outcome !== undefined)
      .map((outcome) => ({
        ruleId: outcome.ruleId,
        outcome: outcome.outcome,
        resultId: outcome.id,
      }));

    return {
      patch: { ruleIdsEvaluated: ruleIds, ruleResults },
      output: { ruleCount: ruleIds.length, outcomes: ruleResults.map((r) => r.outcome) },
    };
  },
};
