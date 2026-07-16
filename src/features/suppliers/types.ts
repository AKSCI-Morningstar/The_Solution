export interface SupplierDTO {
  id: string;
  organizationId: string;
  supplierType: string;
  identifier: string;
  name: string;
  legalName?: string | null;
  description?: string | null;
  website?: string | null;
  taxId?: string | null;
  duns?: string | null;
  cageCode?: string | null;
  naicsCodes?: string[] | null;
  industrySectors?: string[] | null;
  supportedPrograms?: string[] | null;
  locations?: Array<{
    name: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    type?: string;
  }> | null;
  riskNotes?: string | null;
  engineeringNotes?: string | null;
  status: string;
  metadata?: Record<string, unknown> | null;
  tags?: string[] | null;
  labels?: Record<string, string> | null;
  createdById?: string | null;
  updatedById?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  // Metadata flattened fields
  tier?: string | null;
  leadTimeDays?: number | null;
  riskLevel?: string | null;
  riskScore?: number | null;
  lastAssessmentDate?: string | null;
  nextAssessmentDate?: string | null;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  contractValue?: number | null;
  annualRevenue?: string | null;
  currency?: string | null;
  paymentTerms?: string | null;
  shippingTerms?: string | null;
  employeeCount?: number | null;
  overallRating?: number | null;
  qualityRating?: number | null;
  deliveryRating?: number | null;
  costRating?: number | null;
  complianceRating?: number | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  notes?: string | null;

  // Relations
  certifications?: CertificationDTO[];
  capabilities?: CapabilityDTO[];
  facilities?: FacilityDTO[];
  contacts?: ContactDTO[];
  outgoingRelationships?: RelationshipDTO[];
  incomingRelationships?: RelationshipDTO[];
  _count?: {
    certifications?: number;
    capabilities?: number;
    facilities?: number;
    contacts?: number;
    outgoingRelationships?: number;
    incomingRelationships?: number;
  };
}

export interface CertificationDTO {
  id: string;
  supplierId: string;
  certificationType: string;
  certificationName: string;
  issuingBody: string;
  certificateNumber?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  status: string;
  scope?: string | null;
  evidenceUrl?: string | null;
  evidenceDocumentId?: string | null;
  notes?: string | null;
  verifiedAt?: string | null;
  verifiedById?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CapabilityDTO {
  id: string;
  supplierId: string;
  capabilityType: string;
  capabilityName: string;
  description?: string | null;
  category?: string | null;
  subcategory?: string | null;
  materials?: string[] | null;
  processes?: string[] | null;
  equipment?: string[] | null;
  qualityStandards?: string[] | null;
  maxDimensions?: string | null;
  tolerances?: string | null;
  capacity?: string | null;
  leadTimeDays?: number | null;
  notes?: string | null;
  status: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface FacilityDTO {
  id: string;
  organizationId: string;
  supplierId: string;
  name: string;
  type: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  areaSqFt?: number | null;
  employees?: number | null;
  certifications?: string[] | null;
  capabilities?: string[] | null;
  status: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactDTO {
  id: string;
  supplierId: string;
  name: string;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  role?: string | null;
  isPrimary: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RelationshipDTO {
  id: string;
  organizationId: string;
  sourceSupplierId: string;
  targetSupplierId: string;
  relationshipType: string;
  description?: string | null;
  contractReference?: string | null;
  program?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;

  // Added field for ease of display
  direction?: "INBOUND" | "OUTBOUND" | "BIDIRECTIONAL";
  relatedSupplier?: { id: string; name: string; identifier: string; supplierType: string };
  sourceSupplier?: { id: string; name: string; identifier: string; supplierType: string };
  targetSupplier?: { id: string; name: string; identifier: string; supplierType: string };
}
