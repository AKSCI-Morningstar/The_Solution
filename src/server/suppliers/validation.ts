import { z } from "zod";
import { paginationSchema } from "@/shared/validation/schemas";

export const createSupplierSchema = z.object({
  supplierType: z.string().min(1).max(100).default("SUPPLIER"),
  identifier: z.string().min(1).max(100),
  name: z.string().min(1).max(300),
  legalName: z.string().max(300).optional(),
  description: z.string().max(5000).optional(),
  website: z.string().max(500).optional(),
  taxId: z.string().max(100).optional(),
  duns: z.string().max(20).optional(),
  cageCode: z.string().max(20).optional(),
  naicsCodes: z.array(z.string()).optional(),
  industrySectors: z.array(z.string()).optional(),
  supportedPrograms: z.array(z.string()).optional(),
  locations: z
    .array(
      z.object({
        name: z.string(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        type: z.string().optional(),
      }),
    )
    .optional(),
  riskNotes: z.string().max(2000).optional(),
  engineeringNotes: z.string().max(5000).optional(),
  status: z.string().max(50).default("ACTIVE"),
  tags: z.array(z.string()).optional(),
  labels: z.record(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;

export const updateSupplierSchema = createSupplierSchema.partial();
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;

export const supplierFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  supplierType: z.string().optional(),
  status: z.string().optional(),
  capabilityType: z.string().optional(),
  certificationType: z.string().optional(),
  country: z.string().optional(),
});
export type SupplierFilterInput = z.infer<typeof supplierFilterSchema>;

export const createCertificationSchema = z.object({
  certificationType: z.string().min(1).max(100),
  certificationName: z.string().min(1).max(300),
  issuingBody: z.string().min(1).max(200),
  certificateNumber: z.string().max(100).optional(),
  issueDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  status: z.string().max(50).default("ACTIVE"),
  scope: z.string().max(2000).optional(),
  evidenceUrl: z.string().max(1000).optional(),
  evidenceDocumentId: z.string().optional(),
  notes: z.string().max(2000).optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateCertificationInput = z.infer<typeof createCertificationSchema>;

export const updateCertificationSchema = createCertificationSchema.partial();
export type UpdateCertificationInput = z.infer<typeof updateCertificationSchema>;

export const createCapabilitySchema = z.object({
  capabilityType: z.string().min(1).max(100),
  capabilityName: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  category: z.string().max(200).optional(),
  subcategory: z.string().max(200).optional(),
  materials: z.array(z.string()).optional(),
  processes: z.array(z.string()).optional(),
  equipment: z.array(z.string()).optional(),
  qualityStandards: z.array(z.string()).optional(),
  maxDimensions: z.string().max(100).optional(),
  tolerances: z.string().max(200).optional(),
  capacity: z.string().max(200).optional(),
  leadTimeDays: z.number().int().positive().optional(),
  notes: z.string().max(2000).optional(),
  status: z.string().max(50).default("ACTIVE"),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateCapabilityInput = z.infer<typeof createCapabilitySchema>;

export const updateCapabilitySchema = createCapabilitySchema.partial();
export type UpdateCapabilityInput = z.infer<typeof updateCapabilitySchema>;

export const createFacilitySchema = z.object({
  name: z.string().min(1).max(300),
  type: z.string().max(100).default("PLANT"),
  address: z.string().max(500).optional(),
  city: z.string().max(200).optional(),
  state: z.string().max(200).optional(),
  country: z.string().max(200).optional(),
  postalCode: z.string().max(20).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  areaSqFt: z.number().positive().optional(),
  employees: z.number().int().positive().optional(),
  certifications: z.array(z.string()).optional(),
  capabilities: z.array(z.string()).optional(),
  status: z.string().max(50).default("ACTIVE"),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateFacilityInput = z.infer<typeof createFacilitySchema>;

export const updateFacilitySchema = createFacilitySchema.partial();
export type UpdateFacilityInput = z.infer<typeof updateFacilitySchema>;

export const createContactSchema = z.object({
  name: z.string().min(1).max(300),
  title: z.string().max(200).optional(),
  email: z.string().email().max(300).optional(),
  phone: z.string().max(50).optional(),
  mobile: z.string().max(50).optional(),
  role: z.string().max(100).optional(),
  isPrimary: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
});
export type CreateContactInput = z.infer<typeof createContactSchema>;

export const createRelationshipSchema = z.object({
  targetSupplierId: z.string().min(1),
  relationshipType: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  contractReference: z.string().max(200).optional(),
  program: z.string().max(200).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateRelationshipInput = z.infer<typeof createRelationshipSchema>;

export const updateRelationshipSchema = createRelationshipSchema.partial();
export type UpdateRelationshipInput = z.infer<typeof updateRelationshipSchema>;
