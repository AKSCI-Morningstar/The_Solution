import type { ParsedDocument, ParsedSection } from "../../parsers";
import { REFERENCE_EXTRACTION_RULES } from "../reference-extraction-rules";
import type { ExtractedReferenceDraft } from "../types";

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

/** Detects cross-references (requirement/drawing/part/spec/document/revision tokens) via deterministic regex. */
export function extractReferences(parsedDocument: ParsedDocument): ExtractedReferenceDraft[] {
  const drafts: ExtractedReferenceDraft[] = [];
  const pages =
    parsedDocument.pages.length > 0
      ? parsedDocument.pages
      : [{ pageNumber: 1, text: parsedDocument.fullText }];
  const singlePage = pages.length <= 1;

  for (const page of pages) {
    for (const rule of REFERENCE_EXTRACTION_RULES) {
      for (const match of page.text.matchAll(rule.pattern)) {
        const captured = (match[1] ?? match[0]).trim();
        if (!captured) continue;

        drafts.push({
          referenceType: rule.referenceType,
          rawText: match[0].trim(),
          targetIdentifier: captured.toUpperCase(),
          page: page.pageNumber,
          section: singlePage ? findSectionTitle(parsedDocument.sections, match.index ?? 0) : null,
          confidence: rule.confidence,
          extractionMethod: rule.method,
        });
      }
    }
  }

  return drafts;
}
