import { prisma } from "@/server/db";
import type { WorkflowStage } from "@/server/orchestrator";
import { OPEN_CONTRADICTION_STATUSES } from "../../constants";
import type { RealityPipelineContext } from "../../types";

/**
 * Stage 5 - re-reads the *current* lifecycle status of every contradiction
 * detected during the source Orchestration Run. This is the one signal the
 * Reality Engine deliberately re-checks rather than reusing verbatim: a
 * contradiction's status can change after the run completed (a human may
 * resolve, accept, or reopen it), and Engineering Reality must reflect the
 * present state of the world, not a frozen snapshot. The contradiction is
 * never re-detected - only its persisted status is read.
 */
export const evaluateContradictionsStage: WorkflowStage<RealityPipelineContext> = {
  name: "EVALUATE_CONTRADICTIONS",
  execute: async (ctx) => {
    const contradictionIds = ctx.orchestrationContradictionIds ?? [];
    const contradictions =
      contradictionIds.length > 0
        ? await prisma.contradiction.findMany({
            where: { id: { in: contradictionIds }, organizationId: ctx.organizationId },
            select: { id: true, status: true, severity: true },
          })
        : [];

    const openStatuses = new Set<string>(OPEN_CONTRADICTION_STATUSES);
    const contradictionSummary = contradictions.map((c) => ({
      id: c.id,
      status: c.status,
      severity: c.severity,
      open: openStatuses.has(c.status),
    }));
    const openContradictionCount = contradictionSummary.filter((c) => c.open).length;

    return {
      patch: { contradictionSummary, openContradictionCount },
      output: { total: contradictionSummary.length, open: openContradictionCount },
    };
  },
};
