import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { AppError, ForbiddenError, NotFoundError } from "@/shared/errors";
import { runOrchestration } from "./pipeline/orchestrator";
import type {
  OrchestrationRunFilterInput,
  StageLogFilterInput,
  StartOrchestrationInput,
} from "./validation";

/**
 * Creates a QUEUED run row, then executes the pipeline to completion before
 * returning - synchronous within the request, matching the Rule Engine's
 * executeRule() rather than the Ingestion Pipeline's polling queue, since a
 * bounded graph-traversal evaluation (not document parsing) is short enough
 * to run inline. Cancellation still applies across the run's stage
 * boundaries via a concurrent POST /runs/:id/cancel request.
 */
export async function startOrchestrationRun(
  organizationId: string,
  triggeredById: string,
  input: StartOrchestrationInput,
) {
  const run = await prisma.orchestrationRun.create({
    data: {
      organizationId,
      subjectEntityId: input.subjectEntityId,
      triggeredById,
      inputs: {
        subjectEntityId: input.subjectEntityId,
        requestedRuleIds: input.requestedRuleIds ?? [],
        maxDepth: input.maxDepth,
      } as Prisma.InputJsonValue,
    },
  });

  await runOrchestration(run.id);

  const completed = await prisma.orchestrationRun.findUnique({ where: { id: run.id } });
  return completed ?? run;
}

export async function listOrchestrationRuns(
  organizationId: string,
  filters: OrchestrationRunFilterInput,
) {
  const { status, subjectEntityId, search, from, to, page, pageSize } = filters;
  const where: Prisma.OrchestrationRunWhereInput = { organizationId };
  if (status) where.status = status;
  if (subjectEntityId) where.subjectEntityId = subjectEntityId;
  if (search) where.subjectEntityId = { contains: search, mode: "insensitive" };
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }

  const [data, total] = await Promise.all([
    prisma.orchestrationRun.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.orchestrationRun.count({ where }),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getOrchestrationRun(id: string, organizationId: string) {
  const run = await prisma.orchestrationRun.findFirst({ where: { id, organizationId } });
  if (!run) throw new NotFoundError("OrchestrationRun", id);
  return run;
}

export async function listStageLogs(
  runId: string,
  organizationId: string,
  filters: StageLogFilterInput,
) {
  await getOrchestrationRun(runId, organizationId);
  const { status, page, pageSize } = filters;
  const where: Prisma.OrchestrationStageLogWhereInput = { runId };
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.orchestrationStageLog.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ stageIndex: "asc" }, { attempt: "asc" }],
    }),
    prisma.orchestrationStageLog.count({ where }),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

/** Requests cancellation of a still-running run. A no-op (not an error) if the run has already reached a terminal state - cancellation is best-effort, not a guarantee the run stops mid-stage. */
export async function cancelOrchestrationRun(
  id: string,
  organizationId: string,
  requestedById: string,
) {
  const run = await getOrchestrationRun(id, organizationId);
  if (run.status === "COMPLETED" || run.status === "FAILED" || run.status === "CANCELLED") {
    throw new AppError(
      `Run is already ${run.status.toLowerCase()} and cannot be cancelled`,
      "ALREADY_TERMINAL",
      409,
    );
  }
  if (run.triggeredById && run.triggeredById !== requestedById) {
    throw new ForbiddenError("Only the run's owner may cancel it without manage permission");
  }
  return prisma.orchestrationRun.update({ where: { id }, data: { cancelRequested: true } });
}

/** Aggregate, read-only observability: in-flight run count plus per-stage average duration and failure rate over recent stage log rows. */
export async function getPipelineStatus(organizationId: string) {
  const [inFlight, recentLogs] = await Promise.all([
    prisma.orchestrationRun.count({ where: { organizationId, status: "RUNNING" } }),
    prisma.orchestrationStageLog.findMany({
      where: { run: { organizationId } },
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

  return { inFlightRuns: inFlight, stages };
}
