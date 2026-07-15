import { prisma } from "@/server/db";
import { getAnalyticsSnapshot } from "../analytics-service";
import type { ReportFiltersInput } from "../validation";
import type { ReportPayload } from "../types";

function buildEntityWhere(organizationId: string, filters: ReportFiltersInput) {
  return {
    organizationId,
    deletedAt: null,
    ...(filters.entityType ? { entityType: filters.entityType } : {}),
    ...(filters.search ? { name: { contains: filters.search, mode: "insensitive" as const } } : {}),
    ...(filters.from || filters.to
      ? {
          createdAt: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
  };
}

/** Engineering Report - entity counts, statuses, and relationship density across the engineering graph. */
export async function generateEngineeringReport(
  organizationId: string,
  filters: ReportFiltersInput,
): Promise<ReportPayload> {
  const where = buildEntityWhere(organizationId, filters);
  const [totalRelationships, entityTypeGroups] = await Promise.all([
    prisma.engineeringRelationship.count({ where: { organizationId } }),
    prisma.engineeringEntity.groupBy({ by: ["entityType"], where, _count: { entityType: true } }),
  ]);

  const totalEntities = entityTypeGroups.reduce((sum, g) => sum + g._count.entityType, 0);
  const rows = entityTypeGroups
    .sort((a, b) => b._count.entityType - a._count.entityType)
    .map((g) => ({
      entityType: g.entityType,
      count: g._count.entityType,
      percentOfTotal:
        totalEntities > 0 ? Number(((g._count.entityType / totalEntities) * 100).toFixed(2)) : 0,
    }));

  return {
    summary: { totalEntities, totalRelationships, distinctEntityTypes: entityTypeGroups.length },
    columns: ["entityType", "count", "percentOfTotal"],
    rows,
    generatedAt: new Date().toISOString(),
  };
}

/** Requirement Coverage Report - what share of requirements have at least one traceable relationship. */
export async function generateRequirementCoverageReport(
  organizationId: string,
  filters: ReportFiltersInput,
): Promise<ReportPayload> {
  const where = { ...buildEntityWhere(organizationId, filters), entityType: "REQUIREMENT" };
  const requirements = await prisma.engineeringEntity.findMany({
    where,
    select: {
      id: true,
      identifier: true,
      name: true,
      status: true,
      _count: { select: { sourceRelationships: true, targetRelationships: true } },
    },
  });

  const rows = requirements.map((r) => {
    const relationshipCount = r._count.sourceRelationships + r._count.targetRelationships;
    return {
      identifier: r.identifier,
      name: r.name,
      status: r.status,
      relationshipCount,
      covered: relationshipCount > 0,
    };
  });
  const coveredCount = rows.filter((r) => r.covered).length;

  return {
    summary: {
      totalRequirements: rows.length,
      coveredRequirements: coveredCount,
      coveragePercent:
        rows.length > 0 ? Number(((coveredCount / rows.length) * 100).toFixed(2)) : 0,
    },
    columns: ["identifier", "name", "status", "relationshipCount", "covered"],
    rows,
    generatedAt: new Date().toISOString(),
  };
}

/** Evidence Coverage Report - what share of entities have at least one linked evidence reference. */
export async function generateEvidenceCoverageReport(
  organizationId: string,
  filters: ReportFiltersInput,
): Promise<ReportPayload> {
  const where = buildEntityWhere(organizationId, filters);
  const [entities, linkedExtractions] = await Promise.all([
    prisma.engineeringEntity.findMany({
      where,
      select: { id: true, identifier: true, name: true, entityType: true },
    }),
    prisma.extractedEntity.findMany({
      where: { organizationId, linkedEntityId: { not: null } },
      select: { linkedEntityId: true },
    }),
  ]);

  const evidenceCountByEntity = new Map<string, number>();
  for (const extraction of linkedExtractions) {
    if (!extraction.linkedEntityId) continue;
    evidenceCountByEntity.set(
      extraction.linkedEntityId,
      (evidenceCountByEntity.get(extraction.linkedEntityId) ?? 0) + 1,
    );
  }

  const rows = entities.map((e) => {
    const evidenceCount = evidenceCountByEntity.get(e.id) ?? 0;
    return {
      identifier: e.identifier,
      name: e.name,
      entityType: e.entityType,
      evidenceCount,
      hasEvidence: evidenceCount > 0,
    };
  });
  const withEvidence = rows.filter((r) => r.hasEvidence).length;

  return {
    summary: {
      totalEntities: rows.length,
      entitiesWithEvidence: withEvidence,
      coveragePercent:
        rows.length > 0 ? Number(((withEvidence / rows.length) * 100).toFixed(2)) : 0,
    },
    columns: ["identifier", "name", "entityType", "evidenceCount", "hasEvidence"],
    rows,
    generatedAt: new Date().toISOString(),
  };
}

/** Knowledge Graph Statistics - node and edge counts and growth over time. */
export async function generateKnowledgeGraphStatisticsReport(
  organizationId: string,
): Promise<ReportPayload> {
  const [nodeGroups, totalEdges, snapshot] = await Promise.all([
    prisma.graphNodeIndex.groupBy({
      by: ["entityType"],
      where: { organizationId },
      _count: { entityType: true },
    }),
    prisma.graphEdgeIndex.count({ where: { organizationId } }),
    getAnalyticsSnapshot(organizationId),
  ]);

  const totalNodes = nodeGroups.reduce((sum, g) => sum + g._count.entityType, 0);
  const rows = nodeGroups
    .sort((a, b) => b._count.entityType - a._count.entityType)
    .map((g) => ({ entityType: g.entityType, nodeCount: g._count.entityType }));

  return {
    summary: {
      totalNodes,
      totalEdges,
      growthLast7Days: snapshot.trends.knowledgeGraphGrowth
        .slice(-7)
        .reduce((s, p) => s + p.count, 0),
    },
    columns: ["entityType", "nodeCount"],
    rows,
    generatedAt: new Date().toISOString(),
  };
}
