export {
  RESOLUTION_STATUSES,
  EVIDENCE_QUALITY,
  EVIDENCE_NODE_TYPES,
  EVIDENCE_RELATION_TYPES,
  CONFLICT_TYPES,
  MISSING_EVIDENCE_TYPES,
  RESOLUTION_STATUS_LABELS,
  EVIDENCE_QUALITY_LABELS,
  EVIDENCE_NODE_TYPE_LABELS,
  EVIDENCE_RELATION_LABELS,
  CONFLICT_TYPE_LABELS,
  MISSING_EVIDENCE_LABELS,
  ENTITY_TYPES_REQUIRING_TESTS,
  ENTITY_TYPES_REQUIRING_CERTIFICATION,
  ENTITY_TYPES_REQUIRING_SPECIFICATION,
  ENTITY_TYPES_REQUIRING_APPROVAL,
  STALE_THRESHOLD_DAYS,
} from "./constants";

export type {
  ResolutionStatus,
  EvidenceQuality,
  EvidenceNodeType,
  EvidenceRelationType,
  ConflictType,
  MissingEvidenceType,
} from "./constants";

export type {
  EvidenceNode,
  EvidenceEdge,
  EvidenceGraph,
  SourceReference,
  EvidenceChainLink,
  EvidenceChain,
  Conflict,
  MissingEvidence,
  EvidenceQualityIndicator,
  EvidenceSummary,
  TraceabilityRecord,
  TraceabilityGraph,
  ResolutionResult,
  EvaluationInput,
} from "./types";

export {
  evaluationInputSchema,
  traceabilityFilterSchema,
  conflictFilterSchema,
  missingEvidenceFilterSchema,
} from "./validation";

export type {
  EvaluationInput as ValidationEvaluationInput,
  TraceabilityFilterInput,
  ConflictFilterInput,
  MissingEvidenceFilterInput,
} from "./validation";

export { buildEvidenceGraph, getSupportingNodes, getConflictingNodes } from "./evidence-graph";
export { buildEvidenceChains, getChainRelations } from "./evidence-chain";
export { detectConflicts } from "./conflict-detector";
export { detectMissingEvidence } from "./missing-evidence-detector";
export { buildTraceabilityGraph } from "./traceability-builder";
export { evaluateEvidence } from "./resolution-engine";
