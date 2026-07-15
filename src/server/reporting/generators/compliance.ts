import { prisma } from "@/server/db";
import { OPEN_CONTRADICTION_STATUSES, SUPPLIER_ENTITY_TYPES } from "../constants";
import type { ReportFiltersInput } from "../validation";
import type { ReportPayload } from "../types";

function dateFilter(filters: ReportFiltersInput) {
  if (!filters.from && !filters.to) return undefined;
  return {
    ...(filters.from ? { gte: filters.from } : {}),
    ...(filters.to ? { lte: filters.to } : {}),
  };
}

/** Contradiction Report - open and resolved contradictions broken down by type and severity. */
export async function generateContradictionReport(
  organizationId: string,
  filters: ReportFiltersInput,
): Promise<ReportPayload> {
  const detectedAt = dateFilter(filters);
  const contradictions = await prisma.contradiction.findMany({
    where: { organizationId, ...(detectedAt ? { detectedAt } : {}) },
    select: {
      id: true,
      type: true,
      severity: true,
      status: true,
      label: true,
      detectedAt: true,
      resolvedAt: true,
    },
    orderBy: { detectedAt: "desc" },
  });

  const openStatuses = new Set<string>(OPEN_CONTRADICTION_STATUSES);
  const rows = contradictions.map((c) => ({
    type: c.type,
    severity: c.severity,
    status: c.status,
    label: c.label,
    open: openStatuses.has(c.status),
    detectedAt: c.detectedAt.toISOString(),
    resolvedAt: c.resolvedAt?.toISOString() ?? null,
  }));

  const openCount = rows.filter((r) => r.open).length;
  const bySeverity: Record<string, number> = {};
  for (const row of rows) bySeverity[row.severity] = (bySeverity[row.severity] ?? 0) + 1;

  return {
    summary: {
      total: rows.length,
      open: openCount,
      resolved: rows.length - openCount,
      ...bySeverity,
    },
    columns: ["type", "severity", "status", "label", "open", "detectedAt", "resolvedAt"],
    rows,
    generatedAt: new Date().toISOString(),
  };
}

/** Rule Compliance Report - rule execution outcomes and the resulting pass rate, per rule. */
export async function generateRuleComplianceReport(
  organizationId: string,
  filters: ReportFiltersInput,
): Promise<ReportPayload> {
  const evaluatedAt = dateFilter(filters);
  const [outcomeGroups, rules] = await Promise.all([
    prisma.ruleExecutionResult.groupBy({
      by: ["ruleId", "outcome"],
      where: { organizationId, ...(evaluatedAt ? { evaluatedAt } : {}) },
      _count: { outcome: true },
    }),
    prisma.rule.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, name: true, category: true, status: true },
    }),
  ]);

  const ruleById = new Map(rules.map((r) => [r.id, r]));
  const byRule = new Map<string, Record<string, number>>();
  for (const group of outcomeGroups) {
    const entry = byRule.get(group.ruleId) ?? {};
    entry[group.outcome] = group._count.outcome;
    byRule.set(group.ruleId, entry);
  }

  const rows = Array.from(byRule.entries()).map(([ruleId, outcomes]) => {
    const total = Object.values(outcomes).reduce((sum, n) => sum + n, 0);
    const passed = outcomes.PASSED ?? 0;
    const rule = ruleById.get(ruleId);
    return {
      ruleName: rule?.name ?? ruleId,
      category: rule?.category ?? "unknown",
      status: rule?.status ?? "unknown",
      totalExecutions: total,
      passed,
      failed: outcomes.FAILED ?? 0,
      passRatePercent: total > 0 ? Number(((passed / total) * 100).toFixed(2)) : 0,
    };
  });

  const totalExecutions = rows.reduce((sum, r) => sum + r.totalExecutions, 0);
  const totalPassed = rows.reduce((sum, r) => sum + r.passed, 0);

  return {
    summary: {
      totalRules: rows.length,
      totalExecutions,
      overallPassRatePercent:
        totalExecutions > 0 ? Number(((totalPassed / totalExecutions) * 100).toFixed(2)) : 0,
    },
    columns: [
      "ruleName",
      "category",
      "status",
      "totalExecutions",
      "passed",
      "failed",
      "passRatePercent",
    ],
    rows,
    generatedAt: new Date().toISOString(),
  };
}

/** Supplier Report - supplier and manufacturer entities plus supplier-related contradictions. */
export async function generateSupplierReport(
  organizationId: string,
  filters: ReportFiltersInput,
): Promise<ReportPayload> {
  const [suppliers, supplierContradictionCount] = await Promise.all([
    prisma.engineeringEntity.findMany({
      where: {
        organizationId,
        deletedAt: null,
        entityType: { in: [...SUPPLIER_ENTITY_TYPES] },
        ...(filters.search ? { name: { contains: filters.search, mode: "insensitive" } } : {}),
      },
      select: { identifier: true, name: true, entityType: true, status: true },
      orderBy: { name: "asc" },
    }),
    prisma.contradiction.count({
      where: { organizationId, type: "SUPPLIER_CONTRADICTION" },
    }),
  ]);

  return {
    summary: {
      totalSuppliers: suppliers.length,
      supplierContradictionCount,
    },
    columns: ["identifier", "name", "entityType", "status"],
    rows: suppliers,
    generatedAt: new Date().toISOString(),
  };
}
