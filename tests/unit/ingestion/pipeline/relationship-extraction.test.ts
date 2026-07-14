import { describe, expect, it } from "vitest";
import { extractEntities } from "@/server/ingestion/pipeline/stages/entity-extraction";
import { extractRelationships } from "@/server/ingestion/pipeline/stages/relationship-extraction";
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

describe("extractRelationships", () => {
  it("detects a relationship between two entities connected by a known phrase", () => {
    const doc = singlePageDocument("P/N: ABC-123 depends on P/N: XYZ-999.");
    const entities = extractEntities(doc);
    const relationships = extractRelationships(doc, entities);

    expect(relationships).toHaveLength(1);
    expect(relationships[0].relationshipType).toBe("DEPENDS_ON");
  });

  it("does not link entities on different lines", () => {
    const doc = singlePageDocument(
      "P/N: ABC-123 is listed here.\nP/N: XYZ-999 depends on something else.",
    );
    const entities = extractEntities(doc);
    const relationships = extractRelationships(doc, entities);
    expect(relationships.every((r) => r.sourceLocalId !== r.targetLocalId)).toBe(true);
  });

  it("produces no relationships when fewer than two entities are found on a page", () => {
    const doc = singlePageDocument("P/N: ABC-123 depends on nothing extractable.");
    const entities = extractEntities(doc);
    expect(extractRelationships(doc, entities)).toEqual([]);
  });
});
