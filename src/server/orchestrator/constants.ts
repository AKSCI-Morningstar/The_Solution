export const RUN_STATUSES = ["QUEUED", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

export const STAGE_STATUSES = [
  "PENDING",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
  "SKIPPED",
  "RETRYING",
] as const;
export type StageStatus = (typeof STAGE_STATUSES)[number];

/** Fixed, deterministic 10-stage evaluation order - see docs/engineering-reasoning-orchestrator.md. */
export const STAGE_NAMES = [
  "VALIDATE_REQUEST",
  "RESOLVE_ORGANIZATION_CONTEXT",
  "LOAD_ENGINEERING_OBJECTS",
  "RETRIEVE_GRAPH_RELATIONSHIPS",
  "RESOLVE_SUPPORTING_EVIDENCE",
  "EXECUTE_RULE_ENGINE",
  "EXECUTE_CONTRADICTION_ENGINE",
  "EVALUATE_TRACEABILITY",
  "AGGREGATE_RESULTS",
  "PRODUCE_ASSESSMENT",
] as const;
export type StageName = (typeof STAGE_NAMES)[number];

/** Reuses the Rule Engine's exact outcome vocabulary - the Orchestrator aggregates rule outcomes plus evidence/contradiction signals into the same five-way judgment. */
export const ASSESSMENT_OUTCOMES = [
  "PASSED",
  "FAILED",
  "NEEDS_REVIEW",
  "BLOCKED",
  "INSUFFICIENT_EVIDENCE",
] as const;
export type AssessmentOutcome = (typeof ASSESSMENT_OUTCOMES)[number];

export const ORCHESTRATION_AUDIT_ACTIONS = [
  "ORCHESTRATION_STARTED",
  "ORCHESTRATION_COMPLETED",
  "ORCHESTRATION_FAILED",
  "ORCHESTRATION_CANCELLED",
  "ORCHESTRATION_STAGE_RETRIED",
] as const;
export type OrchestrationAuditAction = (typeof ORCHESTRATION_AUDIT_ACTIONS)[number];

/** Default retry policy for a stage that fails transiently (e.g. a momentary DB error) - not used for deterministic logic errors, which never succeed on retry. */
export const DEFAULT_STAGE_RETRY = { maxAttempts: 2, backoffMs: 250 } as const;

/** Default per-stage timeout - generous enough for a large graph traversal, tight enough to fail fast on a hang. */
export const DEFAULT_STAGE_TIMEOUT_MS = 30_000;
