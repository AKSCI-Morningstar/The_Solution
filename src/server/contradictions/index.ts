export {
  CONTRADICTION_TYPES,
  CONTRADICTION_SEVERITIES,
  CONTRADICTION_STATUSES,
  CONTRADICTION_LIFECYCLE_ACTIONS,
  LIFECYCLE_TRANSITIONS,
  CONTRADICTION_TYPE_LABELS,
  CONTRADICTION_SEVERITY_LABELS,
  CONTRADICTION_STATUS_LABELS,
  CONTRADICTION_SEVERITY_COLORS,
  CONTRADICTION_STATUS_COLORS,
  CONTRADICTION_TYPE_DESCRIPTIONS,
} from "./constants";

export type {
  ContradictionType,
  ContradictionSeverity,
  ContradictionStatus,
  ContradictionLifecycleAction,
} from "./constants";

export type {
  ContradictionEvidence,
  ContradictionTraceabilityRecord,
  ContradictionRecord,
  AffectedEntity,
  ContradictionLifecycleEntry,
  ContradictionDetectionResult,
  ContradictionListFilters,
  ContradictionSummary,
} from "./types";

export {
  contradictionTypeSchema,
  contradictionSeveritySchema,
  contradictionStatusSchema,
  contradictionFilterSchema,
  detectContradictionSchema,
  updateContradictionStatusSchema,
  validateLifecycleTransition,
} from "./validation";

export type {
  ContradictionFilterInput,
  DetectContradictionInput,
  UpdateContradictionStatusInput,
} from "./validation";

export { detectContradictions } from "./detection-engine";
export {
  detectAndStoreContradictions,
  listContradictions,
  getContradiction,
  updateContradictionStatus,
  getContradictionSummary,
  getContradictionEvidence,
  getContradictionTraceability,
} from "./contradiction-service";
