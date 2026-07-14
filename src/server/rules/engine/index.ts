export { evaluateCondition, collectMatchedEntityIds } from "./evaluate-condition";
export { resolveEvidence } from "./evidence-resolution";
export type {
  ExtractionRecord,
  SupportingDocumentRef,
  ConflictingEvidenceItem,
  EvidenceResolutionResult,
} from "./evidence-resolution";
export { detectCycle, topologicalOrder, CircularDependencyError } from "./dependency-graph";
export type { DependencyEdge, CycleDetectionResult } from "./dependency-graph";
export type {
  SubjectEntity,
  RelationshipEdge,
  EvaluationContext,
  EvaluationFocus,
  TraceNode,
  ConditionEvaluation,
} from "./types";
