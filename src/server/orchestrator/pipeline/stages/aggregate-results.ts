import type { WorkflowStage } from "../../workflow-engine";
import type { AggregateResult, PipelineContext } from "../../types";

/**
 * Stage 9 - pure aggregation, no I/O. Combines stages 5-8's already-fetched
 * outputs into one summary the final stage derives its outcome from. Kept
 * side-effect-free and separate from stage 10 so both the tally and the
 * outcome-derivation rule can be unit-tested in isolation from the pipeline.
 */
export function aggregate(ctx: PipelineContext): AggregateResult {
  const ruleOutcomeCounts: Record<string, number> = {};
  for (const result of ctx.ruleResults ?? []) {
    ruleOutcomeCounts[result.outcome] = (ruleOutcomeCounts[result.outcome] ?? 0) + 1;
  }

  const hasFailedRule = (ruleOutcomeCounts.FAILED ?? 0) > 0;
  const hasUnpassedRule = Object.entries(ruleOutcomeCounts).some(
    ([outcome, count]) => outcome !== "PASSED" && count > 0,
  );

  return {
    missingEvidenceCount: ctx.missingEvidence?.length ?? 0,
    conflictingEvidenceCount: ctx.conflictingEvidence?.length ?? 0,
    ruleOutcomeCounts,
    hasUnpassedRule,
    hasFailedRule,
    openContradictionCount: ctx.contradictionCount ?? 0,
    traceabilityRecordCount: ctx.traceabilityRecordCount ?? 0,
  };
}

export const aggregateResultsStage: WorkflowStage<PipelineContext> = {
  name: "AGGREGATE_RESULTS",
  execute: async (ctx) => {
    const aggregateResult = aggregate(ctx);
    return {
      patch: { aggregate: aggregateResult },
      output: { ...aggregateResult },
    };
  },
};
