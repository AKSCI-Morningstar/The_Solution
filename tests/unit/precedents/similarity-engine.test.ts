import { describe, it, expect } from "vitest";
import { computeSimilarity, matchPrecedents } from "@/server/precedents/similarity-engine";
import { Precedent, PrecedentMatchContext } from "@/features/precedents/types";

function makePrecedent(overrides: Partial<Precedent> = {}): Precedent {
  return {
    id: "test-1",
    organizationId: "org-1",
    title: "Test Precedent",
    summary: "A test precedent",
    engineeringQuestion: null,
    decisionMade: null,
    supportingEvidence: [],
    contradictions: [],
    missingEvidence: [],
    outcome: null,
    lessonsLearned: [],
    relatedProjects: [],
    relatedSuppliers: [],
    relatedRequirements: [],
    relatedDocuments: [],
    relatedComponents: [],
    relatedStandards: [],
    relatedCertifications: [],
    decisionDate: null,
    decisionOwner: null,
    confidence: 1.0,
    tags: [],
    organization: null,
    version: 1,
    sourceEntityId: null,
    sourceAssessmentId: null,
    createdById: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    deletedAt: null,
    ...overrides,
  };
}

describe("computeSimilarity", () => {
  it("returns 0 score with no matching context", () => {
    const precedent = makePrecedent();
    const context: PrecedentMatchContext = {};
    const result = computeSimilarity(precedent, context);
    expect(result.score).toBe(0);
    expect(result.reasons).toEqual([]);
  });

  it("returns high score for matching suppliers", () => {
    const precedent = makePrecedent({
      relatedSuppliers: ["Alpha Bolt", "Beta Corp"],
    });
    const context: PrecedentMatchContext = {
      suppliers: ["Alpha Bolt", "Gamma Inc"],
    };
    const result = computeSimilarity(precedent, context);
    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.reasons[0]).toContain("supplier");
  });

  it("returns high score for matching components", () => {
    const precedent = makePrecedent({
      relatedComponents: ["Fuel Valve", "Actuator"],
    });
    const context: PrecedentMatchContext = {
      components: ["Fuel Valve"],
    };
    const result = computeSimilarity(precedent, context);
    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons[0]).toContain("component");
  });

  it("matches standards correctly", () => {
    const precedent = makePrecedent({
      relatedStandards: ["ISO 9001", "ASTM G48"],
    });
    const context: PrecedentMatchContext = {
      standards: ["ISO 9001"],
    };
    const result = computeSimilarity(precedent, context);
    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons[0]).toContain("standard");
  });

  it("matches certifications correctly", () => {
    const precedent = makePrecedent({
      relatedCertifications: ["CE Mark", "UL Listed"],
    });
    const context: PrecedentMatchContext = {
      certifications: ["CE Mark"],
    };
    const result = computeSimilarity(precedent, context);
    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons[0]).toContain("certification");
  });

  it("matches contradictions correctly", () => {
    const precedent = makePrecedent({
      contradictions: ["Material strength mismatch", "Thermal limit exceeded"],
    });
    const context: PrecedentMatchContext = {
      contradictions: ["Thermal limit exceeded"],
    };
    const result = computeSimilarity(precedent, context);
    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons[0]).toContain("contradiction");
  });

  it("matches evidence correctly", () => {
    const precedent = makePrecedent({
      supportingEvidence: ["Test Report #101", "Inspection Log #55"],
    });
    const context: PrecedentMatchContext = {
      evidence: ["Test Report #101"],
    };
    const result = computeSimilarity(precedent, context);
    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons[0]).toContain("evidence");
  });

  it("matches tags correctly", () => {
    const precedent = makePrecedent({
      tags: ["safety-critical", "aerospace"],
    });
    const context: PrecedentMatchContext = {
      tags: ["safety-critical"],
    };
    const result = computeSimilarity(precedent, context);
    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons[0]).toContain("tags");
  });

  it("matches project context", () => {
    const precedent = makePrecedent({
      relatedProjects: ["Project Alpha"],
    });
    const context: PrecedentMatchContext = {
      project: "Project Alpha",
    };
    const result = computeSimilarity(precedent, context);
    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons[0]).toContain("project");
  });

  it("matches question terms against title", () => {
    const precedent = makePrecedent({
      title: "Titanium Alloy Stress Corrosion Cracking",
    });
    const context: PrecedentMatchContext = {
      question: "Has titanium cracking happened before?",
    };
    const result = computeSimilarity(precedent, context);
    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons[0]).toContain("question");
  });

  it("matches question terms against summary", () => {
    const precedent = makePrecedent({
      title: "Test",
      summary: "Investigation of fatigue cracking in landing gear",
    });
    const context: PrecedentMatchContext = {
      question: "What about fatigue cracking?",
    };
    const result = computeSimilarity(precedent, context);
    expect(result.score).toBeGreaterThan(0);
  });

  it("matches requirements", () => {
    const precedent = makePrecedent({
      relatedRequirements: ["REQ-4.2", "REQ-5.1"],
    });
    const context: PrecedentMatchContext = {
      requirements: ["REQ-4.2"],
    };
    const result = computeSimilarity(precedent, context);
    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons[0]).toContain("requirement");
  });

  it("matches documents", () => {
    const precedent = makePrecedent({
      relatedDocuments: ["Stress Analysis Report.pdf"],
    });
    const context: PrecedentMatchContext = {
      documents: ["Stress Analysis Report.pdf"],
    };
    const result = computeSimilarity(precedent, context);
    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons[0]).toContain("document");
  });

  it("accumulates multiple match reasons", () => {
    const precedent = makePrecedent({
      relatedSuppliers: ["Alpha Bolt"],
      relatedComponents: ["Fastener"],
      relatedStandards: ["ISO 898"],
      relatedRequirements: ["REQ-4.2"],
      relatedCertifications: ["CE"],
      tags: ["aerospace"],
    });
    const context: PrecedentMatchContext = {
      suppliers: ["Alpha Bolt"],
      components: ["Fastener"],
      standards: ["ISO 898"],
      requirements: ["REQ-4.2"],
      certifications: ["CE"],
      tags: ["aerospace"],
    };
    const result = computeSimilarity(precedent, context);
    expect(result.score).toBeGreaterThan(0.5);
    expect(result.reasons.length).toBeGreaterThanOrEqual(3);
  });

  it("is case insensitive", () => {
    const precedent = makePrecedent({
      relatedSuppliers: ["ALPHA BOLT"],
    });
    const context: PrecedentMatchContext = {
      suppliers: ["alpha bolt"],
    };
    const result = computeSimilarity(precedent, context);
    expect(result.score).toBeGreaterThan(0);
  });
});

describe("matchPrecedents", () => {
  const precedents = [
    makePrecedent({
      id: "p1",
      title: "Alpha Bolt Failure",
      relatedSuppliers: ["Alpha Bolt"],
      relatedComponents: ["Fastener"],
      supportingEvidence: ["Test Report #1"],
    }),
    makePrecedent({
      id: "p2",
      title: "Beta Corp Design",
      relatedSuppliers: ["Beta Corp"],
      relatedStandards: ["ISO 9001"],
    }),
    makePrecedent({
      id: "p3",
      title: "Unrelated",
      relatedComponents: ["Widget"],
    }),
  ];

  it("returns matching precedents sorted by score descending", () => {
    const context: PrecedentMatchContext = {
      suppliers: ["Alpha Bolt"],
      components: ["Fastener"],
    };
    const results = matchPrecedents(precedents, context, 0.01, 10);
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("p1");
    expect(results[0].similarityScore).toBeGreaterThan(0);
  });

  it("returns multiple matches with correct order", () => {
    const context: PrecedentMatchContext = {
      suppliers: ["Alpha Bolt", "Beta Corp"],
      components: ["Fastener"],
    };
    const results = matchPrecedents(precedents, context, 0.01, 10);
    expect(results.length).toBe(2);
    expect(results[0].similarityScore).toBeGreaterThanOrEqual(results[1].similarityScore);
  });

  it("respects minScore threshold", () => {
    const context: PrecedentMatchContext = {
      suppliers: ["Unknown"],
    };
    const results = matchPrecedents(precedents, context, 0.5, 10);
    expect(results.length).toBe(0);
  });

  it("respects limit parameter", () => {
    const context: PrecedentMatchContext = {
      suppliers: ["Alpha Bolt", "Beta Corp"],
    };
    const results = matchPrecedents(precedents, context, 0.01, 1);
    expect(results.length).toBe(1);
  });

  it("includes matchReasons in results", () => {
    const context: PrecedentMatchContext = {
      suppliers: ["Alpha Bolt"],
    };
    const results = matchPrecedents(precedents, context, 0.01, 10);
    expect(results[0].matchReasons.length).toBeGreaterThan(0);
  });

  it("returns empty array when no context matches", () => {
    const context: PrecedentMatchContext = {};
    const results = matchPrecedents(precedents, context, 0.01, 10);
    expect(results.length).toBe(0);
  });
});
