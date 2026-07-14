import { describe, expect, it } from "vitest";
import { assignProvenance } from "@/server/ingestion/pipeline/stages/provenance-assignment";
import type { ExtractedEntityDraft } from "@/server/ingestion/pipeline/types";

function entity(overrides: Partial<ExtractedEntityDraft> = {}): ExtractedEntityDraft {
  return {
    localId: "e1",
    entityType: "PART_NUMBER",
    identifier: "ABC-123",
    name: "ABC-123",
    rawText: "P/N: ABC-123",
    attributes: null,
    confidence: 0.75,
    page: 1,
    section: null,
    paragraph: null,
    extractionMethod: "regex:part-number-v1",
    ...overrides,
  };
}

describe("assignProvenance", () => {
  it("stamps a single shared extractedAt across a batch", () => {
    const result = assignProvenance([entity(), entity({ localId: "e2" })], [], []);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.issues).toEqual([]);
  });

  it("flags an out-of-range confidence value", () => {
    const result = assignProvenance([entity({ confidence: 1.5 })], [], []);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].code).toBe("EXTRACTION_INCONSISTENCY");
  });

  it("does not flag a confidence value within range", () => {
    const result = assignProvenance([entity({ confidence: 0 }), entity({ confidence: 1 })], [], []);
    expect(result.issues).toEqual([]);
  });
});
