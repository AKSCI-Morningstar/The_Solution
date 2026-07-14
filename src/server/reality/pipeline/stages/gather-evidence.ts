import type { WorkflowStage } from "@/server/orchestrator";
import type { RealityPipelineContext } from "../../types";

/**
 * Stage 3 - carries the Orchestration Run's evidence summary forward as its
 * own named stage (per the mission's suggested pipeline order), rather than
 * folding it silently into stage 1. No I/O: the evidence graph itself was
 * already built by the Evidence Resolution Engine when the source
 * Orchestration Run executed - the Reality Engine gathers (reads) that
 * result, it does not rebuild it.
 */
export const gatherEvidenceStage: WorkflowStage<RealityPipelineContext> = {
  name: "GATHER_EVIDENCE",
  execute: async (ctx) => {
    const source = ctx.orchestrationEvidenceSummary;
    const evidenceSummary = {
      evidenceGraphSize: source?.evidenceGraphSize ?? 0,
      supportingEvidenceCount: source?.supportingEvidenceCount ?? 0,
      missingEvidenceCount: source?.missingEvidence?.length ?? 0,
      conflictingEvidenceCount: source?.conflictingEvidence?.length ?? 0,
    };

    return {
      patch: { evidenceSummary },
      output: { ...evidenceSummary },
    };
  },
};
