export const CONTRADICTION_TYPES = [
  "REQUIREMENT_CONTRADICTION",
  "SPECIFICATION_CONTRADICTION",
  "DOCUMENT_CONTRADICTION",
  "EVIDENCE_CONTRADICTION",
  "MATERIAL_CONTRADICTION",
  "SUPPLIER_CONTRADICTION",
  "INTERFACE_CONTRADICTION",
  "VERSION_CONTRADICTION",
  "LIFECYCLE_CONTRADICTION",
  "RELATIONSHIP_CONTRADICTION",
  "CERTIFICATION_CONTRADICTION",
  "RULE_VIOLATION",
] as const;

export type ContradictionType = (typeof CONTRADICTION_TYPES)[number];

export const CONTRADICTION_SEVERITIES = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
  "INFORMATION_ONLY",
  "BLOCKED_BY_MISSING_EVIDENCE",
  "NEEDS_REVIEW",
] as const;

export type ContradictionSeverity = (typeof CONTRADICTION_SEVERITIES)[number];

export const CONTRADICTION_STATUSES = [
  "DETECTED",
  "UNDER_REVIEW",
  "ACCEPTED",
  "REJECTED",
  "RESOLVED",
  "ARCHIVED",
] as const;

export type ContradictionStatus = (typeof CONTRADICTION_STATUSES)[number];

export const CONTRADICTION_LIFECYCLE_ACTIONS = [
  "DETECTED",
  "REVIEW_STARTED",
  "ACCEPTED",
  "REJECTED",
  "RESOLVED",
  "ARCHIVED",
  "REOPENED",
] as const;

export type ContradictionLifecycleAction = (typeof CONTRADICTION_LIFECYCLE_ACTIONS)[number];

export const LIFECYCLE_TRANSITIONS: Record<string, string[]> = {
  DETECTED: ["UNDER_REVIEW", "ACCEPTED", "REJECTED", "ARCHIVED"],
  UNDER_REVIEW: ["ACCEPTED", "REJECTED", "DETECTED"],
  ACCEPTED: ["RESOLVED", "ARCHIVED"],
  REJECTED: ["ARCHIVED", "DETECTED"],
  RESOLVED: ["ARCHIVED", "DETECTED"],
  ARCHIVED: ["DETECTED"],
};

export const CONTRADICTION_TYPE_LABELS: Record<string, string> = {
  REQUIREMENT_CONTRADICTION: "Requirement Contradiction",
  SPECIFICATION_CONTRADICTION: "Specification Contradiction",
  DOCUMENT_CONTRADICTION: "Document Contradiction",
  EVIDENCE_CONTRADICTION: "Evidence Contradiction",
  MATERIAL_CONTRADICTION: "Material Contradiction",
  SUPPLIER_CONTRADICTION: "Supplier Contradiction",
  INTERFACE_CONTRADICTION: "Interface Contradiction",
  VERSION_CONTRADICTION: "Version Contradiction",
  LIFECYCLE_CONTRADICTION: "Lifecycle Contradiction",
  RELATIONSHIP_CONTRADICTION: "Relationship Contradiction",
  CERTIFICATION_CONTRADICTION: "Certification Contradiction",
  RULE_VIOLATION: "Rule Violation",
};

export const CONTRADICTION_SEVERITY_LABELS: Record<string, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
  INFORMATION_ONLY: "Information Only",
  BLOCKED_BY_MISSING_EVIDENCE: "Blocked by Missing Evidence",
  NEEDS_REVIEW: "Needs Review",
};

export const CONTRADICTION_STATUS_LABELS: Record<string, string> = {
  DETECTED: "Detected",
  UNDER_REVIEW: "Under Review",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  RESOLVED: "Resolved",
  ARCHIVED: "Archived",
};

export const CONTRADICTION_SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700 border-red-200",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
  LOW: "bg-blue-100 text-blue-700 border-blue-200",
  INFORMATION_ONLY: "bg-gray-100 text-gray-700 border-gray-200",
  BLOCKED_BY_MISSING_EVIDENCE: "bg-purple-100 text-purple-700 border-purple-200",
  NEEDS_REVIEW: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

export const CONTRADICTION_STATUS_COLORS: Record<string, string> = {
  DETECTED: "bg-blue-100 text-blue-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  ARCHIVED: "bg-gray-100 text-gray-700",
};

export const CONTRADICTION_TYPE_DESCRIPTIONS: Record<string, string> = {
  REQUIREMENT_CONTRADICTION: "Two or more requirements cannot simultaneously be satisfied under the same engineering context.",
  SPECIFICATION_CONTRADICTION: "Conflicting specifications reference the same engineering object with incompatible parameters.",
  DOCUMENT_CONTRADICTION: "Document content contains internally inconsistent statements or contradicts another document.",
  EVIDENCE_CONTRADICTION: "Evidence nodes present conflicting claims about the same engineering fact.",
  MATERIAL_CONTRADICTION: "Material specifications conflict for the same component or assembly.",
  SUPPLIER_CONTRADICTION: "Multiple suppliers with incompatible capabilities are assigned to the same entity.",
  INTERFACE_CONTRADICTION: "Interface definitions between connected components are incompatible.",
  VERSION_CONTRADICTION: "Version mismatches exist between related engineering objects.",
  LIFECYCLE_CONTRADICTION: "Lifecycle status conflicts exist between related entities.",
  RELATIONSHIP_CONTRADICTION: "Relationship definitions conflict or create impossible dependency cycles.",
  CERTIFICATION_CONTRADICTION: "Certification requirements conflict for the same entity.",
  RULE_VIOLATION: "An engineering rule or constraint has been violated.",
};
