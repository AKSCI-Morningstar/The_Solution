import { prisma } from "@/server/db";
import type { WorkflowStage } from "@/server/orchestrator";
import type { RealityPipelineContext } from "../../types";

/**
 * Stage 4 - reads the rule outcomes already produced by the Rule Engine
 * during the source Orchestration Run. Despite the mission's stage name
 * "Execute Rule Evaluations", the Reality Engine never re-executes rules -
 * that would risk a different outcome than what the Orchestrator recorded
 * (e.g. if the subject entity changed since the run), which would break
 * traceability back to a single, immutable source of truth. Re-reading the
 * persisted `RuleExecutionResult` rows is the deterministic, non-duplicative
 * choice.
 */
export const executeRuleEvaluationsStage: WorkflowStage<RealityPipelineContext> = {
  name: "EXECUTE_RULE_EVALUATIONS",
  execute: async (ctx) => {
    const ruleResultIds = ctx.orchestrationRuleResultIds ?? [];
    const results =
      ruleResultIds.length > 0
        ? await prisma.ruleExecutionResult.findMany({
            where: { id: { in: ruleResultIds }, organizationId: ctx.organizationId },
            select: { ruleId: true, outcome: true },
          })
        : [];

    const ruleSummary = results.map((r) => ({ ruleId: r.ruleId, outcome: r.outcome }));

    return {
      patch: { ruleSummary },
      output: { ruleCount: ruleSummary.length },
    };
  },
};
