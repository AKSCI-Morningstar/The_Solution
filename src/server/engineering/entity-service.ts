import { prisma } from "@/server/db";
import { NotFoundError, ValidationError } from "@/shared/errors";
import { logger } from "@/shared/logging";
import type { CreateEntityInput, UpdateEntityInput } from "./validation";
import { validateLifecycleTransition, entityFilterSchema } from "./validation";
import { recordAudit } from "./audit-service";
import { Prisma } from "@prisma/client";

export async function createEntity(
  organizationId: string,
  input: CreateEntityInput,
  userId: string,
) {
  const existing = await prisma.engineeringEntity.findUnique({
    where: {
      organizationId_identifier: {
        organizationId,
        identifier: input.identifier,
      },
    },
  });

  if (existing && !existing.deletedAt) {
    throw new ValidationError({
      identifier: [`Entity with identifier ${input.identifier} already exists`],
    });
  }

  const entity = await prisma.engineeringEntity.create({
    data: {
      organization: { connect: { id: organizationId } },
      createdBy: { connect: { id: userId } },
      updatedBy: { connect: { id: userId } },
      entityType: input.entityType,
      identifier: input.identifier,
      name: input.name,
      description: input.description ?? null,
      status: input.status ?? "DRAFT",
    },
  });

  await recordAudit(
    entity.id,
    "ENTITY_CREATED",
    { entityType: entity.entityType, identifier: entity.identifier },
    userId,
  );

  logger.info("Engineering entity created", {
    entityId: entity.id,
    type: entity.entityType,
    identifier: entity.identifier,
  });
  return entity;
}

export async function getEntity(entityId: string, organizationId: string) {
  const entity = await prisma.engineeringEntity.findFirst({
    where: { id: entityId, organizationId, deletedAt: null },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      updatedBy: { select: { id: true, name: true, email: true } },
      sourceRelationships: {
        include: {
          targetEntity: { select: { id: true, identifier: true, name: true, entityType: true } },
        },
      },
      targetRelationships: {
        include: {
          sourceEntity: { select: { id: true, identifier: true, name: true, entityType: true } },
        },
      },
      versions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!entity) throw new NotFoundError("EngineeringEntity", entityId);
  return entity;
}

export async function listEntities(organizationId: string, filters: Record<string, string>) {
  const parsed = entityFilterSchema.safeParse(filters);
  if (!parsed.success) throw new ValidationError(parsed.error.flatten().fieldErrors);
  const { entityType, status, search, page, pageSize } = parsed.data;
  const where: Record<string, unknown> = { organizationId, deletedAt: null };

  if (entityType) where.entityType = entityType;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { identifier: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.engineeringEntity.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: "desc" },
      include: {
        createdBy: { select: { id: true, name: true } },
        updatedBy: { select: { id: true, name: true } },
        _count: { select: { sourceRelationships: true, targetRelationships: true } },
      },
    }),
    prisma.engineeringEntity.count({ where }),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function updateEntity(
  entityId: string,
  organizationId: string,
  input: UpdateEntityInput,
  userId: string,
) {
  const entity = await prisma.engineeringEntity.findFirst({
    where: { id: entityId, organizationId, deletedAt: null },
  });

  if (!entity) throw new NotFoundError("EngineeringEntity", entityId);

  const updateData: Record<string, unknown> = {
    name: input.name ?? entity.name,
    description: input.description !== undefined ? input.description : entity.description,
    updatedById: userId,
  };
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.labels !== undefined) updateData.labels = input.labels;
  if (input.metadata !== undefined) updateData.metadata = input.metadata;
  const updated = await prisma.engineeringEntity.update({
    where: { id: entityId },
    data: updateData as Prisma.EngineeringEntityUpdateInput,
  });

  await recordAudit(entity.id, "ENTITY_UPDATED", { changes: Object.keys(input) }, userId);
  return updated;
}

export async function deleteEntity(entityId: string, organizationId: string, userId: string) {
  const entity = await prisma.engineeringEntity.findFirst({
    where: { id: entityId, organizationId, deletedAt: null },
  });

  if (!entity) throw new NotFoundError("EngineeringEntity", entityId);

  await prisma.engineeringEntity.update({
    where: { id: entityId },
    data: { deletedAt: new Date(), updatedById: userId },
  });

  const node = await prisma.graphNodeIndex.findUnique({ where: { entityId } });
  if (node) {
    await prisma.graphEdgeIndex.deleteMany({
      where: { OR: [{ sourceNodeId: node.id }, { targetNodeId: node.id }] },
    });
    await prisma.graphNodeIndex.delete({ where: { id: node.id } });
  }

  await recordAudit(entity.id, "ENTITY_DELETED", {}, userId);
  logger.info("Engineering entity deleted", { entityId, type: entity.entityType });
}

export async function changeEntityStatus(
  entityId: string,
  organizationId: string,
  newStatus: string,
  userId: string,
  reason?: string,
) {
  const entity = await prisma.engineeringEntity.findFirst({
    where: { id: entityId, organizationId, deletedAt: null },
  });

  if (!entity) throw new NotFoundError("EngineeringEntity", entityId);

  const error = validateLifecycleTransition(entity.status, newStatus);
  if (error) throw new ValidationError({ status: [error] });

  const updated = await prisma.engineeringEntity.update({
    where: { id: entityId },
    data: { status: newStatus, updatedById: userId },
  });

  await recordAudit(
    entity.id,
    "STATUS_CHANGED",
    { from: entity.status, to: newStatus, reason },
    userId,
  );
  return updated;
}
