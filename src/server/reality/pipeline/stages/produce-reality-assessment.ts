import type { WorkflowStage } from "@/server/orchestrator";
import type { RealityAssessmentResult, RealityPipelineContext } from "../../types";
import type { RealityOutcome } from "../../constants";

/**
 * Stage 8 - pure derivation, no I/O. Fixed precedence:
 *   1. Missing evidence (or the source run itself was INSUFFICIENT_EVIDENCE) -> INSUFFICIENT_EVIDENCE
 *   2. Ingestion incomplete (pending or failed jobs for in-scope documents)  -> INCOMPLETE
 *   3. Any contradiction still open as of right now                        -> CONTRADICTED
 *   4. Source run NEEDS_REVIEW/BLOCKED, or any current rule outcome is      -> NEEDS_REVIEW
 *      NEEDS_REVIEW/BLOCKED
 *   5. Source run FAILED                                                   -> NEEDS_REVIEW
 *   6. Source run PASSED but conflicting evidence was recorded             -> CONDITIONALLY_VERIFIED
 *   7. Otherwise (PASSED, no open contradictions, ingestion complete,      -> VERIFIED
 *      no conflicting evidence)
 * Never invents a conclusion beyond what stages 1-7 already established.
 */
export function deriveRealityAssessment(ctx: RealityPipelineContext): RealityAssessmentResult {
  const evidence = ctx.evidenceSummary;
  const ingestion = ctx.ingestionCompleteness;
  const openContradictionCount = ctx.openContradictionCount ?? 0;
  const ruleOutcomes = new Set((ctx.ruleSummary ?? []).map((r) => r.outcome));

  let outcome: RealityOutcome;
  let reasoning: string;

  if (
    (evidence?.missingEvidenceCount ?? 0) > 0 ||
    ctx.orchestrationOutcome === "INSUFFICIENT_EVIDENCE"
  ) {
    outcome = "INSUFFICIENT_EVIDENCE";
    reasoning = "Required evidence is missing; engineering reality cannot be established.";
  } else if (ingestion && !ingestion.allComplete) {
    outcome = "INCOMPLETE";
    reasoning = `${ingestion.pendingJobCount} pending and ${ingestion.failedJobCount} failed ingestion job(s) affect the evidence base for this entity.`;
  } else if (openContradictionCount > 0) {
    outcome = "CONTRADICTED";
    reasoning = `${openContradictionCount} contradiction(s) remain open as of this assessment.`;
  } else if (
    ctx.orchestrationOutcome === "NEEDS_REVIEW" ||
    ctx.orchestrationOutcome === "BLOCKED" ||
    ruleOutcomes.has("NEEDS_REVIEW") ||
    ruleOutcomes.has("BLOCKED")
  ) {
    outcome = "NEEDS_REVIEW";
    reasoning = "The source orchestration run or a re-read rule outcome requires human review.";
  } else if (ctx.orchestrationOutcome === "FAILED") {
    outcome = "NEEDS_REVIEW";
    reasoning =
      "The source orchestration run recorded a failed rule; review is required before reality can be confirmed.";
  } else if ((evidence?.conflictingEvidenceCount ?? 0) > 0) {
    outcome = "CONDITIONALLY_VERIFIED";
    reasoning =
      "All rules passed and no contradictions are open, but conflicting evidence was recorded for this entity.";
  } else {
    outcome = "VERIFIED";
    reasoning =
      "All rules passed, no contradictions are open, ingestion is complete, and no conflicting evidence was recorded.";
  }

  return { outcome, reasoning };
}

export const produceRealityAssessmentStage: WorkflowStage<RealityPipelineContext> = {
  name: "PRODUCE_REALITY_ASSESSMENT",
  execute: async (ctx) => {
    const assessment = deriveRealityAssessment(ctx);
    return {
      patch: { assessment },
      output: { outcome: assessment.outcome },
    };
  },
};
