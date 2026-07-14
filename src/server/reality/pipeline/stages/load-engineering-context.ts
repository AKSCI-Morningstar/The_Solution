import { prisma } from "@/server/db";
import { AppError, NotFoundError } from "@/shared/errors";
import type { WorkflowStage } from "@/server/orchestrator";
import type { RealityPipelineContext } from "../../types";

/**
 * Stage 1 - loads the source Orchestration Run this assessment reinterprets.
 * The Reality Engine never re-executes the Rule or Contradiction engines -
 * it consumes an already-completed run's persisted outputs. A run that
 * hasn't reached COMPLETED has no stable outputs to reinterpret, so this is
 * a genuine validation failure, not "insufficient evidence".
 */
export const loadEngineeringContextStage: WorkflowStage<RealityPipelineContext> = {
  name: "LOAD_ENGINEERING_CONTEXT",
  execute: async (ctx) => {
    const run = await prisma.orchestrationRun.findFirst({
      where: { id: ctx.orchestrationRunId, organizationId: ctx.organizationId },
    });
    if (!run) throw new NotFoundError("OrchestrationRun", ctx.orchestrationRunId);
    if (run.status !== "COMPLETED") {
      throw new AppError(
        `Orchestration run is ${run.status.toLowerCase()}, not completed - Reality can only be assessed from a completed run`,
        "ORCHESTRATION_RUN_NOT_COMPLETED",
        400,
      );
    }

    const assessment = run.assessment as { outcome: string } | null;
    const evidenceSummary =
      run.evidenceSummary as RealityPipelineContext["orchestrationEvidenceSummary"];
    const traceabilitySummary = run.traceabilitySummary as { recordCount: number } | null;

    return {
      patch: {
        orchestrationOutcome: assessment?.outcome,
        orchestrationRuleResultIds: (run.ruleResultIds as string[]) ?? [],
        orchestrationContradictionIds: (run.contradictionIds as string[]) ?? [],
        orchestrationEvidenceSummary: evidenceSummary ?? undefined,
        orchestrationTraceabilitySummary: traceabilitySummary ?? undefined,
      },
      output: { orchestrationOutcome: assessment?.outcome, orchestrationRunStatus: run.status },
    };
  },
};
