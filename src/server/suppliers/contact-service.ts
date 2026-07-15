import { prisma } from "@/server/db";
import { NotFoundError } from "@/shared/errors";
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
      where: { supplierId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  return prisma.supplierContact.create({
    data: {
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
}

export async function getContacts(supplierId: string, organizationId: string) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId, deletedAt: null },
  });
  if (!supplier) throw new NotFoundError("Supplier", supplierId);

  return prisma.supplierContact.findMany({
    where: { supplierId },
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
    where: { id: contactId, supplierId },
  });
  if (!contact) throw new NotFoundError("SupplierContact", contactId);

  if (input.isPrimary) {
    await prisma.supplierContact.updateMany({
      where: { supplierId, isPrimary: true, id: { not: contactId } },
      data: { isPrimary: false },
    });
  }

  return prisma.supplierContact.update({
    where: { id: contactId },
    data: input,
  });
}

export async function deleteContact(contactId: string, supplierId: string, organizationId: string) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId, deletedAt: null },
  });
  if (!supplier) throw new NotFoundError("Supplier", supplierId);

  const contact = await prisma.supplierContact.findFirst({
    where: { id: contactId, supplierId },
  });
  if (!contact) throw new NotFoundError("SupplierContact", contactId);

  await prisma.supplierContact.delete({ where: { id: contactId } });
}
