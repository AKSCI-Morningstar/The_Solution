export type PrecedentType = "FAILURE" | "SUCCESSFUL_DESIGN" | "REGULATORY_PRECEDENT" | "SUPPLIER_HISTORY";

export interface EngineeringPrecedent {
  id: string;
  title: string;
  type: PrecedentType;
  description: string;
  rootCause?: string;
  correctiveAction?: string;
  resolutionStatus: string; // e.g. "RESOLVED", "MITIGATED", "MONITORED"
  confidenceScore: number;
  applicableSystems: string[];
  evidenceMetadata?: {
    documents?: string[];
    standards?: string[];
    testReports?: string[];
  };
  createdAt: string;
  updatedAt: string;

  // Rich explainability and integration fields
  whyRelevant?: string;
  evidenceStrength?: number;
  linkedEntities?: { id: string; name: string; type: string; identifier: string }[];
  relatedRequirements?: string[];
  relatedSuppliers?: string[];
  relatedFailures?: string[];
  relatedCorrectiveActions?: string[];
  engineeringStandards?: string[];
  graphRelationshipsTraversed?: string[];
  rulesEvaluated?: string[];
  assumptionsRejected?: string[];
  versionHistory?: { id: string; version: string; description: string; createdAt: string }[];
  auditTrail?: { id: string; action: string; metadata: unknown; createdAt: string }[];
}

export interface PrecedentQuery {
  type?: PrecedentType;
  search?: string;
  system?: string;
}

