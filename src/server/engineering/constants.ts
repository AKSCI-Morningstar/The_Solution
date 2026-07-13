export const ENTITY_TYPES = [
  "COMPONENT",
  "ASSEMBLY",
  "SYSTEM",
  "SUBSYSTEM",
  "REQUIREMENT",
  "SPECIFICATION",
  "INTERFACE",
  "MATERIAL",
  "SUPPLIER",
  "MANUFACTURER",
  "PART_NUMBER",
  "DRAWING",
  "CAD_MODEL",
  "TEST",
  "CERTIFICATION",
  "PROCESS",
  "FACILITY",
  "STANDARD",
  "ENGINEERING_CHANGE",
  "DOCUMENT_REFERENCE",
  "EVIDENCE_REFERENCE",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export const ENTITY_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "PENDING_REVIEW",
  "APPROVED",
  "REJECTED",
  "SUPERSEDED",
  "ARCHIVED",
] as const;

export type EntityStatus = (typeof ENTITY_STATUSES)[number];

export const RELATIONSHIP_TYPES = [
  "DEPENDS_ON",
  "CONTAINS",
  "IMPLEMENTS",
  "VERIFIES",
  "REFERENCES",
  "MANUFACTURED_BY",
  "SUPPLIED_BY",
  "TESTED_BY",
  "CERTIFIED_BY",
  "DERIVED_FROM",
  "SUPERSEDES",
] as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export const AUDIT_ACTIONS = [
  "ENTITY_CREATED",
  "ENTITY_UPDATED",
  "ENTITY_DELETED",
  "STATUS_CHANGED",
  "RELATIONSHIP_CREATED",
  "RELATIONSHIP_REMOVED",
  "VERSION_CREATED",
  "VERSION_RESTORED",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const LIFECYCLE_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["ACTIVE", "ARCHIVED"],
  ACTIVE: ["PENDING_REVIEW", "SUPERSEDED", "ARCHIVED"],
  PENDING_REVIEW: ["APPROVED", "REJECTED", "DRAFT"],
  APPROVED: ["ACTIVE", "SUPERSEDED"],
  REJECTED: ["DRAFT", "ARCHIVED"],
  SUPERSEDED: ["ACTIVE", "ARCHIVED"],
  ARCHIVED: ["DRAFT"],
};

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  COMPONENT: "Component",
  ASSEMBLY: "Assembly",
  SYSTEM: "System",
  SUBSYSTEM: "Subsystem",
  REQUIREMENT: "Requirement",
  SPECIFICATION: "Specification",
  INTERFACE: "Interface",
  MATERIAL: "Material",
  SUPPLIER: "Supplier",
  MANUFACTURER: "Manufacturer",
  PART_NUMBER: "Part Number",
  DRAWING: "Drawing",
  CAD_MODEL: "CAD Model",
  TEST: "Test",
  CERTIFICATION: "Certification",
  PROCESS: "Process",
  FACILITY: "Facility",
  STANDARD: "Standard",
  ENGINEERING_CHANGE: "Engineering Change",
  DOCUMENT_REFERENCE: "Document Reference",
  EVIDENCE_REFERENCE: "Evidence Reference",
};

export const RELATIONSHIP_TYPE_LABELS: Record<string, string> = {
  DEPENDS_ON: "Depends On",
  CONTAINS: "Contains",
  IMPLEMENTS: "Implements",
  VERIFIES: "Verifies",
  REFERENCES: "References",
  MANUFACTURED_BY: "Manufactured By",
  SUPPLIED_BY: "Supplied By",
  TESTED_BY: "Tested By",
  CERTIFIED_BY: "Certified By",
  DERIVED_FROM: "Derived From",
  SUPERSEDES: "Supersedes",
};

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  PENDING_REVIEW: "Pending Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SUPERSEDED: "Superseded",
  ARCHIVED: "Archived",
};

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  ACTIVE: "bg-green-100 text-green-700",
  PENDING_REVIEW: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-blue-100 text-blue-700",
  REJECTED: "bg-red-100 text-red-700",
  SUPERSEDED: "bg-purple-100 text-purple-700",
  ARCHIVED: "bg-rose-100 text-rose-700",
};

export const ENTITY_TYPE_COLORS: Record<string, string> = {
  COMPONENT: "bg-blue-100 text-blue-700",
  ASSEMBLY: "bg-indigo-100 text-indigo-700",
  SYSTEM: "bg-violet-100 text-violet-700",
  SUBSYSTEM: "bg-purple-100 text-purple-700",
  REQUIREMENT: "bg-amber-100 text-amber-700",
  SPECIFICATION: "bg-orange-100 text-orange-700",
  INTERFACE: "bg-cyan-100 text-cyan-700",
  MATERIAL: "bg-teal-100 text-teal-700",
  SUPPLIER: "bg-emerald-100 text-emerald-700",
  MANUFACTURER: "bg-green-100 text-green-700",
  PART_NUMBER: "bg-lime-100 text-lime-700",
  DRAWING: "bg-sky-100 text-sky-700",
  CAD_MODEL: "bg-blue-100 text-blue-700",
  TEST: "bg-rose-100 text-rose-700",
  CERTIFICATION: "bg-pink-100 text-pink-700",
  PROCESS: "bg-fuchsia-100 text-fuchsia-700",
  FACILITY: "bg-slate-100 text-slate-700",
  STANDARD: "bg-gray-100 text-gray-700",
  ENGINEERING_CHANGE: "bg-red-100 text-red-700",
  DOCUMENT_REFERENCE: "bg-yellow-100 text-yellow-700",
  EVIDENCE_REFERENCE: "bg-orange-100 text-orange-700",
};
