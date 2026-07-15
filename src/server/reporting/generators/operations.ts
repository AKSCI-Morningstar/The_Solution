import { prisma } from "@/server/db";
import type { ReportFiltersInput } from "../validation";
import type { ReportPayload } from "../types";

function dateFilter(filters: ReportFiltersInput) {
  if (!filters.from && !filters.to) return undefined;
  return {
    ...(filters.from ? { gte: filters.from } : {}),
    ...(filters.to ? { lte: filters.to } : {}),
  };
}

/** Document Activity Report - ingestion document and job volume, status breakdown, recent activity. */
export async function generateDocumentActivityReport(
  organizationId: string,
  filters: ReportFiltersInput,
): Promise<ReportPayload> {
  const createdAt = dateFilter(filters);
  const [documents, statusGroups] = await Promise.all([
    prisma.ingestionDocument.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(createdAt ? { createdAt } : {}),
        ...(filters.search ? { fileName: { contains: filters.search, mode: "insensitive" } } : {}),
      },
      select: {
        fileName: true,
        status: true,
        currentVersion: true,
        createdAt: true,
        _count: { select: { jobs: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.ingestionDocument.groupBy({
      by: ["status"],
      where: { organizationId, deletedAt: null },
      _count: { status: true },
    }),
  ]);

  const rows = documents.map((d) => ({
    fileName: d.fileName,
    status: d.status,
    currentVersion: d.currentVersion,
    jobCount: d._count.jobs,
    createdAt: d.createdAt.toISOString(),
  }));

  return {
    summary: {
      totalDocuments: rows.length,
      ...Object.fromEntries(statusGroups.map((g) => [`status_${g.status}`, g._count.status])),
    },
    columns: ["fileName", "status", "currentVersion", "jobCount", "createdAt"],
    rows,
    generatedAt: new Date().toISOString(),
  };
}

/** Audit Report - audit log activity by action, entity, and actor over time. */
export async function generateAuditReport(
  organizationId: string,
  filters: ReportFiltersInput,
): Promise<ReportPayload> {
  const createdAt = dateFilter(filters);
  const [events, actionGroups] = await Promise.all([
    prisma.auditLog.findMany({
      where: { organizationId, ...(createdAt ? { createdAt } : {}) },
      select: { action: true, entity: true, entityId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.auditLog.groupBy({
      by: ["action"],
      where: { organizationId },
      _count: { action: true },
    }),
  ]);

  const rows = events.map((e) => ({
    action: e.action,
    entity: e.entity,
    entityId: e.entityId,
    createdAt: e.createdAt.toISOString(),
  }));

  return {
    summary: {
      totalEvents: rows.length,
      distinctActions: actionGroups.length,
    },
    columns: ["action", "entity", "entityId", "createdAt"],
    rows,
    generatedAt: new Date().toISOString(),
  };
}
