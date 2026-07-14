import { describe, expect, it } from "vitest";
import { extractEntities } from "@/server/ingestion/pipeline/stages/entity-extraction";
import type { ParsedDocument } from "@/server/ingestion/parsers";

function singlePageDocument(
  text: string,
  sections: ParsedDocument["sections"] = [],
): ParsedDocument {
  return { fullText: text, pages: [{ pageNumber: 1, text }], sections, tables: [], metadata: {} };
}

describe("extractEntities", () => {
  it("extracts a part number", () => {
    const doc = singlePageDocument("Load rating per P/N: ABC-123.");
    const entities = extractEntities(doc);
    const partNumber = entities.find((e) => e.entityType === "PART_NUMBER");
    expect(partNumber?.identifier).toBe("ABC-123");
    expect(partNumber?.page).toBe(1);
    expect(partNumber?.extractionMethod).toBe("regex:part-number-v1");
  });

  it("extracts a standard reference", () => {
    const doc = singlePageDocument("Testing shall follow MIL-STD-810.");
    const entities = extractEntities(doc);
    const standard = entities.find((e) => e.entityType === "STANDARD");
    expect(standard?.identifier).toBe("MIL-STD-810");
    expect(standard?.confidence).toBeCloseTo(0.85);
  });

  it("extracts a material keyword with lower confidence", () => {
    const doc = singlePageDocument("The bracket is made of titanium.");
    const entities = extractEntities(doc);
    const material = entities.find((e) => e.entityType === "MATERIAL");
    expect(material?.name.toLowerCase()).toBe("titanium");
    expect(material?.confidence).toBeLessThan(0.6);
  });

  it("resolves the nearest preceding section for single-page documents", () => {
    const text = "Interface Requirements\nSee DWG-1000 for details.";
    const doc = singlePageDocument(text, [
      { title: "Interface Requirements", level: 1, startOffset: 0, page: null },
    ]);
    const entities = extractEntities(doc);
    const drawing = entities.find((e) => e.entityType === "DRAWING");
    expect(drawing?.section).toBe("Interface Requirements");
  });

  it("does not resolve a section for multi-page documents", () => {
    const doc: ParsedDocument = {
      fullText: "page one\nDWG-1000",
      pages: [
        { pageNumber: 1, text: "page one" },
        { pageNumber: 2, text: "DWG-1000" },
      ],
      sections: [{ title: "Some Section", level: 1, startOffset: 0, page: null }],
      tables: [],
      metadata: {},
    };
    const entities = extractEntities(doc);
    expect(entities.find((e) => e.entityType === "DRAWING")?.section).toBeNull();
  });

  it("returns no entities for text with no matches", () => {
    expect(extractEntities(singlePageDocument("nothing engineering-related here"))).toEqual([]);
  });
});
