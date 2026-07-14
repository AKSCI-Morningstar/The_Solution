import { describe, expect, it } from "vitest";
import { aggregate } from "@/server/orchestrator/pipeline/stages/aggregate-results";
import { deriveAssessment } from "@/server/orchestrator/pipeline/stages/produce-assessment";
import type { PipelineContext } from "@/server/orchestrator/types";

function baseContext(overrides: Partial<PipelineContext> = {}): PipelineContext {
  return {
    organizationId: "org-1",
    subjectEntityId: "entity-1",
    maxDepth: 3,
    ...overrides,
  };
}

describe("aggregate", () => {
  it("tallies rule outcomes by outcome name", () => {
    const ctx = baseContext({
      ruleResults: [
        { ruleId: "r1", outcome: "PASSED", resultId: "res1" },
        { ruleId: "r2", outcome: "FAILED", resultId: "res2" },
        { ruleId: "r3", outcome: "PASSED", resultId: "res3" },
      ],
    });
    const result = aggregate(ctx);
    expect(result.ruleOutcomeCounts).toEqual({ PASSED: 2, FAILED: 1 });
    expect(result.hasFailedRule).toBe(true);
    expect(result.hasUnpassedRule).toBe(true);
  });

  it("reports no unpassed rules when everything passed", () => {
    const ctx = baseContext({
      ruleResults: [{ ruleId: "r1", outcome: "PASSED", resultId: "res1" }],
    });
    const result = aggregate(ctx);
    expect(result.hasUnpassedRule).toBe(false);
    expect(result.hasFailedRule).toBe(false);
  });

  it("defaults every count to zero when the context has no populated fields", () => {
    const result = aggregate(baseContext());
    expect(result).toEqual({
      missingEvidenceCount: 0,
      conflictingEvidenceCount: 0,
      ruleOutcomeCounts: {},
      hasUnpassedRule: false,
      hasFailedRule: false,
      openContradictionCount: 0,
      traceabilityRecordCount: 0,
    });
  });
});

describe("deriveAssessment", () => {
  it("returns INSUFFICIENT_EVIDENCE when evidence is missing, regardless of other signals", () => {
    const assessment = deriveAssessment({
      missingEvidenceCount: 2,
      conflictingEvidenceCount: 0,
      ruleOutcomeCounts: { FAILED: 5 },
      hasUnpassedRule: true,
      hasFailedRule: true,
      openContradictionCount: 3,
      traceabilityRecordCount: 0,
    });
    expect(assessment.outcome).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("returns NEEDS_REVIEW when contradictions are open and evidence is complete", () => {
    const assessment = deriveAssessment({
      missingEvidenceCount: 0,
      conflictingEvidenceCount: 0,
      ruleOutcomeCounts: { PASSED: 1 },
      hasUnpassedRule: false,
      hasFailedRule: false,
      openContradictionCount: 1,
      traceabilityRecordCount: 0,
    });
    expect(assessment.outcome).toBe("NEEDS_REVIEW");
  });

  it("returns BLOCKED when a rule outcome is BLOCKED and there are no contradictions", () => {
    const assessment = deriveAssessment({
      missingEvidenceCount: 0,
      conflictingEvidenceCount: 0,
      ruleOutcomeCounts: { BLOCKED: 1, PASSED: 2 },
      hasUnpassedRule: true,
      hasFailedRule: false,
      openContradictionCount: 0,
      traceabilityRecordCount: 0,
    });
    expect(assessment.outcome).toBe("BLOCKED");
  });

  it("returns FAILED when a rule failed and nothing higher-precedence applies", () => {
    const assessment = deriveAssessment({
      missingEvidenceCount: 0,
      conflictingEvidenceCount: 0,
      ruleOutcomeCounts: { FAILED: 1, PASSED: 2 },
      hasUnpassedRule: true,
      hasFailedRule: true,
      openContradictionCount: 0,
      traceabilityRecordCount: 0,
    });
    expect(assessment.outcome).toBe("FAILED");
  });

  it("returns PASSED when every signal is clean", () => {
    const assessment = deriveAssessment({
      missingEvidenceCount: 0,
      conflictingEvidenceCount: 0,
      ruleOutcomeCounts: { PASSED: 3 },
      hasUnpassedRule: false,
      hasFailedRule: false,
      openContradictionCount: 0,
      traceabilityRecordCount: 0,
    });
    expect(assessment.outcome).toBe("PASSED");
  });

  it("never invents missing or conflicting evidence beyond what the context provides", () => {
    const assessment = deriveAssessment({
      missingEvidenceCount: 0,
      conflictingEvidenceCount: 0,
      ruleOutcomeCounts: {},
      hasUnpassedRule: false,
      hasFailedRule: false,
      openContradictionCount: 0,
      traceabilityRecordCount: 0,
    });
    expect(assessment.missingEvidence).toEqual([]);
    expect(assessment.conflictingEvidence).toEqual([]);
  });
});
