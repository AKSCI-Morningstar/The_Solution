import { describe, expect, it } from "vitest";
import { extractReferences } from "@/server/ingestion/pipeline/stages/reference-extraction";
import type { ParsedDocument } from "@/server/ingestion/parsers";

function singlePageDocument(text: string): ParsedDocument {
  return {
    fullText: text,
    pages: [{ pageNumber: 1, text }],
    sections: [],
    tables: [],
    metadata: {},
  };
}

describe("extractReferences", () => {
  it("extracts a requirement reference", () => {
    const refs = extractReferences(singlePageDocument("See REQ-4471 for details."));
    const requirement = refs.find((r) => r.referenceType === "REQUIREMENT");
    expect(requirement?.targetIdentifier).toBe("4471");
  });

  it("extracts a revision reference", () => {
    const refs = extractReferences(singlePageDocument("Applies to Rev C of this drawing."));
    const revision = refs.find((r) => r.referenceType === "REVISION");
    expect(revision?.targetIdentifier).toBe("C");
  });

  it("returns no references for text with none", () => {
    expect(extractReferences(singlePageDocument("no references in this sentence"))).toEqual([]);
  });
});
