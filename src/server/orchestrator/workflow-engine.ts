/**
 * A domain-agnostic sequential workflow engine. Nothing in this file knows
 * about engineering entities, evidence, rules, or contradictions - it only
 * knows how to run an ordered list of named stages against a shared context,
 * handling conditional skipping, retries, timeouts, cancellation, and
 * execution-history recording. `pipeline/orchestrator.ts` is the one place
 * that plugs the actual Engineering Reasoning stages into this engine.
 *
 * Stages run in array order today (sequential). The seam for parallel
 * execution is `runWithConcurrency`-style grouping (already used by the Rule
 * Engine's batch executor, src/server/rules/engine/orchestrator.ts) once a
 * pipeline has independent stage groups to run concurrently - not needed for
 * this fixed, linear 10-stage pipeline.
 */

export interface StageResult<Ctx> {
  /** Merged into the context before the next stage runs. */
  patch: Partial<Ctx>;
  /** Stage-specific summary persisted alongside the stage's execution-history row - never the reasoning output itself, just what the stage produced (counts, ids, etc). */
  output?: Record<string, unknown>;
}

export interface WorkflowStage<Ctx> {
  name: string;
  execute: (ctx: Ctx) => Promise<StageResult<Ctx>>;
  /** If false, the stage is skipped entirely (no execute() call, no retry, logged as SKIPPED). */
  condition?: (ctx: Ctx) => boolean;
  retry?: { maxAttempts: number; backoffMs: number };
  timeoutMs?: number;
}

export type StageEventStatus = "SUCCEEDED" | "FAILED" | "SKIPPED" | "RETRYING";

export interface StageEvent {
  stageName: string;
  stageIndex: number;
  status: StageEventStatus;
  attempt: number;
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
  errorMessage?: string;
  output?: Record<string, unknown>;
}

export interface WorkflowRunOptions {
  /** Polled before every stage (including retries) - returning true aborts the run with WorkflowCancelledError. */
  shouldCancel?: () => Promise<boolean>;
  /** Called synchronously with each StageEvent as it happens, so the caller can persist execution history incrementally rather than only at the end. */
  onStageEvent?: (event: StageEvent) => Promise<void>;
}

export interface WorkflowRunResult<Ctx> {
  context: Ctx;
  timeline: StageEvent[];
}

export class WorkflowCancelledError<Ctx> extends Error {
  constructor(
    public readonly partial: WorkflowRunResult<Ctx>,
    public readonly stageName: string,
  ) {
    super(`Workflow cancelled before stage "${stageName}"`);
    this.name = "WorkflowCancelledError";
  }
}

export class StageTimeoutError extends Error {
  constructor(
    public readonly stageName: string,
    public readonly timeoutMs: number,
  ) {
    super(`Stage "${stageName}" timed out after ${timeoutMs}ms`);
    this.name = "StageTimeoutError";
  }
}

export class StageExecutionError<Ctx> extends Error {
  constructor(
    public readonly stageName: string,
    public readonly partial: WorkflowRunResult<Ctx>,
    public readonly cause: unknown,
  ) {
    super(`Stage "${stageName}" failed: ${cause instanceof Error ? cause.message : String(cause)}`);
    this.name = "StageExecutionError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(
  promise: Promise<T>,
  stageName: string,
  timeoutMs?: number,
): Promise<T> {
  if (!timeoutMs) return promise;
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new StageTimeoutError(stageName, timeoutMs)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

export async function runWorkflow<Ctx>(
  stages: WorkflowStage<Ctx>[],
  initialContext: Ctx,
  options: WorkflowRunOptions = {},
): Promise<WorkflowRunResult<Ctx>> {
  let context = initialContext;
  const timeline: StageEvent[] = [];

  async function emit(event: StageEvent): Promise<void> {
    timeline.push(event);
    if (options.onStageEvent) await options.onStageEvent(event);
  }

  for (let stageIndex = 0; stageIndex < stages.length; stageIndex++) {
    const stage = stages[stageIndex];

    if (options.shouldCancel && (await options.shouldCancel())) {
      throw new WorkflowCancelledError({ context, timeline }, stage.name);
    }

    if (stage.condition && !stage.condition(context)) {
      const now = new Date();
      await emit({
        stageName: stage.name,
        stageIndex,
        status: "SKIPPED",
        attempt: 1,
        startedAt: now,
        completedAt: now,
        durationMs: 0,
      });
      continue;
    }

    const maxAttempts = stage.retry?.maxAttempts ?? 1;
    const backoffMs = stage.retry?.backoffMs ?? 0;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const startedAt = new Date();
      try {
        const result = await withTimeout(stage.execute(context), stage.name, stage.timeoutMs);
        context = { ...context, ...result.patch };
        const completedAt = new Date();
        await emit({
          stageName: stage.name,
          stageIndex,
          status: "SUCCEEDED",
          attempt,
          startedAt,
          completedAt,
          durationMs: completedAt.getTime() - startedAt.getTime(),
          output: result.output,
        });
        lastError = undefined;
        break;
      } catch (error) {
        lastError = error;
        const completedAt = new Date();
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isLastAttempt = attempt === maxAttempts;
        await emit({
          stageName: stage.name,
          stageIndex,
          status: isLastAttempt ? "FAILED" : "RETRYING",
          attempt,
          startedAt,
          completedAt,
          durationMs: completedAt.getTime() - startedAt.getTime(),
          errorMessage,
        });
        if (!isLastAttempt && backoffMs > 0) await sleep(backoffMs);
      }
    }

    if (lastError !== undefined) {
      throw new StageExecutionError(stage.name, { context, timeline }, lastError);
    }
  }

  return { context, timeline };
}
