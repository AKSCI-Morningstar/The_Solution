import type { AssessmentOutcome } from "./constants";

/** The shared context object threaded through all 10 pipeline stages, built up incrementally via each stage's patch. */
export interface PipelineContext {
  organizationId: string;
  triggeredById?: string;
  subjectEntityId: string;
  requestedRuleIds?: string[];
  maxDepth: number;

  // Populated by stage 1
  subjectEntity?: {
    id: string;
    entityType: string;
    identifier: string;
    name: string;
    status: string;
  };

  // Populated by stage 3
  loadedEntityIds?: string[];

  // Populated by stage 4
  graphRelationshipCount?: number;
  graphNodeFound?: boolean;

  // Populated by stage 5
  evidenceGraphSize?: number;
  supportingEvidenceCount?: number;
  missingEvidence?: string[];
  conflictingEvidence?: { type: string; label: string; description: string }[];

  // Populated by stage 6
  ruleIdsEvaluated?: string[];
  ruleResults?: { ruleId: string; outcome: string; resultId: string }[];

  // Populated by stage 7
  contradictionIds?: string[];
  contradictionCount?: number;

  // Populated by stage 8
  traceabilityRecordCount?: number;
  traceabilityRecords?: { entityId: string; entityName: string; relationshipPath: string[] }[];

  // Populated by stage 9
  aggregate?: AggregateResult;

  // Populated by stage 10
  assessment?: EngineeringAssessment;
}

export interface AggregateResult {
  missingEvidenceCount: number;
  conflictingEvidenceCount: number;
  ruleOutcomeCounts: Record<string, number>;
  hasUnpassedRule: boolean;
  hasFailedRule: boolean;
  openContradictionCount: number;
  traceabilityRecordCount: number;
}

export interface EngineeringAssessment {
  outcome: AssessmentOutcome;
  reasoning: string;
  missingEvidence: string[];
  conflictingEvidence: { type: string; label: string; description: string }[];
}
