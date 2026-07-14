import { prisma } from "@/server/db";
import type { TraceabilityGraph, TraceabilityRecord } from "./types";

export async function buildTraceabilityGraph(
  organizationId: string,
  rootEntityId: string,
  maxDepth: number,
): Promise<TraceabilityGraph> {
  const records: TraceabilityRecord[] = [];
  const visited = new Set<string>();
  const queue: { entityId: string; path: string[]; depth: number }[] = [
    { entityId: rootEntityId, path: [], depth: 0 },
  ];

  while (queue.length > 0) {
    const { entityId, path, depth } = queue.shift()!;
    if (visited.has(entityId) || depth > maxDepth) continue;
    visited.add(entityId);

    const entity = await prisma.engineeringEntity.findFirst({
      where: { id: entityId, organizationId, deletedAt: null },
      include: {
        sourceRelationships: {
          include: {
            targetEntity: {
              select: {
                id: true,
                identifier: true,
                name: true,
                entityType: true,
                status: true,
                version: true,
                updatedAt: true,
              },
            },
          },
        },
        targetRelationships: {
          include: {
            sourceEntity: {
              select: {
                id: true,
                identifier: true,
                name: true,
                entityType: true,
                status: true,
                version: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    if (!entity) continue;

    const docRefs = await prisma.extractedEntity.findMany({
      where: {
        organizationId,
        linkedEntityId: entity.id,
        status: { not: "REJECTED" },
      },
      include: {
        document: {
          select: { id: true, fileName: true, currentVersion: true },
        },
      },
    });

    if (docRefs.length > 0) {
      for (const doc of docRefs) {
        records.push({
          entityId: entity.id,
          entityName: entity.name,
          entityType: entity.entityType,
          entityIdentifier: entity.identifier,
          entityVersion: entity.version,
          entityStatus: entity.status,
          documentId: doc.document.id,
          documentName: doc.document.fileName,
          documentVersion: doc.document.currentVersion,
          page: doc.page ?? undefined,
          section: doc.section ?? undefined,
          relationshipPath: path,
          extractionMethod: doc.extractionMethod,
          organizationId,
          timestamp: entity.updatedAt.toISOString(),
        });
      }
    } else {
      records.push({
        entityId: entity.id,
        entityName: entity.name,
        entityType: entity.entityType,
        entityIdentifier: entity.identifier,
        entityVersion: entity.version,
        entityStatus: entity.status,
        relationshipPath: path,
        organizationId,
        timestamp: entity.updatedAt.toISOString(),
      });
    }

    for (const rel of entity.sourceRelationships) {
      const target = rel.targetEntity;
      if (!visited.has(target.id) && depth + 1 <= maxDepth) {
        queue.push({
          entityId: target.id,
          path: [...path, `${rel.relationshipType}->${target.name}`],
          depth: depth + 1,
        });
      }
    }

    for (const rel of entity.targetRelationships) {
      const source = rel.sourceEntity;
      if (!visited.has(source.id) && depth + 1 <= maxDepth) {
        queue.push({
          entityId: source.id,
          path: [...path, `${source.name}->${rel.relationshipType}`],
          depth: depth + 1,
        });
      }
    }
  }

  return {
    rootEntityId,
    records,
    totalRecords: records.length,
  };
}
