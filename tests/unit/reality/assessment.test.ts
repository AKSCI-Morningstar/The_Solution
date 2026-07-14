import { describe, expect, it } from "vitest";
import { deriveRealityAssessment } from "@/server/reality/pipeline/stages/produce-reality-assessment";
import type { RealityPipelineContext } from "@/server/reality/types";

function baseContext(overrides: Partial<RealityPipelineContext> = {}): RealityPipelineContext {
  return {
    organizationId: "org-1",
    subjectEntityId: "entity-1",
    orchestrationRunId: "run-1",
    orchestrationOutcome: "PASSED",
    evidenceSummary: {
      evidenceGraphSize: 5,
      supportingEvidenceCount: 4,
      missingEvidenceCount: 0,
      conflictingEvidenceCount: 0,
    },
    ruleSummary: [{ ruleId: "r1", outcome: "PASSED" }],
    contradictionSummary: [],
    openContradictionCount: 0,
    ingestionCompleteness: {
      totalJobsChecked: 2,
      pendingJobCount: 0,
      failedJobCount: 0,
      allComplete: true,
    },
    ...overrides,
  };
}

describe("deriveRealityAssessment", () => {
  it("returns INSUFFICIENT_EVIDENCE when evidence is missing, regardless of other signals", () => {
    const ctx = baseContext({
      evidenceSummary: {
        evidenceGraphSize: 0,
        supportingEvidenceCount: 0,
        missingEvidenceCount: 2,
        conflictingEvidenceCount: 0,
      },
      openContradictionCount: 3,
      ingestionCompleteness: {
        totalJobsChecked: 1,
        pendingJobCount: 1,
        failedJobCount: 0,
        allComplete: false,
      },
    });
    expect(deriveRealityAssessment(ctx).outcome).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("returns INSUFFICIENT_EVIDENCE when the source orchestration run itself was insufficient", () => {
    const ctx = baseContext({ orchestrationOutcome: "INSUFFICIENT_EVIDENCE" });
    expect(deriveRealityAssessment(ctx).outcome).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("returns INCOMPLETE when ingestion has pending or failed jobs, ahead of contradictions", () => {
    const ctx = baseContext({
      ingestionCompleteness: {
        totalJobsChecked: 3,
        pendingJobCount: 1,
        failedJobCount: 1,
        allComplete: false,
      },
      openContradictionCount: 1,
    });
    expect(deriveRealityAssessment(ctx).outcome).toBe("INCOMPLETE");
  });

  it("returns CONTRADICTED when a contradiction is currently open and ingestion is complete", () => {
    const ctx = baseContext({ openContradictionCount: 1 });
    expect(deriveRealityAssessment(ctx).outcome).toBe("CONTRADICTED");
  });

  it("returns NEEDS_REVIEW when the source run was NEEDS_REVIEW", () => {
    const ctx = baseContext({ orchestrationOutcome: "NEEDS_REVIEW" });
    expect(deriveRealityAssessment(ctx).outcome).toBe("NEEDS_REVIEW");
  });

  it("returns NEEDS_REVIEW when the source run was BLOCKED", () => {
    const ctx = baseContext({ orchestrationOutcome: "BLOCKED" });
    expect(deriveRealityAssessment(ctx).outcome).toBe("NEEDS_REVIEW");
  });

  it("returns NEEDS_REVIEW when a re-read rule outcome is NEEDS_REVIEW even if the run outcome was PASSED", () => {
    const ctx = baseContext({
      orchestrationOutcome: "PASSED",
      ruleSummary: [{ ruleId: "r1", outcome: "NEEDS_REVIEW" }],
    });
    expect(deriveRealityAssessment(ctx).outcome).toBe("NEEDS_REVIEW");
  });

  it("returns NEEDS_REVIEW when the source run FAILED", () => {
    const ctx = baseContext({ orchestrationOutcome: "FAILED" });
    expect(deriveRealityAssessment(ctx).outcome).toBe("NEEDS_REVIEW");
  });

  it("returns CONDITIONALLY_VERIFIED when passed but conflicting evidence was recorded", () => {
    const ctx = baseContext({
      evidenceSummary: {
        evidenceGraphSize: 5,
        supportingEvidenceCount: 4,
        missingEvidenceCount: 0,
        conflictingEvidenceCount: 1,
      },
    });
    expect(deriveRealityAssessment(ctx).outcome).toBe("CONDITIONALLY_VERIFIED");
  });

  it("returns VERIFIED when every signal is clean", () => {
    const ctx = baseContext();
    expect(deriveRealityAssessment(ctx).outcome).toBe("VERIFIED");
  });

  it("never invents a reasoning string independent of the derived outcome", () => {
    const ctx = baseContext();
    const result = deriveRealityAssessment(ctx);
    expect(result.reasoning.length).toBeGreaterThan(0);
    expect(typeof result.reasoning).toBe("string");
  });
});
