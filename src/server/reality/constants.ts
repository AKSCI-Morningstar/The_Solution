export const REALITY_RUN_STATUSES = [
  "QUEUED",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
] as const;
export type RealityRunStatus = (typeof REALITY_RUN_STATUSES)[number];

export const REALITY_STAGE_STATUSES = [
  "PENDING",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
  "SKIPPED",
  "RETRYING",
] as const;
export type RealityStageStatus = (typeof REALITY_STAGE_STATUSES)[number];

/** Fixed, deterministic 8-stage assessment order - see docs/engineering-reality-engine.md. */
export const REALITY_STAGE_NAMES = [
  "LOAD_ENGINEERING_CONTEXT",
  "RESOLVE_DEPENDENCIES",
  "GATHER_EVIDENCE",
  "EXECUTE_RULE_EVALUATIONS",
  "EVALUATE_CONTRADICTIONS",
  "EVALUATE_TRACEABILITY",
  "ASSESS_EVIDENCE_COMPLETENESS",
  "PRODUCE_REALITY_ASSESSMENT",
] as const;
export type RealityStageName = (typeof REALITY_STAGE_NAMES)[number];

/**
 * Six-way outcome vocabulary, distinct from (and more granular than) the
 * Orchestrator's five-way outcome vocabulary - Reality reinterprets an
 * Orchestration Run's outcome in light of two additional signals the
 * Orchestrator does not check: whether associated contradictions have since
 * been resolved or reopened, and whether the Ingestion Pipeline has finished
 * processing every source document for the entities in scope.
 */
export const REALITY_OUTCOMES = [
  "VERIFIED",
  "CONDITIONALLY_VERIFIED",
  "CONTRADICTED",
  "INCOMPLETE",
  "NEEDS_REVIEW",
  "INSUFFICIENT_EVIDENCE",
] as const;
export type RealityOutcome = (typeof REALITY_OUTCOMES)[number];

export const OPEN_CONTRADICTION_STATUSES = ["DETECTED", "UNDER_REVIEW"] as const;

export const REALITY_AUDIT_ACTIONS = [
  "REALITY_ASSESSMENT_STARTED",
  "REALITY_ASSESSMENT_COMPLETED",
  "REALITY_ASSESSMENT_FAILED",
  "REALITY_ASSESSMENT_CANCELLED",
] as const;
export type RealityAuditAction = (typeof REALITY_AUDIT_ACTIONS)[number];

/** Default retry policy for a stage that fails transiently - not used for deterministic logic errors, which never succeed on retry. */
export const DEFAULT_REALITY_STAGE_RETRY = { maxAttempts: 2, backoffMs: 250 } as const;

/** Default per-stage timeout. */
export const DEFAULT_REALITY_STAGE_TIMEOUT_MS = 30_000;
