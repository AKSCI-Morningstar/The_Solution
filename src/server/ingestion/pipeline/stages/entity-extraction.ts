import { randomUUID } from "node:crypto";
import type { ParsedDocument, ParsedSection } from "../../parsers";
import { ENTITY_EXTRACTION_RULES } from "../entity-extraction-rules";
import type { ExtractedEntityDraft } from "../types";

function findSectionTitle(sections: ParsedSection[], matchIndex: number): string | null {
  let title: string | null = null;
  for (const section of sections) {
    if (section.startOffset <= matchIndex) {
      title = section.title;
    } else {
      break;
    }
  }
  return title;
}

/**
 * Applies the deterministic entity-extraction rule set to every page of the
 * parsed document. Section resolution only applies to single-page formats
 * (txt/md/csv/docx) where fullText offsets line up with page text 1:1;
 * multi-page formats (PDF) get page-level provenance without a section.
 */
export function extractEntities(parsedDocument: ParsedDocument): ExtractedEntityDraft[] {
  const drafts: ExtractedEntityDraft[] = [];
  const pages =
    parsedDocument.pages.length > 0
      ? parsedDocument.pages
      : [{ pageNumber: 1, text: parsedDocument.fullText }];
  const singlePage = pages.length <= 1;

  for (const page of pages) {
    for (const rule of ENTITY_EXTRACTION_RULES) {
      for (const match of page.text.matchAll(rule.pattern)) {
        const captured = (match[1] ?? match[0]).trim();
        if (!captured) continue;

        drafts.push({
          localId: randomUUID(),
          entityType: rule.entityType,
          identifier: captured.toUpperCase(),
          name: captured,
          rawText: match[0].trim(),
          attributes: null,
          confidence: rule.confidence,
          page: page.pageNumber,
          section: singlePage ? findSectionTitle(parsedDocument.sections, match.index ?? 0) : null,
          paragraph: null,
          extractionMethod: rule.method,
        });
      }
    }
  }

  return drafts;
}
