import type { RealityOutcome } from "./constants";

/** The shared context object threaded through all 8 pipeline stages, built up incrementally via each stage's patch. */
export interface RealityPipelineContext {
  organizationId: string;
  triggeredById?: string;
  subjectEntityId: string;
  orchestrationRunId: string;

  // Populated by stage 1 - the source Orchestration Run's already-persisted outputs, consumed
  // verbatim rather than recomputed.
  orchestrationOutcome?: string;
  orchestrationRuleResultIds?: string[];
  orchestrationContradictionIds?: string[];
  orchestrationEvidenceSummary?: {
    evidenceGraphSize: number;
    supportingEvidenceCount: number;
    missingEvidence: string[];
    conflictingEvidence: unknown[];
  };
  orchestrationTraceabilitySummary?: { recordCount: number };

  // Populated by stage 2
  entitiesEvaluated?: string[];

  // Populated by stage 3 (pass-through, kept as its own stage per the mission's suggested order)
  evidenceSummary?: {
    evidenceGraphSize: number;
    supportingEvidenceCount: number;
    missingEvidenceCount: number;
    conflictingEvidenceCount: number;
  };

  // Populated by stage 4 - current, re-read rule outcomes (not re-executed)
  ruleSummary?: { ruleId: string; outcome: string }[];

  // Populated by stage 5 - current contradiction status (not re-detected)
  contradictionSummary?: { id: string; status: string; severity: string; open: boolean }[];
  openContradictionCount?: number;

  // Populated by stage 6 (pass-through)
  traceabilityRecordCount?: number;

  // Populated by stage 7
  ingestionCompleteness?: {
    totalJobsChecked: number;
    pendingJobCount: number;
    failedJobCount: number;
    allComplete: boolean;
  };

  // Populated by stage 8
  assessment?: RealityAssessmentResult;
}

export interface RealityAssessmentResult {
  outcome: RealityOutcome;
  reasoning: string;
}
