import type { WorkflowStage } from "../../workflow-engine";
import type { AggregateResult, EngineeringAssessment, PipelineContext } from "../../types";
import type { AssessmentOutcome } from "../../constants";

/**
 * Stage 10 - pure derivation, no I/O. Fixed precedence, mirroring the Rule
 * Engine's own outcome precedence exactly so the two vocabularies stay
 * consistent:
 *   1. Missing evidence            -> INSUFFICIENT_EVIDENCE (nothing to reason over)
 *   2. Open contradictions         -> NEEDS_REVIEW (a human must resolve them)
 *   3. Any rule outcome BLOCKED    -> BLOCKED (an unmet rule dependency)
 *   4. Any rule outcome FAILED     -> FAILED
 *   5. Otherwise                   -> PASSED
 * Never invents a conclusion beyond what stages 1-9 already established.
 */
export function deriveAssessment(aggregateResult: AggregateResult): EngineeringAssessment {
  const missingEvidence: string[] = [];
  const conflictingEvidence: EngineeringAssessment["conflictingEvidence"] = [];

  let outcome: AssessmentOutcome;
  let reasoning: string;

  if (aggregateResult.missingEvidenceCount > 0) {
    outcome = "INSUFFICIENT_EVIDENCE";
    reasoning = `${aggregateResult.missingEvidenceCount} required evidence item(s) are missing; a deterministic assessment cannot be produced.`;
  } else if (aggregateResult.openContradictionCount > 0) {
    outcome = "NEEDS_REVIEW";
    reasoning = `${aggregateResult.openContradictionCount} unresolved contradiction(s) affect this subject; human review is required before the assessment can be finalized.`;
  } else if ((aggregateResult.ruleOutcomeCounts.BLOCKED ?? 0) > 0) {
    outcome = "BLOCKED";
    reasoning = `${aggregateResult.ruleOutcomeCounts.BLOCKED} rule(s) evaluated to BLOCKED due to an unmet dependency.`;
  } else if (aggregateResult.hasFailedRule) {
    outcome = "FAILED";
    reasoning = `${aggregateResult.ruleOutcomeCounts.FAILED} rule(s) evaluated to FAILED.`;
  } else {
    outcome = "PASSED";
    reasoning = "All executed rules passed, no open contradictions, and no missing evidence.";
  }

  return { outcome, reasoning, missingEvidence, conflictingEvidence };
}

export const produceAssessmentStage: WorkflowStage<PipelineContext> = {
  name: "PRODUCE_ASSESSMENT",
  execute: async (ctx) => {
    const aggregateResult = ctx.aggregate;
    if (!aggregateResult) {
      throw new Error("PRODUCE_ASSESSMENT requires AGGREGATE_RESULTS to have run first");
    }

    const assessment = deriveAssessment(aggregateResult);
    assessment.missingEvidence = ctx.missingEvidence ?? [];
    assessment.conflictingEvidence = ctx.conflictingEvidence ?? [];

    return {
      patch: { assessment },
      output: { outcome: assessment.outcome },
    };
  },
};
