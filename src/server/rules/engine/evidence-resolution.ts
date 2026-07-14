import type { SubjectEntity } from "./types";

/** Plain-data view of an ExtractedEntity row soft-linked to a subject by (organizationId, entityType, identifier). */
export interface ExtractionRecord {
  id: string;
  documentId: string;
  documentVersionId: string;
  page: number | null;
  section: string | null;
  attributes: Record<string, unknown> | null;
  confidence: number;
}

export interface SupportingDocumentRef {
  extractedEntityId: string;
  documentId: string;
  documentVersionId: string;
  page: number | null;
  section: string | null;
  confidence: number;
}

export interface ConflictingEvidenceItem {
  attribute: string;
  canonicalValue: unknown;
  extractedValue: unknown;
  extractedEntityId: string;
  documentId: string;
}

export interface EvidenceResolutionResult {
  supportingDocumentRefs: SupportingDocumentRef[];
  conflictingEvidence: ConflictingEvidenceItem[];
}

/**
 * Resolves supporting documents and attribute conflicts for a subject entity
 * from its soft-linked extraction records (no fabrication - only compares
 * values that are actually present on both sides; a key missing from one
 * side is absence of data, not a conflict).
 */
export function resolveEvidence(
  subject: SubjectEntity,
  matchingExtractions: ExtractionRecord[],
): EvidenceResolutionResult {
  const supportingDocumentRefs: SupportingDocumentRef[] = matchingExtractions.map((extraction) => ({
    extractedEntityId: extraction.id,
    documentId: extraction.documentId,
    documentVersionId: extraction.documentVersionId,
    page: extraction.page,
    section: extraction.section,
    confidence: extraction.confidence,
  }));

  const conflictingEvidence: ConflictingEvidenceItem[] = [];
  const canonicalMetadata = subject.metadata ?? {};

  for (const extraction of matchingExtractions) {
    if (!extraction.attributes) continue;
    for (const [key, extractedValue] of Object.entries(extraction.attributes)) {
      if (!(key in canonicalMetadata)) continue;
      const canonicalValue = canonicalMetadata[key];
      if (!valuesMatch(canonicalValue, extractedValue)) {
        conflictingEvidence.push({
          attribute: key,
          canonicalValue,
          extractedValue,
          extractedEntityId: extraction.id,
          documentId: extraction.documentId,
        });
      }
    }
  }

  return { supportingDocumentRefs, conflictingEvidence };
}

function valuesMatch(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a === "string" && typeof b === "string") {
    return a.trim().toLowerCase() === b.trim().toLowerCase();
  }
  return false;
}
