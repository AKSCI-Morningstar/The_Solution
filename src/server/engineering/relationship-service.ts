import { prisma } from "@/server/db";
import { NotFoundError, ValidationError } from "@/shared/errors";
import { logger } from "@/shared/logging";
import type { CreateRelationshipInput } from "./validation";
import { relationshipFilterSchema } from "./validation";
import { recordAudit } from "./audit-service";
import { Prisma } from "@prisma/client";

export async function createRelationship(
  organizationId: string,
  input: CreateRelationshipInput,
  userId: string,
) {
  if (input.sourceEntityId === input.targetEntityId) {
    throw new ValidationError({ sourceEntityId: ["Cannot create a relationship to itself"] });
  }

  const [source, target] = await Promise.all([
    prisma.engineeringEntity.findFirst({
      where: { id: input.sourceEntityId, organizationId, deletedAt: null },
    }),
    prisma.engineeringEntity.findFirst({
      where: { id: input.targetEntityId, organizationId, deletedAt: null },
    }),
  ]);

  if (!source) throw new NotFoundError("Source entity", input.sourceEntityId);
  if (!target) throw new NotFoundError("Target entity", input.targetEntityId);

  const existing = await prisma.engineeringRelationship.findUnique({
    where: {
      organizationId_sourceEntityId_targetEntityId_relationshipType: {
        organizationId,
        sourceEntityId: input.sourceEntityId,
        targetEntityId: input.targetEntityId,
        relationshipType: input.relationshipType,
      },
    },
  });

  if (existing) {
    throw new ValidationError({ relationship: ["This relationship already exists"] });
  }

  const relationship = await prisma.engineeringRelationship.create({
    data: {
      organizationId,
      sourceEntityId: input.sourceEntityId,
      targetEntityId: input.targetEntityId,
      relationshipType: input.relationshipType,
      metadata: (input.metadata ?? Prisma.DbNull) as Prisma.InputJsonValue,
      createdById: userId,
    },
    include: {
      sourceEntity: { select: { id: true, identifier: true, name: true, entityType: true } },
      targetEntity: { select: { id: true, identifier: true, name: true, entityType: true } },
    },
  });

  await recordAudit(
    input.sourceEntityId,
    "RELATIONSHIP_CREATED",
    { relationshipType: input.relationshipType, targetEntityId: input.targetEntityId },
    userId,
  );
  await recordAudit(
    input.targetEntityId,
    "RELATIONSHIP_CREATED",
    { relationshipType: input.relationshipType, sourceEntityId: input.sourceEntityId },
    userId,
  );

  logger.info("Engineering relationship created", {
    relationshipId: relationship.id,
    type: input.relationshipType,
  });
  return relationship;
}

export async function listRelationships(organizationId: string, filters: Record<string, string>) {
  const parsed = relationshipFilterSchema.safeParse(filters);
  if (!parsed.success) throw new ValidationError(parsed.error.flatten().fieldErrors);
  const { sourceEntityId, targetEntityId, relationshipType, page, pageSize } = parsed.data;
  const where: Record<string, unknown> = { organizationId };

  if (sourceEntityId) where.sourceEntityId = sourceEntityId;
  if (targetEntityId) where.targetEntityId = targetEntityId;
  if (relationshipType) where.relationshipType = relationshipType;

  const [data, total] = await Promise.all([
    prisma.engineeringRelationship.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        sourceEntity: { select: { id: true, identifier: true, name: true, entityType: true } },
        targetEntity: { select: { id: true, identifier: true, name: true, entityType: true } },
        createdBy: { select: { id: true, name: true } },
      },
    }),
    prisma.engineeringRelationship.count({ where }),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function deleteRelationship(
  relationshipId: string,
  organizationId: string,
  userId: string,
) {
  const relationship = await prisma.engineeringRelationship.findFirst({
    where: { id: relationshipId, organizationId },
  });

  if (!relationship) throw new NotFoundError("EngineeringRelationship", relationshipId);

  await prisma.engineeringRelationship.delete({ where: { id: relationshipId } });
  await prisma.graphEdgeIndex.deleteMany({ where: { relationshipId } });

  await recordAudit(
    relationship.sourceEntityId,
    "RELATIONSHIP_REMOVED",
    {
      relationshipType: relationship.relationshipType,
      targetEntityId: relationship.targetEntityId,
    },
    userId,
  );
  await recordAudit(
    relationship.targetEntityId,
    "RELATIONSHIP_REMOVED",
    {
      relationshipType: relationship.relationshipType,
      sourceEntityId: relationship.sourceEntityId,
    },
    userId,
  );

  logger.info("Engineering relationship deleted", { relationshipId });
}

export async function getEntityRelationships(entityId: string, organizationId: string) {
  const entity = await prisma.engineeringEntity.findFirst({
    where: { id: entityId, organizationId, deletedAt: null },
  });
  if (!entity) throw new NotFoundError("EngineeringEntity", entityId);

  const [incoming, outgoing] = await Promise.all([
    prisma.engineeringRelationship.findMany({
      where: { targetEntityId: entityId, organizationId },
      include: {
        sourceEntity: { select: { id: true, identifier: true, name: true, entityType: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.engineeringRelationship.findMany({
      where: { sourceEntityId: entityId, organizationId },
      include: {
        targetEntity: { select: { id: true, identifier: true, name: true, entityType: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { incoming, outgoing };
}
