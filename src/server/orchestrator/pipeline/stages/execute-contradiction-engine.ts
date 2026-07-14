import { detectAndStoreContradictions } from "@/server/contradictions";
import type { WorkflowStage } from "../../workflow-engine";
import type { PipelineContext } from "../../types";

/**
 * Stage 7 - runs contradiction detection for the subject entity and
 * persists any newly-detected contradictions. `detectAndStoreContradictions`
 * builds its own evidence graph internally (it doesn't accept a pre-built
 * one), so this stage does re-run graph traversal that stage 5 already
 * performed - a known, documented redundancy between two independently-built
 * engines, not a defect in this pipeline. See docs/engineering-reasoning-orchestrator.md.
 */
export const executeContradictionEngineStage: WorkflowStage<PipelineContext> = {
  name: "EXECUTE_CONTRADICTION_ENGINE",
  execute: async (ctx) => {
    const result = await detectAndStoreContradictions(
      ctx.organizationId,
      ctx.subjectEntityId,
      ctx.maxDepth,
      ctx.triggeredById,
    );

    const contradictionIds = result.contradictions.map((c) => c.id);

    return {
      patch: { contradictionIds, contradictionCount: contradictionIds.length },
      output: { contradictionCount: contradictionIds.length, totalDetected: result.totalDetected },
    };
  },
};
