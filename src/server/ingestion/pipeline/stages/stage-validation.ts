import type { ParsedDocument } from "../../parsers";
import type { ExtractedEntityDraft, ExtractedReferenceDraft, ValidationIssueDraft } from "../types";

export interface ExtractionValidationInput {
  parsedDocument: ParsedDocument;
  entities: ExtractedEntityDraft[];
  references: ExtractedReferenceDraft[];
}

/**
 * Detects malformed/unsupported input (already caught earlier but re-checked
 * here for completeness), duplicate entities within this extraction batch,
 * references that don't resolve to anything extracted from this same
 * document, and missing content.
 */
export function validateExtraction(input: ExtractionValidationInput): ValidationIssueDraft[] {
  const issues: ValidationIssueDraft[] = [];

  if (input.parsedDocument.fullText.trim().length === 0) {
    issues.push({
      severity: "WARNING",
      code: "MISSING_METADATA",
      message: "No extractable text content was found in this document",
      stage: "VALIDATION",
    });
  }

  const occurrences = new Map<string, number>();
  for (const entity of input.entities) {
    if (!entity.identifier) continue;
    const key = `${entity.entityType}:${entity.identifier}`;
    occurrences.set(key, (occurrences.get(key) ?? 0) + 1);
  }
  for (const [key, count] of occurrences) {
    if (count > 1) {
      issues.push({
        severity: "INFO",
        code: "DUPLICATE_ENTITY",
        message: `Entity ${key} was extracted ${count} times from this document`,
        stage: "VALIDATION",
        context: { key, count },
      });
    }
  }

  const entityIdentifiers = new Set(
    input.entities.map((entity) => entity.identifier).filter((id): id is string => id !== null),
  );
  for (const reference of input.references) {
    if (!entityIdentifiers.has(reference.targetIdentifier)) {
      issues.push({
        severity: "WARNING",
        code: "BROKEN_REFERENCE",
        message: `Reference to "${reference.targetIdentifier}" does not resolve to any entity extracted from this document (it may be defined elsewhere)`,
        stage: "VALIDATION",
        context: {
          targetIdentifier: reference.targetIdentifier,
          referenceType: reference.referenceType,
        },
      });
    }
  }

  return issues;
}
