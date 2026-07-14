import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { logger } from "@/shared/logging";
import { recordAuditEvent } from "@/server/audit";
import { createNotification } from "@/server/notifications";
import {
  runWorkflow,
  WorkflowCancelledError,
  StageExecutionError,
  type WorkflowStage,
} from "../workflow-engine";
import { DEFAULT_STAGE_RETRY, DEFAULT_STAGE_TIMEOUT_MS } from "../constants";
import type { PipelineContext } from "../types";
import {
  validateRequestStage,
  resolveOrganizationContextStage,
  loadEngineeringObjectsStage,
  retrieveGraphRelationshipsStage,
  resolveSupportingEvidenceStage,
  executeRuleEngineStage,
  executeContradictionEngineStage,
  evaluateTraceabilityStage,
  aggregateResultsStage,
  produceAssessmentStage,
} from "./stages";

function hasSupportingEvidence(ctx: PipelineContext): boolean {
  return (ctx.supportingEvidenceCount ?? 0) > 0;
}

/**
 * The fixed, deterministic 10-stage evaluation order. Stages 6-8 are
 * condition-gated on stage 5's finding of at least one supporting evidence
 * node - with none, there is nothing for the Rule Engine, Contradiction
 * Engine, or Traceability builder to reason over, and skipping them lets
 * stage 10 derive INSUFFICIENT_EVIDENCE directly from stage 5's
 * missing-evidence findings instead of running engines against an empty set.
 */
function buildStages(): WorkflowStage<PipelineContext>[] {
  return [
    { ...validateRequestStage, retry: DEFAULT_STAGE_RETRY, timeoutMs: DEFAULT_STAGE_TIMEOUT_MS },
    { ...resolveOrganizationContextStage, timeoutMs: DEFAULT_STAGE_TIMEOUT_MS },
    {
      ...loadEngineeringObjectsStage,
      retry: DEFAULT_STAGE_RETRY,
      timeoutMs: DEFAULT_STAGE_TIMEOUT_MS,
    },
    {
      ...retrieveGraphRelationshipsStage,
      retry: DEFAULT_STAGE_RETRY,
      timeoutMs: DEFAULT_STAGE_TIMEOUT_MS,
    },
    {
      ...resolveSupportingEvidenceStage,
      retry: DEFAULT_STAGE_RETRY,
      timeoutMs: DEFAULT_STAGE_TIMEOUT_MS,
    },
    {
      ...executeRuleEngineStage,
      condition: hasSupportingEvidence,
      retry: DEFAULT_STAGE_RETRY,
      timeoutMs: DEFAULT_STAGE_TIMEOUT_MS,
    },
    {
      ...executeContradictionEngineStage,
      condition: hasSupportingEvidence,
      retry: DEFAULT_STAGE_RETRY,
      timeoutMs: DEFAULT_STAGE_TIMEOUT_MS,
    },
    {
      ...evaluateTraceabilityStage,
      condition: hasSupportingEvidence,
      retry: DEFAULT_STAGE_RETRY,
      timeoutMs: DEFAULT_STAGE_TIMEOUT_MS,
    },
    { ...aggregateResultsStage, timeoutMs: DEFAULT_STAGE_TIMEOUT_MS },
    { ...produceAssessmentStage, timeoutMs: DEFAULT_STAGE_TIMEOUT_MS },
  ];
}

async function shouldCancel(runId: string): Promise<boolean> {
  const current = await prisma.orchestrationRun.findUnique({
    where: { id: runId },
    select: { cancelRequested: true },
  });
  return current?.cancelRequested ?? false;
}

/** Runs the full 10-stage pipeline for one previously-created QUEUED OrchestrationRun. Never throws - every outcome is reflected in the run's persisted status. */
export async function runOrchestration(runId: string): Promise<void> {
  const run = await prisma.orchestrationRun.findUnique({ where: { id: runId } });
  if (!run) {
    logger.error("Orchestration run not found", { runId });
    return;
  }

  const inputs = run.inputs as {
    subjectEntityId: string;
    requestedRuleIds?: string[];
    maxDepth?: number;
  };
  const startedAt = new Date();

  await prisma.orchestrationRun.update({
    where: { id: runId },
    data: { status: "RUNNING", startedAt, cancelRequested: false },
  });
  await recordAuditEvent(run.organizationId, "ORCHESTRATION_STARTED", "OrchestrationRun", runId, {
    subjectEntityId: inputs.subjectEntityId,
  });

  const initialContext: PipelineContext = {
    organizationId: run.organizationId,
    triggeredById: run.triggeredById ?? undefined,
    subjectEntityId: inputs.subjectEntityId,
    requestedRuleIds: inputs.requestedRuleIds,
    maxDepth: inputs.maxDepth ?? 3,
  };

  let stageIndex = 0;

  try {
    const { context } = await runWorkflow(buildStages(), initialContext, {
      shouldCancel: () => shouldCancel(runId),
      onStageEvent: async (event) => {
        stageIndex = event.stageIndex;
        await prisma.orchestrationStageLog.create({
          data: {
            runId,
            stageName: event.stageName,
            stageIndex: event.stageIndex,
            status: event.status,
            attempt: event.attempt,
            startedAt: event.startedAt,
            completedAt: event.completedAt,
            durationMs: event.durationMs,
            errorMessage: event.errorMessage,
            output: (event.output ?? Prisma.DbNull) as Prisma.InputJsonValue,
          },
        });
        await prisma.orchestrationRun.update({
          where: { id: runId },
          data: { currentStage: event.stageName, stageIndex: event.stageIndex },
        });
      },
    });

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    await prisma.orchestrationRun.update({
      where: { id: runId },
      data: {
        status: "COMPLETED",
        currentStage: null,
        completedAt,
        durationMs,
        assessment: context.assessment as unknown as Prisma.InputJsonValue,
        subjectEntityIds: (context.loadedEntityIds ?? [
          context.subjectEntityId,
        ]) as Prisma.InputJsonValue,
        evidenceSummary: {
          evidenceGraphSize: context.evidenceGraphSize ?? 0,
          supportingEvidenceCount: context.supportingEvidenceCount ?? 0,
          missingEvidence: context.missingEvidence ?? [],
          conflictingEvidence: context.conflictingEvidence ?? [],
        } as Prisma.InputJsonValue,
        ruleResultIds: (context.ruleResults ?? []).map((r) => r.resultId) as Prisma.InputJsonValue,
        contradictionIds: (context.contradictionIds ?? []) as Prisma.InputJsonValue,
        traceabilitySummary: {
          recordCount: context.traceabilityRecordCount ?? 0,
          records: context.traceabilityRecords ?? [],
        } as Prisma.InputJsonValue,
      },
    });

    await recordAuditEvent(
      run.organizationId,
      "ORCHESTRATION_COMPLETED",
      "OrchestrationRun",
      runId,
      {
        outcome: context.assessment?.outcome,
      },
    );

    if (run.triggeredById) {
      await createNotification(run.organizationId, {
        userId: run.triggeredById,
        type: "orchestration.completed",
        title: "Engineering evaluation complete",
        message: `Assessment outcome: ${context.assessment?.outcome ?? "UNKNOWN"}`,
        link: `/orchestrator/${runId}`,
      });
    }
  } catch (error) {
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    if (error instanceof WorkflowCancelledError) {
      await prisma.orchestrationRun.update({
        where: { id: runId },
        data: {
          status: "CANCELLED",
          currentStage: null,
          completedAt,
          durationMs,
          errorStage: error.stageName,
          errorMessage: "Run was cancelled",
        },
      });
      await recordAuditEvent(
        run.organizationId,
        "ORCHESTRATION_CANCELLED",
        "OrchestrationRun",
        runId,
        {
          stageName: error.stageName,
        },
      );
      if (run.triggeredById) {
        await createNotification(run.organizationId, {
          userId: run.triggeredById,
          type: "orchestration.cancelled",
          title: "Engineering evaluation cancelled",
          message: `Cancelled before stage "${error.stageName}"`,
          link: `/orchestrator/${runId}`,
        });
      }
      return;
    }

    const stageName = error instanceof StageExecutionError ? error.stageName : "UNKNOWN";
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Orchestration run failed", { runId, stage: stageName, error: message });

    await prisma.orchestrationRun.update({
      where: { id: runId },
      data: {
        status: "FAILED",
        currentStage: null,
        completedAt,
        durationMs,
        errorStage: stageName,
        errorMessage: message,
        stageIndex,
      },
    });
    await recordAuditEvent(run.organizationId, "ORCHESTRATION_FAILED", "OrchestrationRun", runId, {
      stageName,
      errorMessage: message,
    });
    if (run.triggeredById) {
      await createNotification(run.organizationId, {
        userId: run.triggeredById,
        type: "orchestration.failed",
        title: "Engineering evaluation failed",
        message: `Failed at stage "${stageName}": ${message}`,
        link: `/orchestrator/${runId}`,
      });
    }
  }
}
