# Workflow Engine

## Overview

`src/server/orchestrator/workflow-engine.ts` is a domain-agnostic sequential workflow engine. Nothing
in this file knows about engineering entities, evidence, rules, or contradictions - it only knows how
to run an ordered list of named stages against a shared context object, handling conditional skipping,
retries, timeouts, cancellation, and execution-history recording. It is the first generic engine of its
kind in this codebase - the Ingestion Pipeline and the Rule Engine each hand-roll their own sequencing.

## Core types

```ts
interface WorkflowStage<Ctx> {
  name: string;
  execute: (ctx: Ctx) => Promise<StageResult<Ctx>>;
  condition?: (ctx: Ctx) => boolean; // false => stage is SKIPPED, execute() never called
  retry?: { maxAttempts: number; backoffMs: number };
  timeoutMs?: number;
}

interface StageResult<Ctx> {
  patch: Partial<Ctx>; // merged into the context before the next stage
  output?: Record<string, unknown>; // stage-specific summary persisted with the history row
}

async function runWorkflow<Ctx>(
  stages: WorkflowStage<Ctx>[],
  initialContext: Ctx,
  options?: {
    shouldCancel?: () => Promise<boolean>;
    onStageEvent?: (event: StageEvent) => Promise<void>;
  },
): Promise<{ context: Ctx; timeline: StageEvent[] }>;
```

## Behavior

- **Sequential** - stages run strictly in array order. Stage N's execution always sees stage N-1's
  patch already merged into the context.
- **Conditional** - a `condition()` that returns `false` skips the stage entirely: no `execute()` call,
  no retry attempts, logged as `SKIPPED` in the timeline.
- **Dependency-aware** - array order _is_ the dependency order for this engine's current use (each
  stage's input is the prior stage's output via context patching). A separate DAG resolver is not
  implemented; this is the documented seam for a future non-linear pipeline.
- **Retry** - on `execute()` throwing, retries up to `stage.retry.maxAttempts` times with
  `stage.retry.backoffMs` delay between attempts. Every attempt (including retries) emits its own
  `StageEvent` with an incrementing `attempt` number, so a caller persisting each event as its own
  history row gets a complete, per-attempt audit trail.
- **Timeout** - `stage.timeoutMs` races the stage's promise against a timer via `Promise.race`; on
  expiry, throws `StageTimeoutError` (counted as a failed attempt, subject to retry).
- **Cancellation** - `options.shouldCancel()` is polled before every stage (including before the first
  retry attempt). If it resolves `true`, `runWorkflow` throws `WorkflowCancelledError` carrying the
  partial `{ context, timeline }` accumulated so far.
- **Execution history** - `options.onStageEvent` is called synchronously with each `StageEvent` as it
  happens, so a caller can persist history incrementally (one row per attempt) rather than only after
  the whole run finishes. The engine also accumulates every event into the returned `timeline` array
  regardless of whether a callback is provided.

## Error types

- `WorkflowCancelledError<Ctx>` - thrown when `shouldCancel()` resolves true before a stage starts.
  Carries `.partial` (context + timeline so far) and `.stageName` (the stage that was about to run).
- `StageTimeoutError` - thrown internally when a stage's `timeoutMs` elapses; surfaces as the `cause`
  of a `StageExecutionError` once retries are exhausted.
- `StageExecutionError<Ctx>` - thrown when a stage fails on its final attempt. Carries `.stageName`,
  `.partial`, and `.cause` (the underlying error).

## Seams for future work

- **Parallel execution** - not needed for the Orchestrator's fixed, linear 10-stage pipeline today, but
  the natural mechanism is the `runWithConcurrency()` helper already written for the Rule Engine's
  batch executor (`src/server/rules/engine/orchestrator.ts`) - once a pipeline has independent stage
  _groups_, they can run concurrently through the same worker-pool pattern.
- **Distributed execution** - the engine has no dependency on in-process state beyond the context
  object and the `onStageEvent`/`shouldCancel` callbacks; a distributed executor would replace those
  callbacks with queue-backed equivalents without changing `runWorkflow`'s core loop.

## Testing

`tests/unit/orchestrator/workflow-engine.test.ts` exercises every documented behavior directly: retry
counts and backoff, timeout firing, conditional skipping, mid-run cancellation, and the exact shape of
emitted `StageEvent`s - all without any dependency on Prisma or a running server.
