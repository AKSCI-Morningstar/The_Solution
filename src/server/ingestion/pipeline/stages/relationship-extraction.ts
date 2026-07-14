import type { ParsedDocument } from "../../parsers";
import { RELATIONSHIP_CONNECTOR_RULES } from "../relationship-extraction-rules";
import type { ExtractedEntityDraft, ExtractedRelationshipDraft } from "../types";

/**
 * Detects relationships via co-occurrence: two already-extracted entities on
 * the same line of text, separated by a known connector phrase ("X depends
 * on Y"). Purely lexical co-occurrence - no inference about whether the
 * relationship actually holds.
 */
export function extractRelationships(
  parsedDocument: ParsedDocument,
  entities: ExtractedEntityDraft[],
): ExtractedRelationshipDraft[] {
  const drafts: ExtractedRelationshipDraft[] = [];
  const pages =
    parsedDocument.pages.length > 0
      ? parsedDocument.pages
      : [{ pageNumber: 1, text: parsedDocument.fullText }];

  for (const page of pages) {
    const pageEntities = entities.filter((e) => e.page === page.pageNumber);
    if (pageEntities.length < 2) continue;

    for (const line of page.text.split("\n")) {
      for (const rule of RELATIONSHIP_CONNECTOR_RULES) {
        const connectorMatch = rule.connector.exec(line);
        if (!connectorMatch) continue;
        const connectorIndex = connectorMatch.index;

        const before = pageEntities.filter((e) => {
          const idx = line.indexOf(e.rawText);
          return idx !== -1 && idx < connectorIndex;
        });
        const after = pageEntities.filter((e) => {
          const idx = line.indexOf(e.rawText);
          return idx !== -1 && idx > connectorIndex;
        });

        for (const source of before) {
          for (const target of after) {
            if (source.localId === target.localId) continue;
            drafts.push({
              relationshipType: rule.relationshipType,
              sourceLocalId: source.localId,
              targetLocalId: target.localId,
              confidence:
                Math.round(Math.min(source.confidence, target.confidence) * 0.9 * 100) / 100,
              page: page.pageNumber,
              section: source.section,
              extractionMethod: rule.method,
            });
          }
        }
      }
    }
  }

  return drafts;
}
