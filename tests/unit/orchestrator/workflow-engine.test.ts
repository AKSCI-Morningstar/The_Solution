import { describe, expect, it, vi } from "vitest";
import {
  runWorkflow,
  StageExecutionError,
  WorkflowCancelledError,
  type WorkflowStage,
} from "@/server/orchestrator/workflow-engine";

interface Ctx {
  count: number;
  log: string[];
}

describe("runWorkflow", () => {
  it("runs stages sequentially, threading the context patch forward", async () => {
    const stages: WorkflowStage<Ctx>[] = [
      { name: "A", execute: async (ctx) => ({ patch: { count: ctx.count + 1 } }) },
      { name: "B", execute: async (ctx) => ({ patch: { count: ctx.count * 2 } }) },
    ];
    const { context, timeline } = await runWorkflow(stages, { count: 1, log: [] });
    expect(context.count).toBe(4);
    expect(timeline.map((e) => e.stageName)).toEqual(["A", "B"]);
    expect(timeline.every((e) => e.status === "SUCCEEDED")).toBe(true);
  });

  it("skips a stage whose condition is false without calling execute", async () => {
    const execute = vi.fn(async () => ({ patch: {} }));
    const stages: WorkflowStage<Ctx>[] = [
      { name: "SKIPPED_STAGE", condition: () => false, execute },
    ];
    const { timeline } = await runWorkflow(stages, { count: 0, log: [] });
    expect(execute).not.toHaveBeenCalled();
    expect(timeline[0].status).toBe("SKIPPED");
  });

  it("retries a failing stage up to maxAttempts and records each attempt", async () => {
    let calls = 0;
    const stages: WorkflowStage<Ctx>[] = [
      {
        name: "FLAKY",
        retry: { maxAttempts: 3, backoffMs: 0 },
        execute: async () => {
          calls++;
          if (calls < 3) throw new Error("transient failure");
          return { patch: {} };
        },
      },
    ];
    const { timeline } = await runWorkflow(stages, { count: 0, log: [] });
    expect(calls).toBe(3);
    expect(timeline.map((e) => e.status)).toEqual(["RETRYING", "RETRYING", "SUCCEEDED"]);
    expect(timeline.map((e) => e.attempt)).toEqual([1, 2, 3]);
  });

  it("throws StageExecutionError once retries are exhausted", async () => {
    const stages: WorkflowStage<Ctx>[] = [
      {
        name: "ALWAYS_FAILS",
        retry: { maxAttempts: 2, backoffMs: 0 },
        execute: async () => {
          throw new Error("permanent failure");
        },
      },
    ];
    await expect(runWorkflow(stages, { count: 0, log: [] })).rejects.toThrow(StageExecutionError);
  });

  it("throws StageTimeoutError-driven failure when a stage exceeds timeoutMs", async () => {
    const stages: WorkflowStage<Ctx>[] = [
      {
        name: "SLOW",
        timeoutMs: 10,
        execute: () => new Promise((resolve) => setTimeout(() => resolve({ patch: {} }), 200)),
      },
    ];
    try {
      await runWorkflow(stages, { count: 0, log: [] });
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(StageExecutionError);
      const cause = (error as StageExecutionError<Ctx>).cause;
      expect(cause).toBeInstanceOf(Error);
      expect((cause as Error).message).toContain("timed out");
    }
  });

  it("cancels mid-run and surfaces the partial timeline", async () => {
    const stages: WorkflowStage<Ctx>[] = [
      { name: "FIRST", execute: async () => ({ patch: { count: 1 } }) },
      { name: "SECOND", execute: async () => ({ patch: { count: 2 } }) },
    ];
    let ran = 0;
    try {
      await runWorkflow(stages, { count: 0, log: [] }, { shouldCancel: async () => ++ran > 1 });
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(WorkflowCancelledError);
      const cancelled = error as WorkflowCancelledError<Ctx>;
      expect(cancelled.stageName).toBe("SECOND");
      expect(cancelled.partial.context.count).toBe(1);
      expect(cancelled.partial.timeline).toHaveLength(1);
    }
  });

  it("emits every StageEvent to onStageEvent as it happens", async () => {
    const events: string[] = [];
    const stages: WorkflowStage<Ctx>[] = [
      { name: "A", execute: async () => ({ patch: {} }) },
      { name: "B", execute: async () => ({ patch: {} }) },
    ];
    await runWorkflow(
      stages,
      { count: 0, log: [] },
      { onStageEvent: async (event) => events.push(event.stageName) },
    );
    expect(events).toEqual(["A", "B"]);
  });
});
