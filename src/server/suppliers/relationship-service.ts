import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { NotFoundError } from "@/shared/errors";
import { recordAuditEvent } from "@/server/audit/audit-service";
import type { CreateRelationshipInput } from "./validation";

export async function createRelationship(
  sourceSupplierId: string,
  organizationId: string,
  input: CreateRelationshipInput,
) {
  const source = await prisma.supplier.findFirst({
    where: { id: sourceSupplierId, organizationId, deletedAt: null },
  });
  if (!source) throw new NotFoundError("Supplier", sourceSupplierId);

  const target = await prisma.supplier.findFirst({
    where: { id: input.targetSupplierId, organizationId, deletedAt: null },
  });
  if (!target) throw new NotFoundError("Supplier", input.targetSupplierId);

  const existing = await prisma.supplierRelationship.findUnique({
    where: {
      organizationId_sourceSupplierId_targetSupplierId_relationshipType: {
        organizationId,
        sourceSupplierId,
        targetSupplierId: input.targetSupplierId,
        relationshipType: input.relationshipType,
      },
    },
  });
  if (existing) throw new Error("Relationship already exists");

  const rel = await prisma.supplierRelationship.create({
    data: {
      organizationId,
      sourceSupplierId,
      targetSupplierId: input.targetSupplierId,
      relationshipType: input.relationshipType,
      description: input.description,
      contractReference: input.contractReference,
      program: input.program,
      startDate: input.startDate,
      endDate: input.endDate,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
    include: {
      sourceSupplier: { select: { id: true, name: true, identifier: true } },
      targetSupplier: { select: { id: true, name: true, identifier: true } },
    },
  });

  await recordAuditEvent(
    organizationId,
    "supplier_relationship.created",
    "SupplierRelationship",
    rel.id,
    {
      sourceSupplierId,
      targetSupplierId: input.targetSupplierId,
      relationshipType: input.relationshipType,
    },
  );

  return rel;
}

export async function getRelationships(supplierId: string, organizationId: string) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId, deletedAt: null },
  });
  if (!supplier) throw new NotFoundError("Supplier", supplierId);

  const [outgoing, incoming] = await Promise.all([
    prisma.supplierRelationship.findMany({
      where: { sourceSupplierId: supplierId, organizationId },
      include: {
        targetSupplier: { select: { id: true, name: true, identifier: true, supplierType: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.supplierRelationship.findMany({
      where: { targetSupplierId: supplierId, organizationId },
      include: {
        sourceSupplier: { select: { id: true, name: true, identifier: true, supplierType: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { outgoing, incoming };
}

export async function deleteRelationship(relId: string, organizationId: string) {
  const rel = await prisma.supplierRelationship.findFirst({
    where: { id: relId, organizationId },
  });
  if (!rel) throw new NotFoundError("SupplierRelationship", relId);

  await prisma.supplierRelationship.delete({ where: { id: relId } });

  await recordAuditEvent(
    organizationId,
    "supplier_relationship.deleted",
    "SupplierRelationship",
    relId,
    {
      relationshipType: rel.relationshipType,
    },
  );
}
