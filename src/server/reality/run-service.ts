import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { AppError, ForbiddenError, NotFoundError } from "@/shared/errors";
import { runRealityAssessment } from "./pipeline/orchestrator";
import type {
  CompareAssessmentsInput,
  RealityAssessmentFilterInput,
  RealityStageLogFilterInput,
  StartRealityAssessmentInput,
} from "./validation";

/**
 * Creates a QUEUED assessment row for an already-completed Orchestration
 * Run, then executes the 8-stage pipeline to completion before returning -
 * synchronous within the request, matching the Orchestrator's own
 * `startOrchestrationRun` (a bounded reinterpretation of already-persisted
 * data is short enough to run inline).
 */
export async function startRealityAssessment(
  organizationId: string,
  triggeredById: string,
  input: StartRealityAssessmentInput,
) {
  const run = await prisma.orchestrationRun.findFirst({
    where: { id: input.orchestrationRunId, organizationId },
    select: { id: true, subjectEntityId: true },
  });
  if (!run) throw new NotFoundError("OrchestrationRun", input.orchestrationRunId);

  const assessment = await prisma.realityAssessment.create({
    data: {
      organizationId,
      subjectEntityId: run.subjectEntityId,
      orchestrationRunId: run.id,
      triggeredById,
    },
  });

  await runRealityAssessment(assessment.id);

  const completed = await prisma.realityAssessment.findUnique({ where: { id: assessment.id } });
  return completed ?? assessment;
}

export async function listRealityAssessments(
  organizationId: string,
  filters: RealityAssessmentFilterInput,
) {
  const { status, outcome, subjectEntityId, search, from, to, page, pageSize } = filters;
  const where: Prisma.RealityAssessmentWhereInput = { organizationId };
  if (status) where.status = status;
  if (outcome) where.outcome = outcome;
  if (subjectEntityId) where.subjectEntityId = subjectEntityId;
  if (search) where.subjectEntityId = { contains: search, mode: "insensitive" };
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }

  const [data, total] = await Promise.all([
    prisma.realityAssessment.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.realityAssessment.count({ where }),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getRealityAssessment(id: string, organizationId: string) {
  const assessment = await prisma.realityAssessment.findFirst({ where: { id, organizationId } });
  if (!assessment) throw new NotFoundError("RealityAssessment", id);
  return assessment;
}

export async function listRealityStageLogs(
  assessmentId: string,
  organizationId: string,
  filters: RealityStageLogFilterInput,
) {
  await getRealityAssessment(assessmentId, organizationId);
  const { status, page, pageSize } = filters;
  const where: Prisma.RealityStageLogWhereInput = { assessmentId };
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.realityStageLog.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ stageIndex: "asc" }, { attempt: "asc" }],
    }),
    prisma.realityStageLog.count({ where }),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

/** Requests cancellation of a still-running assessment. Best-effort, not a guarantee it stops mid-stage. */
export async function cancelRealityAssessment(
  id: string,
  organizationId: string,
  requestedById: string,
) {
  const assessment = await getRealityAssessment(id, organizationId);
  if (
    assessment.status === "COMPLETED" ||
    assessment.status === "FAILED" ||
    assessment.status === "CANCELLED"
  ) {
    throw new AppError(
      `Assessment is already ${assessment.status.toLowerCase()} and cannot be cancelled`,
      "ALREADY_TERMINAL",
      409,
    );
  }
  if (assessment.triggeredById && assessment.triggeredById !== requestedById) {
    throw new ForbiddenError("Only the assessment's owner may cancel it without manage permission");
  }
  return prisma.realityAssessment.update({ where: { id }, data: { cancelRequested: true } });
}

/** Fetches multiple assessments by id for side-by-side comparison - the diffing itself happens client-side against these independently-returned records. */
export async function compareRealityAssessments(
  organizationId: string,
  input: CompareAssessmentsInput,
) {
  const assessments = await prisma.realityAssessment.findMany({
    where: { id: { in: input.ids }, organizationId },
  });
  return assessments;
}

/** Aggregate, read-only observability: in-flight assessment count, outcome distribution, plus per-stage average duration and failure rate over recent stage log rows. */
export async function getRealityPipelineStatus(organizationId: string) {
  const [inFlight, completedByOutcome, recentLogs] = await Promise.all([
    prisma.realityAssessment.count({ where: { organizationId, status: "RUNNING" } }),
    prisma.realityAssessment.groupBy({
      by: ["outcome"],
      where: { organizationId, status: "COMPLETED" },
      _count: { outcome: true },
    }),
    prisma.realityStageLog.findMany({
      where: { assessment: { organizationId } },
      orderBy: { startedAt: "desc" },
      take: 500,
      select: { stageName: true, status: true, durationMs: true },
    }),
  ]);

  const byStage = new Map<string, { count: number; failed: number; totalDurationMs: number }>();
  for (const log of recentLogs) {
    const entry = byStage.get(log.stageName) ?? { count: 0, failed: 0, totalDurationMs: 0 };
    entry.count += 1;
    if (log.status === "FAILED") entry.failed += 1;
    entry.totalDurationMs += log.durationMs ?? 0;
    byStage.set(log.stageName, entry);
  }

  const stages = Array.from(byStage.entries()).map(([stageName, entry]) => ({
    stageName,
    sampleSize: entry.count,
    averageDurationMs: entry.count > 0 ? Math.round(entry.totalDurationMs / entry.count) : 0,
    failureRate: entry.count > 0 ? Number((entry.failed / entry.count).toFixed(4)) : 0,
  }));

  const outcomeDistribution = Object.fromEntries(
    completedByOutcome.map((row) => [row.outcome ?? "UNKNOWN", row._count.outcome]),
  );

  return { inFlightAssessments: inFlight, outcomeDistribution, stages };
}
