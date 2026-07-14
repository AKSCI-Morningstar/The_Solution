import { describe, expect, it } from "vitest";
import { prepareGraphPreview } from "@/server/ingestion/pipeline/stages/graph-preparation";
import type {
  ExtractedEntityDraft,
  ExtractedRelationshipDraft,
} from "@/server/ingestion/pipeline/types";

describe("prepareGraphPreview", () => {
  it("shapes entities and relationships into a preview graph", () => {
    const entities: ExtractedEntityDraft[] = [
      {
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
      },
      {
        localId: "e2",
        entityType: "DRAWING",
        identifier: "DWG-1",
        name: "DWG-1",
        rawText: "DWG-1",
        attributes: null,
        confidence: 0.75,
        page: 1,
        section: null,
        paragraph: null,
        extractionMethod: "regex:drawing-v1",
      },
    ];
    const relationships: ExtractedRelationshipDraft[] = [
      {
        relationshipType: "DEPENDS_ON",
        sourceLocalId: "e1",
        targetLocalId: "e2",
        confidence: 0.6,
        page: 1,
        section: null,
        extractionMethod: "regex:connector-depends-on-v1",
      },
    ];

    const preview = prepareGraphPreview(entities, relationships);
    expect(preview.nodes).toHaveLength(2);
    expect(preview.edges).toEqual([
      { relationshipType: "DEPENDS_ON", sourceLocalId: "e1", targetLocalId: "e2" },
    ]);
  });

  it("produces an empty preview for no entities/relationships", () => {
    expect(prepareGraphPreview([], [])).toEqual({ nodes: [], edges: [] });
  });
});
