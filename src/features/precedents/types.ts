export type PrecedentType =
  "FAILURE" | "SUCCESSFUL_DESIGN" | "REGULATORY_PRECEDENT" | "SUPPLIER_HISTORY";

export interface EngineeringPrecedent {
  id: string;
  organizationId: string;
  title: string;
  summary: string;
  engineeringQuestion: string;
  decisionMade: string;
  supportingEvidence?: unknown;
  contradictions?: unknown;
  missingEvidence?: unknown;
  outcome: string;
  lessonsLearned: string;
  relatedProjects: string[];
  relatedSuppliers: string[];
  relatedRequirements: string[];
  relatedDocuments: string[];
  relatedComponents: string[];
  relatedStandards: string[];
  relatedCertifications: string[];
  decisionDate: string;
  decisionOwnerId?: string | null;
  decisionOwnerName?: string | null;
  confidence: number;
  tags: string[];
  auditMetadata?: unknown;
  createdAt: string;
  updatedAt: string;

  // Query-time dynamic similarity metrics
  similarityScore?: number;
  similarityExplanation?: string;
  whyRelevant?: string; // For backward compatibility with legacy searches
  versionHistory?: { id: string; version: string; description: string; createdAt: string }[];
  auditTrail?: { id: string; action: string; metadata: unknown; createdAt: string }[];
}

export interface PrecedentQuery {
  type?: PrecedentType | "ALL";
  search?: string;
  system?: string;
  organizationId?: string;
}
