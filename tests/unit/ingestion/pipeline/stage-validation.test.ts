import { describe, expect, it } from "vitest";
import { validateExtraction } from "@/server/ingestion/pipeline/stages/stage-validation";
import type { ParsedDocument } from "@/server/ingestion/parsers";
import type {
  ExtractedEntityDraft,
  ExtractedReferenceDraft,
} from "@/server/ingestion/pipeline/types";

const emptyDoc: ParsedDocument = {
  fullText: "some text",
  pages: [{ pageNumber: 1, text: "some text" }],
  sections: [],
  tables: [],
  metadata: {},
};

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

function reference(overrides: Partial<ExtractedReferenceDraft> = {}): ExtractedReferenceDraft {
  return {
    referenceType: "PART",
    rawText: "P/N: ABC-123",
    targetIdentifier: "ABC-123",
    page: 1,
    section: null,
    confidence: 0.7,
    extractionMethod: "regex:part-reference-v1",
    ...overrides,
  };
}

describe("validateExtraction", () => {
  it("flags missing content when the document has no text", () => {
    const issues = validateExtraction({
      parsedDocument: { ...emptyDoc, fullText: "   " },
      entities: [],
      references: [],
    });
    expect(issues.some((i) => i.code === "MISSING_METADATA")).toBe(true);
  });

  it("flags duplicate entities extracted more than once", () => {
    const issues = validateExtraction({
      parsedDocument: emptyDoc,
      entities: [entity(), entity({ localId: "e2" })],
      references: [],
    });
    const duplicate = issues.find((i) => i.code === "DUPLICATE_ENTITY");
    expect(duplicate?.severity).toBe("INFO");
    expect(duplicate?.context?.count).toBe(2);
  });

  it("flags a reference that does not resolve to any entity in this document", () => {
    const issues = validateExtraction({
      parsedDocument: emptyDoc,
      entities: [],
      references: [reference({ targetIdentifier: "UNRELATED-999" })],
    });
    expect(issues.some((i) => i.code === "BROKEN_REFERENCE")).toBe(true);
  });

  it("does not flag a reference that resolves to an extracted entity", () => {
    const issues = validateExtraction({
      parsedDocument: emptyDoc,
      entities: [entity({ identifier: "ABC-123" })],
      references: [reference({ targetIdentifier: "ABC-123" })],
    });
    expect(issues.some((i) => i.code === "BROKEN_REFERENCE")).toBe(false);
  });

  it("returns no issues for clean, well-formed extraction", () => {
    const issues = validateExtraction({
      parsedDocument: emptyDoc,
      entities: [entity()],
      references: [],
    });
    expect(issues).toEqual([]);
  });
});
