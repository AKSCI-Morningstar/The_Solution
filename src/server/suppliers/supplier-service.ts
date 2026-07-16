/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { NotFoundError } from "@/shared/errors";
import { recordAuditEvent } from "@/server/audit/audit-service";
import type { CreateSupplierInput, UpdateSupplierInput, SupplierFilterInput } from "./validation";

function extractMetadata(input: any, existingMetadata?: any) {
  const meta: Record<string, any> = {
    ...(existingMetadata as Record<string, any> || {}),
    ...(input.metadata as Record<string, any> || {}),
  };
  const fields = [
    "tier",
    "leadTimeDays",
    "riskLevel",
    "riskScore",
    "lastAssessmentDate",
    "nextAssessmentDate",
    "contractStartDate",
    "contractEndDate",
    "contractValue",
    "annualRevenue",
    "currency",
    "paymentTerms",
    "shippingTerms",
    "employeeCount",
    "overallRating",
    "qualityRating",
    "deliveryRating",
    "costRating",
    "complianceRating",
    "addressLine1",
    "addressLine2",
    "city",
    "state",
    "postalCode",
    "country",
    "notes",
  ];
  for (const f of fields) {
    if (input[f] !== undefined) {
      meta[f] = input[f];
    }
  }
  return meta;
}

export function mapSupplierToDTO(supplier: any): any {
  if (!supplier) return null;
  const metadata = (supplier.metadata as Record<string, any>) || {};
  return {
    ...supplier,
    // Map JSON arrays/objects safely
    naicsCodes: Array.isArray(supplier.naicsCodes) ? supplier.naicsCodes : [],
    industrySectors: Array.isArray(supplier.industrySectors) ? supplier.industrySectors : [],
    supportedPrograms: Array.isArray(supplier.supportedPrograms) ? supplier.supportedPrograms : [],
    locations: Array.isArray(supplier.locations) ? supplier.locations : [],
    tags: Array.isArray(supplier.tags) ? supplier.tags : [],
    labels: (supplier.labels as Record<string, string>) || {},

    // Map metadata fields
    tier: metadata.tier ?? null,
    leadTimeDays: metadata.leadTimeDays ?? null,
    riskLevel: metadata.riskLevel ?? "LOW",
    riskScore: metadata.riskScore ?? null,
    lastAssessmentDate: metadata.lastAssessmentDate ?? null,
    nextAssessmentDate: metadata.nextAssessmentDate ?? null,
    contractStartDate: metadata.contractStartDate ?? null,
    contractEndDate: metadata.contractEndDate ?? null,
    contractValue: metadata.contractValue ?? null,
    annualRevenue: metadata.annualRevenue ?? null,
    currency: metadata.currency ?? "USD",
    paymentTerms: metadata.paymentTerms ?? null,
    shippingTerms: metadata.shippingTerms ?? null,
    employeeCount: metadata.employeeCount ?? null,
    overallRating: metadata.overallRating ?? null,
    qualityRating: metadata.qualityRating ?? null,
    deliveryRating: metadata.deliveryRating ?? null,
    costRating: metadata.costRating ?? null,
    complianceRating: metadata.complianceRating ?? null,
    addressLine1: metadata.addressLine1 ?? null,
    addressLine2: metadata.addressLine2 ?? null,
    city: metadata.city ?? null,
    state: metadata.state ?? null,
    postalCode: metadata.postalCode ?? null,
    country: metadata.country ?? null,
    notes: metadata.notes ?? null,
  };
}

export async function createSupplier(
  organizationId: string,
  input: CreateSupplierInput,
  userId: string,
) {
  const existing = await prisma.supplier.findUnique({
    where: {
      organizationId_identifier: {
        organizationId,
        identifier: input.identifier,
      },
    },
  });

  if (existing && !existing.deletedAt) {
    throw new Error(`Supplier with identifier ${input.identifier} already exists`);
  }

  const computedMetadata = extractMetadata(input);

  const supplier = await prisma.supplier.create({
    data: {
      organizationId,
      supplierType: input.supplierType,
      identifier: input.identifier,
      name: input.name,
      legalName: input.legalName,
      description: input.description,
      website: input.website,
      taxId: input.taxId,
      duns: input.duns,
      cageCode: input.cageCode,
      naicsCodes: input.naicsCodes ?? Prisma.DbNull,
      industrySectors: input.industrySectors ?? Prisma.DbNull,
      supportedPrograms: input.supportedPrograms ?? Prisma.DbNull,
      locations: input.locations ?? Prisma.DbNull,
      riskNotes: input.riskNotes,
      engineeringNotes: input.engineeringNotes,
      status: input.status,
      tags: input.tags ?? Prisma.DbNull,
      labels: input.labels ?? Prisma.DbNull,
      metadata: computedMetadata as Prisma.InputJsonValue,
      createdById: userId,
      updatedById: userId,
    },
  });

  await recordAuditEvent(organizationId, "supplier.created", "Supplier", supplier.id, {
    identifier: supplier.identifier,
    name: supplier.name,
  });

  return mapSupplierToDTO(supplier);
}

export async function getSupplier(supplierId: string, organizationId: string) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId, deletedAt: null },
    include: {
      contacts: { orderBy: { isPrimary: "desc" } },
      certifications: { orderBy: { createdAt: "desc" } },
      capabilities: { orderBy: { createdAt: "desc" } },
      facilities: { orderBy: { name: "asc" } },
      outgoingRelationships: {
        include: {
          targetSupplier: {
            select: { id: true, name: true, identifier: true, supplierType: true },
          },
        },
      },
      incomingRelationships: {
        include: {
          sourceSupplier: {
            select: { id: true, name: true, identifier: true, supplierType: true },
          },
        },
      },
    },
  });
  if (!supplier) throw new NotFoundError("Supplier", supplierId);
  return mapSupplierToDTO(supplier);
}

export async function listSuppliers(organizationId: string, filters: SupplierFilterInput) {
  const { search, supplierType, status, page, pageSize } = filters;
  const where: Prisma.SupplierWhereInput = { organizationId, deletedAt: null };

  if (supplierType) where.supplierType = supplierType;
  if (status) where.status = status;

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { identifier: { contains: search, mode: "insensitive" } },
      { duns: { contains: search, mode: "insensitive" } },
      { cageCode: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: "asc" },
      include: {
        certifications: {
          where: { status: "ACTIVE" },
          select: { certificationType: true, expiryDate: true },
        },
        _count: { select: { capabilities: true, facilities: true, contacts: true } },
      },
    }),
    prisma.supplier.count({ where }),
  ]);

  const mappedData = data.map(mapSupplierToDTO);

  return { data: mappedData, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function updateSupplier(
  supplierId: string,
  organizationId: string,
  input: UpdateSupplierInput,
  userId: string,
) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId, deletedAt: null },
  });
  if (!supplier) throw new NotFoundError("Supplier", supplierId);

  const computedMetadata = extractMetadata(input, supplier.metadata);

  const data: Record<string, unknown> = {
    updatedById: userId,
    metadata: computedMetadata as Prisma.InputJsonValue,
  };
  
  const fields: (keyof UpdateSupplierInput)[] = [
    "supplierType",
    "identifier",
    "name",
    "legalName",
    "description",
    "website",
    "taxId",
    "duns",
    "cageCode",
    "riskNotes",
    "engineeringNotes",
    "status",
  ];
  for (const field of fields) {
    if (input[field] !== undefined) data[field] = input[field];
  }
  const jsonFields: (keyof UpdateSupplierInput)[] = [
    "naicsCodes",
    "industrySectors",
    "supportedPrograms",
    "locations",
    "tags",
    "labels",
  ];
  for (const field of jsonFields) {
    if (input[field] !== undefined) data[field] = input[field] as Prisma.InputJsonValue;
  }

  const updated = await prisma.supplier.update({ where: { id: supplierId }, data });

  await recordAuditEvent(organizationId, "supplier.updated", "Supplier", supplierId, {
    changes: Object.keys(input),
  });

  return mapSupplierToDTO(updated);
}

export async function deleteSupplier(supplierId: string, organizationId: string, userId: string) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId, deletedAt: null },
  });
  if (!supplier) throw new NotFoundError("Supplier", supplierId);

  await prisma.supplier.update({
    where: { id: supplierId },
    data: { deletedAt: new Date(), updatedById: userId },
  });

  await recordAuditEvent(organizationId, "supplier.deleted", "Supplier", supplierId, {
    identifier: supplier.identifier,
  });
}

export async function searchSuppliers(organizationId: string, query: string, limit = 20) {
  const suppliers = await prisma.supplier.findMany({
    where: {
      organizationId,
      deletedAt: null,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { identifier: { contains: query, mode: "insensitive" } },
        { duns: { contains: query, mode: "insensitive" } },
        { cageCode: { contains: query, mode: "insensitive" } },
      ],
    },
    take: limit,
    orderBy: { name: "asc" },
    select: { id: true, name: true, identifier: true, supplierType: true, status: true, metadata: true },
  });
  return suppliers.map(mapSupplierToDTO);
}
