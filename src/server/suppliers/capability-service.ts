import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { NotFoundError } from "@/shared/errors";
import { recordAuditEvent } from "@/server/audit/audit-service";
import type { CreateCapabilityInput, UpdateCapabilityInput } from "./validation";

export async function createCapability(
  supplierId: string,
  organizationId: string,
  input: CreateCapabilityInput,
) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId, deletedAt: null },
  });
  if (!supplier) throw new NotFoundError("Supplier", supplierId);

  const capability = await prisma.supplierCapability.create({
    data: {
      supplierId,
      capabilityType: input.capabilityType,
      capabilityName: input.capabilityName,
      description: input.description,
      category: input.category,
      subcategory: input.subcategory,
      materials: input.materials ?? Prisma.DbNull,
      processes: input.processes ?? Prisma.DbNull,
      equipment: input.equipment ?? Prisma.DbNull,
      qualityStandards: input.qualityStandards ?? Prisma.DbNull,
      maxDimensions: input.maxDimensions,
      tolerances: input.tolerances,
      capacity: input.capacity,
      leadTimeDays: input.leadTimeDays,
      notes: input.notes,
      status: input.status,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });

  await recordAuditEvent(
    organizationId,
    "capability.created",
    "SupplierCapability",
    capability.id,
    {
      supplierId,
      capabilityType: input.capabilityType,
    },
  );

  return capability;
}

export async function getCapabilities(supplierId: string, organizationId: string) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId, deletedAt: null },
  });
  if (!supplier) throw new NotFoundError("Supplier", supplierId);

  return prisma.supplierCapability.findMany({
    where: { supplierId },
    orderBy: [{ capabilityType: "asc" }, { capabilityName: "asc" }],
  });
}

export async function getCapability(capId: string, supplierId: string, organizationId: string) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId, deletedAt: null },
  });
  if (!supplier) throw new NotFoundError("Supplier", supplierId);

  const cap = await prisma.supplierCapability.findFirst({
    where: { id: capId, supplierId },
  });
  if (!cap) throw new NotFoundError("SupplierCapability", capId);
  return cap;
}

export async function updateCapability(
  capId: string,
  supplierId: string,
  organizationId: string,
  input: UpdateCapabilityInput,
) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId, deletedAt: null },
  });
  if (!supplier) throw new NotFoundError("Supplier", supplierId);

  const existing = await prisma.supplierCapability.findFirst({
    where: { id: capId, supplierId },
  });
  if (!existing) throw new NotFoundError("SupplierCapability", capId);

  const data: Record<string, unknown> = {};
  const fields: (keyof UpdateCapabilityInput)[] = [
    "capabilityType",
    "capabilityName",
    "description",
    "category",
    "subcategory",
    "maxDimensions",
    "tolerances",
    "capacity",
    "leadTimeDays",
    "notes",
    "status",
  ];
  for (const field of fields) {
    if (input[field] !== undefined) data[field] = input[field];
  }
  const jsonFields: (keyof UpdateCapabilityInput)[] = [
    "materials",
    "processes",
    "equipment",
    "qualityStandards",
  ];
  for (const field of jsonFields) {
    if (input[field] !== undefined) data[field] = input[field] as Prisma.InputJsonValue;
  }
  if (input.metadata !== undefined) data.metadata = input.metadata as Prisma.InputJsonValue;

  const updated = await prisma.supplierCapability.update({ where: { id: capId }, data });

  await recordAuditEvent(organizationId, "capability.updated", "SupplierCapability", capId, {
    supplierId,
    changes: Object.keys(input),
  });

  return updated;
}

export async function deleteCapability(capId: string, supplierId: string, organizationId: string) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId, deletedAt: null },
  });
  if (!supplier) throw new NotFoundError("Supplier", supplierId);

  const cap = await prisma.supplierCapability.findFirst({
    where: { id: capId, supplierId },
  });
  if (!cap) throw new NotFoundError("SupplierCapability", capId);

  await prisma.supplierCapability.delete({ where: { id: capId } });

  await recordAuditEvent(organizationId, "capability.deleted", "SupplierCapability", capId, {
    supplierId,
    capabilityType: cap.capabilityType,
  });
}

export async function searchCapabilities(organizationId: string, query: string, limit = 20) {
  return prisma.supplierCapability.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { capabilityName: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { category: { contains: query, mode: "insensitive" } },
      ],
      supplier: { organizationId, deletedAt: null },
    },
    take: limit,
    orderBy: { capabilityName: "asc" },
    include: {
      supplier: { select: { id: true, name: true, identifier: true } },
    },
  });
}
