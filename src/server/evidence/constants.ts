export const RESOLUTION_STATUSES = [
  "SUFFICIENT",
  "INSUFFICIENT",
  "CONFLICTING",
  "INCOMPLETE",
  "VERIFIED",
  "NEEDS_REVIEW",
] as const;

export type ResolutionStatus = (typeof RESOLUTION_STATUSES)[number];

export const EVIDENCE_QUALITY = [
  "COMPLETE",
  "INCOMPLETE",
  "CONFLICTING",
  "OUTDATED",
  "VERIFIED",
  "NEEDS_REVIEW",
] as const;

export type EvidenceQuality = (typeof EVIDENCE_QUALITY)[number];

export const EVIDENCE_NODE_TYPES = [
  "ENTITY",
  "RELATIONSHIP",
  "DOCUMENT",
  "EXTRACTED_FACT",
  "REQUIREMENT",
  "SPECIFICATION",
  "TEST",
  "STANDARD",
  "CERTIFICATION",
  "SUPPLIER",
  "ENGINEERING_CHANGE",
] as const;

export type EvidenceNodeType = (typeof EVIDENCE_NODE_TYPES)[number];

export const EVIDENCE_RELATION_TYPES = [
  "SUPPORTS",
  "CONTRADICTS",
  "REFERENCES",
  "DERIVES_FROM",
  "VERIFIES",
  "SUPERSEDES",
  "DUPLICATE_OF",
  "OUTDATED_BY",
] as const;

export type EvidenceRelationType = (typeof EVIDENCE_RELATION_TYPES)[number];

export const CONFLICT_TYPES = [
  "CONFLICTING_SPECIFICATION",
  "CONFLICTING_REQUIREMENT",
  "CONFLICTING_MATERIAL",
  "CONFLICTING_SUPPLIER",
  "CONFLICTING_STANDARD",
  "OUTDATED_EVIDENCE",
  "DUPLICATE_EVIDENCE",
  "BROKEN_REFERENCE",
] as const;

export type ConflictType = (typeof CONFLICT_TYPES)[number];

export const MISSING_EVIDENCE_TYPES = [
  "MISSING_TEST",
  "MISSING_CERTIFICATION",
  "MISSING_SPECIFICATION",
  "MISSING_TRACEABILITY",
  "MISSING_APPROVAL",
  "MISSING_REFERENCE",
] as const;

export type MissingEvidenceType = (typeof MISSING_EVIDENCE_TYPES)[number];

export const RESOLUTION_STATUS_LABELS: Record<string, string> = {
  SUFFICIENT: "Sufficient Evidence",
  INSUFFICIENT: "Insufficient Evidence",
  CONFLICTING: "Conflicting Evidence",
  INCOMPLETE: "Incomplete Evidence",
  VERIFIED: "Verified",
  NEEDS_REVIEW: "Needs Review",
};

export const EVIDENCE_QUALITY_LABELS: Record<string, string> = {
  COMPLETE: "Complete",
  INCOMPLETE: "Incomplete",
  CONFLICTING: "Conflicting",
  OUTDATED: "Outdated",
  VERIFIED: "Verified",
  NEEDS_REVIEW: "Needs Review",
};

export const EVIDENCE_NODE_TYPE_LABELS: Record<string, string> = {
  ENTITY: "Entity",
  RELATIONSHIP: "Relationship",
  DOCUMENT: "Document",
  EXTRACTED_FACT: "Extracted Fact",
  REQUIREMENT: "Requirement",
  SPECIFICATION: "Specification",
  TEST: "Test",
  STANDARD: "Standard",
  CERTIFICATION: "Certification",
  SUPPLIER: "Supplier",
  ENGINEERING_CHANGE: "Engineering Change",
};

export const EVIDENCE_RELATION_LABELS: Record<string, string> = {
  SUPPORTS: "Supports",
  CONTRADICTS: "Contradicts",
  REFERENCES: "References",
  DERIVES_FROM: "Derives From",
  VERIFIES: "Verifies",
  SUPERSEDES: "Supersedes",
  DUPLICATE_OF: "Duplicate Of",
  OUTDATED_BY: "Outdated By",
};

export const CONFLICT_TYPE_LABELS: Record<string, string> = {
  CONFLICTING_SPECIFICATION: "Conflicting Specification",
  CONFLICTING_REQUIREMENT: "Conflicting Requirement",
  CONFLICTING_MATERIAL: "Conflicting Material",
  CONFLICTING_SUPPLIER: "Conflicting Supplier",
  CONFLICTING_STANDARD: "Conflicting Standard",
  OUTDATED_EVIDENCE: "Outdated Evidence",
  DUPLICATE_EVIDENCE: "Duplicate Evidence",
  BROKEN_REFERENCE: "Broken Reference",
};

export const MISSING_EVIDENCE_LABELS: Record<string, string> = {
  MISSING_TEST: "Missing Test",
  MISSING_CERTIFICATION: "Missing Certification",
  MISSING_SPECIFICATION: "Missing Specification",
  MISSING_TRACEABILITY: "Missing Traceability",
  MISSING_APPROVAL: "Missing Approval",
  MISSING_REFERENCE: "Missing Reference",
};

export const ENTITY_TYPES_REQUIRING_TESTS = [
  "COMPONENT",
  "ASSEMBLY",
  "SYSTEM",
  "SUBSYSTEM",
  "MATERIAL",
  "INTERFACE",
];

export const ENTITY_TYPES_REQUIRING_CERTIFICATION = [
  "COMPONENT",
  "MATERIAL",
  "SUPPLIER",
  "MANUFACTURER",
];

export const ENTITY_TYPES_REQUIRING_SPECIFICATION = [
  "COMPONENT",
  "ASSEMBLY",
  "SYSTEM",
  "SUBSYSTEM",
  "INTERFACE",
  "MATERIAL",
];

export const ENTITY_TYPES_REQUIRING_APPROVAL = [
  "REQUIREMENT",
  "SPECIFICATION",
  "STANDARD",
  "ENGINEERING_CHANGE",
];

export const STALE_THRESHOLD_DAYS = 365;
