import type {
  ResolutionStatus,
  EvidenceQuality,
  EvidenceNodeType,
  EvidenceRelationType,
  ConflictType,
  MissingEvidenceType,
} from "./constants";

export interface EvidenceNode {
  id: string;
  type: EvidenceNodeType;
  label: string;
  entityId?: string;
  entityType?: string;
  status?: string;
  version?: string;
  documentId?: string;
  documentName?: string;
  documentVersion?: number;
  page?: number;
  section?: string;
  extractionMethod?: string;
  confidence?: number;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: EvidenceRelationType;
  metadata?: Record<string, unknown>;
}

export interface EvidenceGraph {
  nodes: Map<string, EvidenceNode>;
  edges: EvidenceEdge[];
  rootId: string;
}

export interface SourceReference {
  documentId: string;
  documentName: string;
  documentVersion: number;
  page?: number;
  section?: string;
  extractionMethod?: string;
}

export interface EvidenceChainLink {
  nodeId: string;
  node: EvidenceNode;
  relationType: EvidenceRelationType;
  sourceReferences: SourceReference[];
  depth: number;
}

export interface EvidenceChain {
  rootId: string;
  links: EvidenceChainLink[];
  totalDepth: number;
}

export interface Conflict {
  id: string;
  type: ConflictType;
  label: string;
  description: string;
  nodeIds: string[];
  entityId?: string;
  entityType?: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  detectedAt: string;
}

export interface MissingEvidence {
  id: string;
  type: MissingEvidenceType;
  label: string;
  description: string;
  entityId?: string;
  entityType?: string;
  requiredRelationshipType?: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
}

export interface EvidenceQualityIndicator {
  totalNodes: number;
  supportingNodes: number;
  conflictingNodes: number;
  missingNodes: number;
  hasDocumentProvenance: boolean;
  hasVersionInfo: boolean;
  hasPageReferences: boolean;
  hasExtractionSource: boolean;
  quality: EvidenceQuality;
}

export interface EvidenceSummary {
  totalEvidence: number;
  supportingEvidence: number;
  conflictingEvidence: number;
  missingEvidence: number;
  uniqueDocuments: number;
  uniqueEntities: number;
  oldestEvidence: string | null;
  newestEvidence: string | null;
}

export interface TraceabilityRecord {
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
  organizationId: string;
  timestamp: string;
}

export interface TraceabilityGraph {
  rootEntityId: string;
  records: TraceabilityRecord[];
  totalRecords: number;
}

export interface ResolutionResult {
  status: ResolutionStatus;
  subjectId: string;
  subjectLabel: string;
  supportingEvidence: EvidenceNode[];
  conflictingEvidence: EvidenceNode[];
  missingEvidence: MissingEvidence[];
  evidenceChains: EvidenceChain[];
  traceabilityGraph: TraceabilityGraph;
  conflicts: Conflict[];
  qualityIndicators: EvidenceQualityIndicator;
  summary: EvidenceSummary;
  resolvedAt: string;
}

export interface EvaluationInput {
  entityId: string;
  relationshipTypes?: string[];
  maxDepth?: number;
}
