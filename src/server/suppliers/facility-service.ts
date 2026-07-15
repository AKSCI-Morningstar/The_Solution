import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { NotFoundError } from "@/shared/errors";
import { recordAuditEvent } from "@/server/audit/audit-service";
import type { CreateFacilityInput, UpdateFacilityInput } from "./validation";

export async function createFacility(
  supplierId: string,
  organizationId: string,
  input: CreateFacilityInput,
) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId, deletedAt: null },
  });
  if (!supplier) throw new NotFoundError("Supplier", supplierId);

  const facility = await prisma.supplierFacility.create({
    data: {
      organizationId,
      supplierId,
      name: input.name,
      type: input.type,
      address: input.address,
      city: input.city,
      state: input.state,
      country: input.country,
      postalCode: input.postalCode,
      latitude: input.latitude,
      longitude: input.longitude,
      areaSqFt: input.areaSqFt,
      employees: input.employees,
      certifications: input.certifications ?? undefined,
      capabilities: input.capabilities ?? undefined,
      status: input.status,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });

  await recordAuditEvent(organizationId, "facility.created", "SupplierFacility", facility.id, {
    supplierId,
    name: input.name,
  });

  return facility;
}

export async function getFacilities(supplierId: string, organizationId: string) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId, deletedAt: null },
  });
  if (!supplier) throw new NotFoundError("Supplier", supplierId);

  return prisma.supplierFacility.findMany({
    where: { supplierId },
    orderBy: { name: "asc" },
  });
}

export async function getFacility(facilityId: string, organizationId: string) {
  const facility = await prisma.supplierFacility.findFirst({
    where: { id: facilityId, organizationId },
  });
  if (!facility) throw new NotFoundError("SupplierFacility", facilityId);
  return facility;
}

export async function updateFacility(
  facilityId: string,
  organizationId: string,
  input: UpdateFacilityInput,
) {
  const facility = await prisma.supplierFacility.findFirst({
    where: { id: facilityId, organizationId },
  });
  if (!facility) throw new NotFoundError("SupplierFacility", facilityId);

  const data: Record<string, unknown> = {};
  const fields: (keyof UpdateFacilityInput)[] = [
    "name",
    "type",
    "address",
    "city",
    "state",
    "country",
    "postalCode",
    "latitude",
    "longitude",
    "areaSqFt",
    "employees",
    "status",
  ];
  for (const field of fields) {
    if (input[field] !== undefined) data[field] = input[field];
  }
  if (input.certifications !== undefined) data.certifications = input.certifications;
  if (input.capabilities !== undefined) data.capabilities = input.capabilities;
  if (input.metadata !== undefined) data.metadata = input.metadata;

  const updated = await prisma.supplierFacility.update({ where: { id: facilityId }, data });

  await recordAuditEvent(organizationId, "facility.updated", "SupplierFacility", facilityId, {
    changes: Object.keys(input),
  });

  return updated;
}

export async function deleteFacility(facilityId: string, organizationId: string) {
  const facility = await prisma.supplierFacility.findFirst({
    where: { id: facilityId, organizationId },
  });
  if (!facility) throw new NotFoundError("SupplierFacility", facilityId);

  await prisma.supplierFacility.delete({ where: { id: facilityId } });

  await recordAuditEvent(organizationId, "facility.deleted", "SupplierFacility", facilityId, {});
}

export async function listFacilities(
  organizationId: string,
  filters: { type?: string; country?: string; page?: number; pageSize?: number },
) {
  const { type, country, page = 1, pageSize = 20 } = filters;
  const where: Record<string, unknown> = { organizationId };
  if (type) where.type = type;
  if (country) where.country = country;

  const [data, total] = await Promise.all([
    prisma.supplierFacility.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: "asc" },
      include: {
        supplier: { select: { id: true, name: true, identifier: true } },
      },
    }),
    prisma.supplierFacility.count({ where }),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
