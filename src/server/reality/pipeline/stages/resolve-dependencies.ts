import { prisma } from "@/server/db";
import type { WorkflowStage } from "@/server/orchestrator";
import type { RealityPipelineContext } from "../../types";

/**
 * Stage 2 - resolves the full set of entities this assessment covers, reusing
 * the Orchestration Run's already-persisted `subjectEntityIds` (the subject
 * plus its immediate relationship neighborhood) rather than re-traversing
 * the Knowledge Graph.
 */
export const resolveDependenciesStage: WorkflowStage<RealityPipelineContext> = {
  name: "RESOLVE_DEPENDENCIES",
  execute: async (ctx) => {
    const run = await prisma.orchestrationRun.findUnique({
      where: { id: ctx.orchestrationRunId },
      select: { subjectEntityIds: true },
    });
    const entitiesEvaluated = (run?.subjectEntityIds as string[]) ?? [ctx.subjectEntityId];

    return {
      patch: { entitiesEvaluated },
      output: { entityCount: entitiesEvaluated.length },
    };
  },
};
