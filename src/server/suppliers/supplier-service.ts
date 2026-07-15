import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { NotFoundError } from "@/shared/errors";
import { recordAuditEvent } from "@/server/audit/audit-service";
import type { CreateSupplierInput, UpdateSupplierInput, SupplierFilterInput } from "./validation";

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
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
      createdById: userId,
      updatedById: userId,
    },
  });

  await recordAuditEvent(organizationId, "supplier.created", "Supplier", supplier.id, {
    identifier: supplier.identifier,
    name: supplier.name,
  });

  return supplier;
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
  return supplier;
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

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
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

  const data: Record<string, unknown> = { updatedById: userId };
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
  if (input.metadata !== undefined) data.metadata = input.metadata as Prisma.InputJsonValue;

  const updated = await prisma.supplier.update({ where: { id: supplierId }, data });

  await recordAuditEvent(organizationId, "supplier.updated", "Supplier", supplierId, {
    changes: Object.keys(input),
  });

  return updated;
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
  return prisma.supplier.findMany({
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
    select: { id: true, name: true, identifier: true, supplierType: true, status: true },
  });
}
