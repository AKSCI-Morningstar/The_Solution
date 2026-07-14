import type { WorkflowStage } from "@/server/orchestrator";
import type { RealityPipelineContext } from "../../types";

/** Stage 6 - carries the source Orchestration Run's Requirements Traceability summary forward. No I/O: the traceability graph was already built when the run executed. */
export const evaluateTraceabilityStage: WorkflowStage<RealityPipelineContext> = {
  name: "EVALUATE_TRACEABILITY",
  execute: async (ctx) => {
    const traceabilityRecordCount = ctx.orchestrationTraceabilitySummary?.recordCount ?? 0;
    return {
      patch: { traceabilityRecordCount },
      output: { traceabilityRecordCount },
    };
  },
};
