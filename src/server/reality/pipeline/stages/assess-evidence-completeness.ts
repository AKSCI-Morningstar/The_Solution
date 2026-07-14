import { prisma } from "@/server/db";
import type { WorkflowStage } from "@/server/orchestrator";
import type { RealityPipelineContext } from "../../types";

/**
 * Stage 7 - the Reality Engine's one integration point with the Ingestion
 * Pipeline the Orchestrator does not check: whether every source document
 * that produced evidence for the entities in scope has finished processing.
 * A document still QUEUED or RUNNING means the evidence base is incomplete
 * even if everything gathered so far looks clean; a FAILED job means part of
 * the evidence base may never arrive. Neither condition re-triggers
 * ingestion - this stage only reads job status.
 */
export const assessEvidenceCompletenessStage: WorkflowStage<RealityPipelineContext> = {
  name: "ASSESS_EVIDENCE_COMPLETENESS",
  execute: async (ctx) => {
    const entityIds = ctx.entitiesEvaluated ?? [ctx.subjectEntityId];

    const extractions = await prisma.extractedEntity.findMany({
      where: { organizationId: ctx.organizationId, linkedEntityId: { in: entityIds } },
      select: { jobId: true },
      distinct: ["jobId"],
    });
    const jobIds = extractions.map((e) => e.jobId);

    const jobs =
      jobIds.length > 0
        ? await prisma.ingestionJob.findMany({
            where: { id: { in: jobIds }, organizationId: ctx.organizationId },
            select: { status: true },
          })
        : [];

    const pendingJobCount = jobs.filter(
      (j) => j.status === "QUEUED" || j.status === "RUNNING",
    ).length;
    const failedJobCount = jobs.filter((j) => j.status === "FAILED").length;
    const ingestionCompleteness = {
      totalJobsChecked: jobs.length,
      pendingJobCount,
      failedJobCount,
      allComplete: pendingJobCount === 0 && failedJobCount === 0,
    };

    return {
      patch: { ingestionCompleteness },
      output: { ...ingestionCompleteness },
    };
  },
};
