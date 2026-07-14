import { describe, expect, it } from "vitest";
import { resolveEvidence, type ExtractionRecord } from "@/server/rules/engine/evidence-resolution";
import type { SubjectEntity } from "@/server/rules/engine/types";

function makeSubject(metadata: Record<string, unknown> | null): SubjectEntity {
  return {
    id: "entity-1",
    entityType: "COMPONENT",
    identifier: "COMP-1",
    name: "Bracket",
    status: "APPROVED",
    metadata,
    tags: null,
    labels: null,
  };
}

function makeExtraction(overrides: Partial<ExtractionRecord> = {}): ExtractionRecord {
  return {
    id: "extraction-1",
    documentId: "doc-1",
    documentVersionId: "doc-version-1",
    page: 1,
    section: "3.2",
    attributes: null,
    confidence: 0.9,
    ...overrides,
  };
}

describe("resolveEvidence", () => {
  it("returns a supporting document ref for every matching extraction", () => {
    const result = resolveEvidence(makeSubject({}), [
      makeExtraction(),
      makeExtraction({ id: "extraction-2" }),
    ]);
    expect(result.supportingDocumentRefs).toHaveLength(2);
    expect(result.supportingDocumentRefs[0]).toMatchObject({
      documentId: "doc-1",
      page: 1,
      section: "3.2",
      confidence: 0.9,
    });
  });

  it("does not flag a conflict when the key is missing from the canonical side", () => {
    const result = resolveEvidence(makeSubject({}), [
      makeExtraction({ attributes: { tensileStrength: 500 } }),
    ]);
    expect(result.conflictingEvidence).toEqual([]);
  });

  it("does not flag a conflict when the key is missing from the extracted side", () => {
    const result = resolveEvidence(makeSubject({ tensileStrength: 500 }), [
      makeExtraction({ attributes: {} }),
    ]);
    expect(result.conflictingEvidence).toEqual([]);
  });

  it("flags a conflict when both sides have the same key with different values", () => {
    const result = resolveEvidence(makeSubject({ tensileStrength: 500 }), [
      makeExtraction({ attributes: { tensileStrength: 350 } }),
    ]);
    expect(result.conflictingEvidence).toHaveLength(1);
    expect(result.conflictingEvidence[0]).toMatchObject({
      attribute: "tensileStrength",
      canonicalValue: 500,
      extractedValue: 350,
    });
  });

  it("does not flag a conflict when string values match case-insensitively", () => {
    const result = resolveEvidence(makeSubject({ material: "Aluminum" }), [
      makeExtraction({ attributes: { material: "  aluminum  " } }),
    ]);
    expect(result.conflictingEvidence).toEqual([]);
  });

  it("treats a null canonical metadata as an empty object rather than throwing", () => {
    const result = resolveEvidence(makeSubject(null), [
      makeExtraction({ attributes: { material: "Steel" } }),
    ]);
    expect(result.conflictingEvidence).toEqual([]);
  });

  it("returns empty arrays when there are no matching extractions", () => {
    const result = resolveEvidence(makeSubject({}), []);
    expect(result.supportingDocumentRefs).toEqual([]);
    expect(result.conflictingEvidence).toEqual([]);
  });
});
