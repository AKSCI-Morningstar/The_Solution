import type {
  ContradictionType,
  ContradictionSeverity,
  ContradictionStatus,
  ContradictionLifecycleAction,
} from "./constants";

export interface ContradictionEvidence {
  nodeId: string;
  label: string;
  entityType?: string;
  status?: string;
  version?: string;
  documentId?: string;
  documentName?: string;
  documentVersion?: number;
  page?: number;
  section?: string;
  extractionMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContradictionTraceabilityRecord {
  entityId: string;
  entityName: string;
  entityType: string;
  entityIdentifier: string;
  entityVersion: string;
  entityStatus: string;
  documentId?: string;
  documentName?: string;
  documentVersion?: number;
  page?: number;
  section?: string;
  relationshipPath: string[];
  extractionMethod?: string;
  timestamp: string;
}

export interface ContradictionRecord {
  id: string;
  organizationId: string;
  type: ContradictionType;
  severity: ContradictionSeverity;
  status: ContradictionStatus;
  label: string;
  description: string;
  sourceEntityIds: string[];
  sourceDocumentIds: string[];
  supportingEvidence: ContradictionEvidence[];
  conflictingEvidence: ContradictionEvidence[];
  traceabilityChain: ContradictionTraceabilityRecord[];
  affectedEntities: AffectedEntity[];
  detectedAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  detectedById?: string;
  resolvedById?: string;
}

export interface AffectedEntity {
  entityId: string;
  entityName: string;
  entityType: string;
  entityIdentifier: string;
  relationship: string;
}

export interface ContradictionLifecycleEntry {
  id: string;
  contradictionId: string;
  action: ContradictionLifecycleAction;
  fromStatus: string | null;
  toStatus: string;
  metadata?: Record<string, unknown>;
  performedById?: string;
  createdAt: string;
}

export interface ContradictionDetectionResult {
  contradictions: ContradictionRecord[];
  totalDetected: number;
  insufficientEvidenceCount: number;
  detectedAt: string;
}

export interface ContradictionListFilters {
  type?: ContradictionType;
  severity?: ContradictionSeverity;
  status?: ContradictionStatus;
  entityId?: string;
  search?: string;
  page: number;
  pageSize: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface ContradictionSummary {
  total: number;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  criticalCount: number;
  unresolvedCount: number;
}
