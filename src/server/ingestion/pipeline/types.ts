import type { EntityType, RelationshipType } from "@/server/engineering/constants";
import type {
  DocumentType,
  PipelineStageName,
  ReferenceType,
  ValidationIssueCode,
  ValidationSeverity,
} from "../constants";

export interface ExtractedEntityDraft {
  localId: string;
  entityType: EntityType;
  identifier: string | null;
  name: string;
  rawText: string;
  attributes: Record<string, unknown> | null;
  confidence: number;
  page: number | null;
  section: string | null;
  paragraph: number | null;
  extractionMethod: string;
}

export interface ExtractedRelationshipDraft {
  relationshipType: RelationshipType;
  sourceLocalId: string;
  targetLocalId: string;
  confidence: number;
  page: number | null;
  section: string | null;
  extractionMethod: string;
}

export interface ExtractedReferenceDraft {
  referenceType: ReferenceType;
  rawText: string;
  targetIdentifier: string;
  page: number | null;
  section: string | null;
  confidence: number;
  extractionMethod: string;
}

export interface ValidationIssueDraft {
  severity: ValidationSeverity;
  code: ValidationIssueCode;
  message: string;
  stage: PipelineStageName;
  context?: Record<string, unknown>;
}

export interface ProvenanceBase {
  organizationId: string;
  jobId: string;
  documentId: string;
  documentVersionId: string;
  parserVersion: string;
}

export interface StageTiming {
  stageName: PipelineStageName;
  stageIndex: number;
  status: "SUCCEEDED" | "FAILED" | "SKIPPED";
  startedAt: Date;
  completedAt: Date | null;
  durationMs: number | null;
  errorMessage: string | null;
  metadata?: Record<string, unknown>;
}

export interface GraphPreviewNode {
  localId: string;
  entityType: EntityType;
  label: string;
}

export interface GraphPreviewEdge {
  relationshipType: RelationshipType;
  sourceLocalId: string;
  targetLocalId: string;
}

export interface GraphPreview {
  nodes: GraphPreviewNode[];
  edges: GraphPreviewEdge[];
}

export interface PipelineResult {
  documentType: DocumentType;
  parserName: string;
  parserVersion: string;
  metadata: Record<string, unknown>;
  entities: ExtractedEntityDraft[];
  relationships: ExtractedRelationshipDraft[];
  references: ExtractedReferenceDraft[];
  issues: ValidationIssueDraft[];
  graphPreview: GraphPreview;
  stageTimings: StageTiming[];
}
