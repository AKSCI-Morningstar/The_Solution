import { buildTraceabilityGraph } from "@/server/evidence";
import type { WorkflowStage } from "../../workflow-engine";
import type { PipelineContext } from "../../types";

/**
 * Stage 8 - builds the Requirements Traceability graph for the subject
 * entity (the Evidence Engine's `buildTraceabilityGraph`, there is no
 * separate "Requirements Traceability Platform" module). Skipped entirely
 * when stage 5 already found no supporting evidence - traceability over an
 * empty evidence graph would only ever produce zero records, so the
 * pipeline wiring gates this stage on `hasSupportingEvidence`.
 */
export const evaluateTraceabilityStage: WorkflowStage<PipelineContext> = {
  name: "EVALUATE_TRACEABILITY",
  execute: async (ctx) => {
    const graph = await buildTraceabilityGraph(
      ctx.organizationId,
      ctx.subjectEntityId,
      ctx.maxDepth,
    );

    return {
      patch: {
        traceabilityRecordCount: graph.totalRecords,
        traceabilityRecords: graph.records.map((r) => ({
          entityId: r.entityId,
          entityName: r.entityName,
          relationshipPath: r.relationshipPath,
        })),
      },
      output: { recordCount: graph.totalRecords },
    };
  },
};
