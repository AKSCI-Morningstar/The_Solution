import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { NotFoundError } from "@/shared/errors";
import { recordAuditEvent } from "@/server/audit/audit-service";
import type { CreateCertificationInput, UpdateCertificationInput } from "./validation";

export async function createCertification(
  supplierId: string,
  organizationId: string,
  input: CreateCertificationInput,
) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId, deletedAt: null },
  });
  if (!supplier) throw new NotFoundError("Supplier", supplierId);

  const certification = await prisma.supplierCertification.create({
    data: {
      organizationId,
      supplierId,
      certificationType: input.certificationType,
      certificationName: input.certificationName,
      issuingBody: input.issuingBody,
      certificateNumber: input.certificateNumber,
      issueDate: input.issueDate,
      expiryDate: input.expiryDate,
      status: input.status,
      scope: input.scope,
      evidenceUrl: input.evidenceUrl,
      evidenceDocumentId: input.evidenceDocumentId,
      notes: input.notes,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });

  await recordAuditEvent(
    organizationId,
    "certification.created",
    "SupplierCertification",
    certification.id,
    {
      supplierId,
      certificationType: input.certificationType,
    },
  );

  return certification;
}

export async function getCertifications(supplierId: string, organizationId: string) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId, deletedAt: null },
  });
  if (!supplier) throw new NotFoundError("Supplier", supplierId);

  return prisma.supplierCertification.findMany({
    where: { supplierId, organizationId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCertification(certId: string, supplierId: string, organizationId: string) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId, deletedAt: null },
  });
  if (!supplier) throw new NotFoundError("Supplier", supplierId);

  const cert = await prisma.supplierCertification.findFirst({
    where: { id: certId, supplierId, organizationId },
  });
  if (!cert) throw new NotFoundError("SupplierCertification", certId);
  return cert;
}

export async function updateCertification(
  certId: string,
  supplierId: string,
  organizationId: string,
  input: UpdateCertificationInput,
) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId, deletedAt: null },
  });
  if (!supplier) throw new NotFoundError("Supplier", supplierId);

  const existing = await prisma.supplierCertification.findFirst({
    where: { id: certId, supplierId, organizationId },
  });
  if (!existing) throw new NotFoundError("SupplierCertification", certId);

  const data: Record<string, unknown> = {};
  const fields: (keyof UpdateCertificationInput)[] = [
    "certificationType",
    "certificationName",
    "issuingBody",
    "certificateNumber",
    "issueDate",
    "expiryDate",
    "status",
    "scope",
    "evidenceUrl",
    "evidenceDocumentId",
    "notes",
  ];
  for (const field of fields) {
    if (input[field] !== undefined) data[field] = input[field];
  }
  if (input.metadata !== undefined) data.metadata = input.metadata as Prisma.InputJsonValue;

  const updated = await prisma.supplierCertification.update({ where: { id: certId }, data });

  await recordAuditEvent(organizationId, "certification.updated", "SupplierCertification", certId, {
    supplierId,
    changes: Object.keys(input),
  });

  return updated;
}

export async function deleteCertification(
  certId: string,
  supplierId: string,
  organizationId: string,
) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId, deletedAt: null },
  });
  if (!supplier) throw new NotFoundError("Supplier", supplierId);

  const cert = await prisma.supplierCertification.findFirst({
    where: { id: certId, supplierId, organizationId },
  });
  if (!cert) throw new NotFoundError("SupplierCertification", certId);

  await prisma.supplierCertification.delete({ where: { id: certId } });

  await recordAuditEvent(organizationId, "certification.deleted", "SupplierCertification", certId, {
    supplierId,
    certificationType: cert.certificationType,
  });
}

export async function getExpiringCertifications(organizationId: string, withinDays = 90) {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + withinDays);

  return prisma.supplierCertification.findMany({
    where: {
      status: "ACTIVE",
      expiryDate: { lte: threshold },
      organizationId,
      supplier: { organizationId, deletedAt: null },
    },
    include: {
      supplier: { select: { id: true, name: true, identifier: true } },
    },
    orderBy: { expiryDate: "asc" },
  });
}
