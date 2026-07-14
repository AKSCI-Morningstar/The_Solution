import type {
  ExtractedEntityDraft,
  ExtractedReferenceDraft,
  ExtractedRelationshipDraft,
  ValidationIssueDraft,
} from "../types";

export interface ProvenanceAssignmentResult {
  extractedAt: Date;
  issues: ValidationIssueDraft[];
}

function checkConfidence(
  label: string,
  localId: string,
  confidence: number,
  issues: ValidationIssueDraft[],
): void {
  if (confidence < 0 || confidence > 1) {
    issues.push({
      severity: "WARNING",
      code: "EXTRACTION_INCONSISTENCY",
      message: `${label} has an out-of-range confidence value (${confidence})`,
      stage: "PROVENANCE_ASSIGNMENT",
      context: { localId, confidence },
    });
  }
}

/**
 * Stamps a single consistent extraction timestamp across every record
 * produced by this job run (rather than a slightly different `Date.now()`
 * per row at insert time), and performs a final integrity pass over
 * confidence values before persistence.
 */
export function assignProvenance(
  entities: ExtractedEntityDraft[],
  relationships: ExtractedRelationshipDraft[],
  references: ExtractedReferenceDraft[],
): ProvenanceAssignmentResult {
  const issues: ValidationIssueDraft[] = [];
  const extractedAt = new Date();

  for (const entity of entities) {
    checkConfidence(
      `Entity ${entity.identifier ?? entity.name}`,
      entity.localId,
      entity.confidence,
      issues,
    );
  }
  for (const relationship of relationships) {
    checkConfidence(
      `Relationship ${relationship.relationshipType}`,
      `${relationship.sourceLocalId}->${relationship.targetLocalId}`,
      relationship.confidence,
      issues,
    );
  }
  for (const reference of references) {
    checkConfidence(
      `Reference ${reference.targetIdentifier}`,
      reference.targetIdentifier,
      reference.confidence,
      issues,
    );
  }

  return { extractedAt, issues };
}
