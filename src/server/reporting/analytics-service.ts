import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { DEFAULT_TREND_WINDOW_DAYS, OPEN_CONTRADICTION_STATUSES } from "./constants";
import type { AnalyticsSnapshot, TrendPoint } from "./types";

function percent(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

/**
 * Buckets row counts by day for one organization-scoped table over a trailing
 * window. `tableName` is always a hardcoded literal supplied by call sites in
 * this file - never user input - so composing it into the raw query via
 * `Prisma.raw` is safe. Every table this is called with has `organizationId`
 * and `createdAt` columns.
 */
async function getDailyCounts(
  tableName: string,
  organizationId: string,
  since: Date,
): Promise<TrendPoint[]> {
  const rows = await prisma.$queryRaw<{ day: Date; count: bigint }[]>(
    Prisma.sql`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count
      FROM ${Prisma.raw(`"${tableName}"`)}
      WHERE "organizationId" = ${organizationId} AND "createdAt" >= ${since}
      GROUP BY day
      ORDER BY day ASC
    `,
  );
  return rows.map((row) => ({
    date: row.day.toISOString().slice(0, 10),
    count: Number(row.count),
  }));
}

/**
 * Computes the full deterministic analytics snapshot for an organization -
 * every number here is a direct aggregation over data other subsystems
 * already persisted (Engineering, Evidence, Rule, Contradiction, Knowledge
 * Graph, Ingestion, Audit, Organization). Nothing is inferred or estimated.
 */
export async function getAnalyticsSnapshot(
  organizationId: string,
  trendWindowDays: number = DEFAULT_TREND_WINDOW_DAYS,
): Promise<AnalyticsSnapshot> {
  const since = new Date(Date.now() - trendWindowDays * 24 * 60 * 60 * 1000);

  const [
    totalEntities,
    totalDocuments,
    totalRelationships,
    entitiesWithLinkedEvidence,
    requirementEntities,
    requirementsWithRelationships,
    ruleOutcomeGroups,
    totalContradictions,
    openContradictionCount,
    contradictionSeverityGroups,
    graphNodeCount,
    graphEdgeCount,
    entityTypeGroups,
    memberRoleGroups,
    knowledgeGraphGrowth,
    engineeringActivity,
    documentActivity,
    auditActivity,
  ] = await Promise.all([
    prisma.engineeringEntity.count({ where: { organizationId, deletedAt: null } }),
    prisma.ingestionDocument.count({ where: { organizationId, deletedAt: null } }),
    prisma.engineeringRelationship.count({ where: { organizationId } }),
    prisma.extractedEntity.findMany({
      where: { organizationId, linkedEntityId: { not: null } },
      select: { linkedEntityId: true },
      distinct: ["linkedEntityId"],
    }),
    prisma.engineeringEntity.count({
      where: { organizationId, deletedAt: null, entityType: "REQUIREMENT" },
    }),
    prisma.engineeringEntity.findMany({
      where: {
        organizationId,
        deletedAt: null,
        entityType: "REQUIREMENT",
        OR: [{ sourceRelationships: { some: {} } }, { targetRelationships: { some: {} } }],
      },
      select: { id: true },
    }),
    prisma.ruleExecutionResult.groupBy({
      by: ["outcome"],
      where: { organizationId },
      _count: { outcome: true },
    }),
    prisma.contradiction.count({ where: { organizationId } }),
    prisma.contradiction.count({
      where: { organizationId, status: { in: [...OPEN_CONTRADICTION_STATUSES] } },
    }),
    prisma.contradiction.groupBy({
      by: ["severity"],
      where: { organizationId },
      _count: { severity: true },
    }),
    prisma.graphNodeIndex.count({ where: { organizationId } }),
    prisma.graphEdgeIndex.count({ where: { organizationId } }),
    prisma.engineeringEntity.groupBy({
      by: ["entityType"],
      where: { organizationId, deletedAt: null },
      _count: { entityType: true },
    }),
    prisma.organizationMember.groupBy({
      by: ["role"],
      where: { organizationId },
      _count: { role: true },
    }),
    getDailyCounts("GraphNodeIndex", organizationId, since),
    getDailyCounts("EngineeringEntity", organizationId, since),
    getDailyCounts("IngestionDocument", organizationId, since),
    getDailyCounts("AuditLog", organizationId, since),
  ]);

  const ruleOutcomeBreakdown = Object.fromEntries(
    ruleOutcomeGroups.map((g) => [g.outcome, g._count.outcome]),
  );
  const totalRuleResults = ruleOutcomeGroups.reduce((sum, g) => sum + g._count.outcome, 0);
  const passedRuleResults = ruleOutcomeBreakdown.PASSED ?? 0;

  return {
    generatedAt: new Date().toISOString(),
    kpis: {
      totalEntities,
      totalDocuments,
      totalRelationships,
      evidenceCompletenessPercent: percent(entitiesWithLinkedEvidence.length, totalEntities),
      requirementCoveragePercent: percent(
        requirementsWithRelationships.length,
        requirementEntities,
      ),
      rulePassRatePercent: percent(passedRuleResults, totalRuleResults),
      contradictionDensityPercent: percent(totalContradictions, totalEntities),
      openContradictionCount,
      knowledgeGraphNodeCount: graphNodeCount,
      knowledgeGraphEdgeCount: graphEdgeCount,
    },
    trends: {
      knowledgeGraphGrowth,
      engineeringActivity,
      documentActivity,
      auditActivity,
    },
    ruleOutcomeBreakdown,
    contradictionSeverityBreakdown: Object.fromEntries(
      contradictionSeverityGroups.map((g) => [g.severity, g._count.severity]),
    ),
    entityTypeBreakdown: Object.fromEntries(
      entityTypeGroups.map((g) => [g.entityType, g._count.entityType]),
    ),
    organizationMemberRoleBreakdown: Object.fromEntries(
      memberRoleGroups.map((g) => [g.role, g._count.role]),
    ),
  };
}

/** A curated KPI subset of the full analytics snapshot, for the dashboard's summary cards. */
export async function getDashboardKpis(organizationId: string) {
  const snapshot = await getAnalyticsSnapshot(organizationId);
  return {
    generatedAt: snapshot.generatedAt,
    kpis: snapshot.kpis,
    recentTrends: {
      knowledgeGraphGrowth: snapshot.trends.knowledgeGraphGrowth.slice(-7),
      engineeringActivity: snapshot.trends.engineeringActivity.slice(-7),
    },
  };
}
