import type { EntityType, RelationshipType } from "@/server/engineering/constants";

/** Plain-data view of an EngineeringEntity the condition evaluator operates on - no Prisma types, no I/O. */
export interface SubjectEntity {
  id: string;
  entityType: EntityType | string;
  identifier: string;
  name: string;
  status: string;
  metadata: Record<string, unknown> | null;
  tags: string[] | null;
  labels: Record<string, string> | null;
}

export interface RelationshipEdge {
  relationshipType: RelationshipType | string;
  sourceEntityId: string;
  targetEntityId: string;
}

/**
 * All data a rule's condition tree might need, pre-fetched by the caller.
 * The evaluator never performs I/O - this is what keeps it deterministic,
 * synchronous, and trivially unit-testable.
 */
export interface EvaluationContext {
  relationships: RelationshipEdge[];
  entitiesById: Record<string, SubjectEntity>;
  /** Fragment id -> the fragment's resolved condition tree. */
  fragments: Record<string, import("../condition-types").RuleCondition>;
}

export interface EvaluationFocus {
  subject: SubjectEntity;
  /** Only set while evaluating a relationshipCheck's targetCondition against one specific related entity. */
  related?: SubjectEntity;
}

export interface TraceNode {
  type: string;
  description: string;
  result: boolean;
  children?: TraceNode[];
  detail?: Record<string, unknown>;
}

export interface ConditionEvaluation {
  result: boolean;
  missingFields: string[];
  trace: TraceNode;
}
