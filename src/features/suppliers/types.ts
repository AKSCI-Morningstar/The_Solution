export interface SupplierDTO {
  id: string;
  name: string;
  supplierCode: string;
  status: string;
  type: string;
  tier: string;
  description?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  taxId?: string | null;
  industry?: string | null;
  employeeCount?: number | null;
  annualRevenue?: string | null;
  currency?: string | null;
  paymentTerms?: string | null;
  shippingTerms?: string | null;
  preferredCurrency?: string | null;
  minOrderValue?: number | null;
  leadTimeDays?: number | null;
  qualityRating?: number | null;
  deliveryRating?: number | null;
  costRating?: number | null;
  complianceRating?: number | null;
  overallRating?: number | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string | null;
  language?: string | null;
  onboardingDate?: string | null;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  contractValue?: number | null;
  dunsNumber?: string | null;
  naicsCode?: string | null;
  isoCertifications?: string | null;
  riskLevel?: string | null;
  riskScore?: number | null;
  lastAssessmentDate?: string | null;
  nextAssessmentDate?: string | null;
  notes?: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  organizationId: string;
  createdById?: string | null;
  updatedById?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  certifications?: CertificationDTO[];
  capabilities?: CapabilityDTO[];
  facilities?: FacilityDTO[];
  contacts?: ContactDTO[];
  relationships?: RelationshipDTO[];
  _count?: {
    certifications: number;
    capabilities: number;
    facilities: number;
    contacts: number;
    relationships: number;
  };
}

export interface CertificationDTO {
  id: string;
  supplierId: string;
  certificationType: string;
  certificationName: string;
  issuingBody?: string | null;
  certificateNumber?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  status: string;
  scope?: string | null;
  standardReference?: string | null;
  assessmentDate?: string | null;
  nextAssessmentDate?: string | null;
  notes?: string | null;
  attachments: string[];
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
  maturityLevel?: string | null;
  status: string;
  qualityScore?: number | null;
  deliveryScore?: number | null;
  costScore?: number | null;
  innovationScore?: number | null;
  complianceScore?: number | null;
  overallScore?: number | null;
  evidenceReference?: string | null;
  verificationSource?: string | null;
  verifiedAt?: string | null;
  verifiedById?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FacilityDTO {
  id: string;
  supplierId: string;
  name: string;
  type: string;
  status?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  squareFootage?: number | null;
  employeeCount?: number | null;
  yearEstablished?: number | null;
  certifications?: string | null;
  operatingHours?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactDTO {
  id: string;
  supplierId: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  mobilePhone?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  role?: string | null;
  isPrimary: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RelationshipDTO {
  id: string;
  supplierId: string;
  relatedSupplierId?: string | null;
  relatedOrganizationId?: string | null;
  relationshipType: string;
  direction: string;
  description?: string | null;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
