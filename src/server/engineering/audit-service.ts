import { prisma } from "@/server/db";
import { Prisma } from "@prisma/client";

export async function recordAudit(
  entityId: string,
  action: string,
  metadata: Record<string, unknown> = {},
  userId?: string,
) {
  await prisma.entityAuditLog.create({
    data: {
      entityId,
      action,
      metadata: metadata as Prisma.InputJsonValue,
      ...(userId ? { createdById: userId } : {}),
    },
  });
}

export async function listEntityAuditLogs(entityId: string, organizationId: string) {
  const entity = await prisma.engineeringEntity.findFirst({
    where: { id: entityId, organizationId, deletedAt: null },
  });
  if (!entity) return [];

  return prisma.entityAuditLog.findMany({
    where: { entityId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });
}
