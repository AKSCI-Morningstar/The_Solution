export type PrecedentType = "FAILURE" | "SUCCESSFUL_DESIGN" | "REGULATORY_PRECEDENT" | "SUPPLIER_HISTORY";

export interface Precedent {
  id: string;
  organizationId: string;
  title: string;
  summary: string | null;
  engineeringQuestion: string | null;
  decisionMade: string | null;
  supportingEvidence: string[];
  contradictions: string[];
  missingEvidence: string[];
  outcome: string | null;
  lessonsLearned: string[];
  relatedProjects: string[];
  relatedSuppliers: string[];
  relatedRequirements: string[];
  relatedDocuments: string[];
  relatedComponents: string[];
  relatedStandards: string[];
  relatedCertifications: string[];
  decisionDate: string | null;
  decisionOwner: string | null;
  confidence: number;
  tags: string[];
  organization: string | null;
  version: number;
  sourceEntityId: string | null;
  sourceAssessmentId: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PrecedentVersion {
  id: string;
  precedentId: string;
  version: number;
  snapshot: string;
  changeDescription: string | null;
  createdById: string | null;
  createdAt: string;
}

export interface MatchedPrecedent extends Precedent {
  similarityScore: number;
  matchReasons: string[];
}

export interface PrecedentCreateInput {
  title: string;
  summary?: string;
  engineeringQuestion?: string;
  decisionMade?: string;
  supportingEvidence?: string[];
  contradictions?: string[];
  missingEvidence?: string[];
  outcome?: string;
  lessonsLearned?: string[];
  relatedProjects?: string[];
  relatedSuppliers?: string[];
  relatedRequirements?: string[];
  relatedDocuments?: string[];
  relatedComponents?: string[];
  relatedStandards?: string[];
  relatedCertifications?: string[];
  decisionDate?: string;
  decisionOwner?: string;
  confidence?: number;
  tags?: string[];
  organization?: string;
  sourceEntityId?: string;
  sourceAssessmentId?: string;
}

export interface PrecedentUpdateInput extends Partial<PrecedentCreateInput> {
  id: string;
}

export interface PrecedentFilter {
  search?: string;
  supplier?: string;
  requirement?: string;
  component?: string;
  project?: string;
  certification?: string;
  standard?: string;
  dateFrom?: string;
  dateTo?: string;
  decisionOwner?: string;
  tags?: string[];
  confidenceMin?: number;
  confidenceMax?: number;
  organizationId?: string;
  includeDeleted?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PrecedentMatchContext {
  suppliers?: string[];
  components?: string[];
  requirements?: string[];
  standards?: string[];
  certifications?: string[];
  documents?: string[];
  contradictions?: string[];
  evidence?: string[];
  tags?: string[];
  project?: string;
  question?: string;
}

export interface PrecedentSearchResult {
  data: MatchedPrecedent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
