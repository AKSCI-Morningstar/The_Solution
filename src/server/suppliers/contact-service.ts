import { prisma } from "@/server/db";
import { NotFoundError } from "@/shared/errors";
import { recordAuditEvent } from "@/server/audit/audit-service";
import type { CreateContactInput } from "./validation";

export async function createContact(
  supplierId: string,
  organizationId: string,
  input: CreateContactInput,
) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId, deletedAt: null },
  });
  if (!supplier) throw new NotFoundError("Supplier", supplierId);

  if (input.isPrimary) {
    await prisma.supplierContact.updateMany({
      where: { supplierId, isPrimary: true, organizationId },
      data: { isPrimary: false },
    });
  }

  const contact = await prisma.supplierContact.create({
    data: {
      organizationId,
      supplierId,
      name: input.name,
      title: input.title,
      email: input.email,
      phone: input.phone,
      mobile: input.mobile,
      role: input.role,
      isPrimary: input.isPrimary ?? false,
      notes: input.notes,
    },
  });

  await recordAuditEvent(
    organizationId,
    "supplier_contact.created",
    "SupplierContact",
    contact.id,
    {
      supplierId,
      name: input.name,
    },
  );

  return contact;
}

export async function getContacts(supplierId: string, organizationId: string) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId, deletedAt: null },
  });
  if (!supplier) throw new NotFoundError("Supplier", supplierId);

  return prisma.supplierContact.findMany({
    where: { supplierId, organizationId },
    orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
  });
}

export async function updateContact(
  contactId: string,
  supplierId: string,
  organizationId: string,
  input: Partial<CreateContactInput>,
) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId, deletedAt: null },
  });
  if (!supplier) throw new NotFoundError("Supplier", supplierId);

  const contact = await prisma.supplierContact.findFirst({
    where: { id: contactId, supplierId, organizationId },
  });
  if (!contact) throw new NotFoundError("SupplierContact", contactId);

  if (input.isPrimary) {
    await prisma.supplierContact.updateMany({
      where: { supplierId, isPrimary: true, id: { not: contactId }, organizationId },
      data: { isPrimary: false },
    });
  }

  const updated = await prisma.supplierContact.update({
    where: { id: contactId },
    data: input,
  });

  await recordAuditEvent(organizationId, "supplier_contact.updated", "SupplierContact", contactId, {
    supplierId,
    changes: Object.keys(input),
  });

  return updated;
}

export async function deleteContact(contactId: string, supplierId: string, organizationId: string) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId, deletedAt: null },
  });
  if (!supplier) throw new NotFoundError("Supplier", supplierId);

  const contact = await prisma.supplierContact.findFirst({
    where: { id: contactId, supplierId, organizationId },
  });
  if (!contact) throw new NotFoundError("SupplierContact", contactId);

  await prisma.supplierContact.delete({ where: { id: contactId } });

  await recordAuditEvent(organizationId, "supplier_contact.deleted", "SupplierContact", contactId, {
    supplierId,
    name: contact.name,
  });
}
