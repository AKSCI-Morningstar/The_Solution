export const SUPPLIER_TYPES = [
  "SUPPLIER",
  "MANUFACTURER",
  "DISTRIBUTOR",
  "SUBCONTRACTOR",
  "PARTNER",
] as const;
export type SupplierType = (typeof SUPPLIER_TYPES)[number];

export const SUPPLIER_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "PENDING_REVIEW",
  "APPROVED",
  "DISQUALIFIED",
] as const;
export type SupplierStatus = (typeof SUPPLIER_STATUSES)[number];

export const FACILITY_TYPES = [
  "PLANT",
  "WAREHOUSE",
  "LABORATORY",
  "OFFICE",
  "DISTRIBUTION_CENTER",
] as const;
export type FacilityType = (typeof FACILITY_TYPES)[number];

export const CERTIFICATION_TYPES = [
  "AS9100",
  "AS9100D",
  "ISO_9001",
  "ISO_14001",
  "ISO_45001",
  "ISO_13485",
  "NADCAP",
  "ITAR",
  "CMMC",
  "AS9120",
  "ISO_27001",
  "CUSTOM",
] as const;
export type CertificationType = (typeof CERTIFICATION_TYPES)[number];

export const CAPABILITY_TYPES = [
  "MACHINING",
  "FORGING",
  "CASTING",
  "COMPOSITE_MANUFACTURING",
  "HEAT_TREATMENT",
  "PCB_ASSEMBLY",
  "ELECTRONICS",
  "SOFTWARE",
  "SYSTEMS_INTEGRATION",
  "TESTING",
  "INSPECTION",
  "WELDING",
  "ADDITIVE_MANUFACTURING",
  "SHEET_METAL",
  "INJECTION_MOLDING",
  "CUSTOM",
] as const;
export type CapabilityType = (typeof CAPABILITY_TYPES)[number];

export const RELATIONSHIP_TYPES = [
  "PARENT",
  "SUBCONTRACTOR",
  "SHARED_FACILITY",
  "SHARED_MATERIAL",
  "SHARED_CAPABILITY",
  "PROGRAM_DEPENDENCY",
  "COMPONENT_DEPENDENCY",
  "PARTNERSHIP",
  "JOINT_VENTURE",
] as const;
export type SupplierRelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export const SUPPLIER_TYPE_LABELS: Record<string, string> = {
  SUPPLIER: "Supplier",
  MANUFACTURER: "Manufacturer",
  DISTRIBUTOR: "Distributor",
  SUBCONTRACTOR: "Subcontractor",
  PARTNER: "Partner",
};

export const SUPPLIER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  PENDING_REVIEW: "Pending Review",
  APPROVED: "Approved",
  DISQUALIFIED: "Disqualified",
};

export const FACILITY_TYPE_LABELS: Record<string, string> = {
  PLANT: "Plant",
  WAREHOUSE: "Warehouse",
  LABORATORY: "Laboratory",
  OFFICE: "Office",
  DISTRIBUTION_CENTER: "Distribution Center",
};

export const CERTIFICATION_TYPE_LABELS: Record<string, string> = {
  AS9100: "AS9100",
  AS9100D: "AS9100D",
  ISO_9001: "ISO 9001",
  ISO_14001: "ISO 14001",
  ISO_45001: "ISO 45001",
  ISO_13485: "ISO 13485",
  NADCAP: "NADCAP",
  ITAR: "ITAR",
  CMMC: "CMMC",
  AS9120: "AS9120",
  ISO_27001: "ISO 27001",
  CUSTOM: "Custom",
};

export const CAPABILITY_TYPE_LABELS: Record<string, string> = {
  MACHINING: "Machining",
  FORGING: "Forging",
  CASTING: "Casting",
  COMPOSITE_MANUFACTURING: "Composite Manufacturing",
  HEAT_TREATMENT: "Heat Treatment",
  PCB_ASSEMBLY: "PCB Assembly",
  ELECTRONICS: "Electronics",
  SOFTWARE: "Software",
  SYSTEMS_INTEGRATION: "Systems Integration",
  TESTING: "Testing",
  INSPECTION: "Inspection",
  WELDING: "Welding",
  ADDITIVE_MANUFACTURING: "Additive Manufacturing",
  SHEET_METAL: "Sheet Metal",
  INJECTION_MOLDING: "Injection Molding",
  CUSTOM: "Custom",
};

export const RELATIONSHIP_TYPE_LABELS: Record<string, string> = {
  PARENT: "Parent Supplier",
  SUBCONTRACTOR: "Subcontractor",
  SHARED_FACILITY: "Shared Facility",
  SHARED_MATERIAL: "Shared Material",
  SHARED_CAPABILITY: "Shared Capability",
  PROGRAM_DEPENDENCY: "Program Dependency",
  COMPONENT_DEPENDENCY: "Component Dependency",
  PARTNERSHIP: "Partnership",
  JOINT_VENTURE: "Joint Venture",
};
