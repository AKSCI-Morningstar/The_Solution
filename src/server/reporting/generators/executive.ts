import { prisma } from "@/server/db";
import { getAnalyticsSnapshot } from "../analytics-service";
import { HIGH_RISK_CONTRADICTION_SEVERITIES, OPEN_CONTRADICTION_STATUSES } from "../constants";
import type { ReportPayload } from "../types";

/** Executive Report - a single-page rollup of every KPI in this platform. */
export async function generateExecutiveReport(organizationId: string): Promise<ReportPayload> {
  const snapshot = await getAnalyticsSnapshot(organizationId);

  const rows = Object.entries(snapshot.kpis).map(([metric, value]) => ({ metric, value }));

  return {
    summary: { generatedAt: snapshot.generatedAt, kpiCount: rows.length },
    columns: ["metric", "value"],
    rows,
    generatedAt: snapshot.generatedAt,
  };
}

/**
 * Engineering Health Report - a composite view combining rule compliance,
 * evidence coverage, requirement coverage, and contradiction density into one
 * deterministic score per dimension (a plain average of the underlying
 * percentages - not a probabilistic or inferred score).
 */
export async function generateEngineeringHealthReport(
  organizationId: string,
): Promise<ReportPayload> {
  const snapshot = await getAnalyticsSnapshot(organizationId);
  const { kpis } = snapshot;

  const dimensions = [
    { dimension: "Rule Compliance", score: kpis.rulePassRatePercent },
    { dimension: "Evidence Coverage", score: kpis.evidenceCompletenessPercent },
    { dimension: "Requirement Coverage", score: kpis.requirementCoveragePercent },
    {
      dimension: "Contradiction Containment",
      score: Number((100 - kpis.contradictionDensityPercent).toFixed(2)),
    },
  ];
  const overallHealthScore = Number(
    (dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length).toFixed(2),
  );

  const rows = dimensions.map((d) => ({
    ...d,
    status: d.score >= 90 ? "HEALTHY" : d.score >= 70 ? "ATTENTION_NEEDED" : "AT_RISK",
  }));

  return {
    summary: { overallHealthScore, openContradictionCount: kpis.openContradictionCount },
    columns: ["dimension", "score", "status"],
    rows,
    generatedAt: snapshot.generatedAt,
  };
}

/** Risk Summary Report - open high-severity contradictions, failed rules, and missing-evidence entities. */
export async function generateRiskSummaryReport(organizationId: string): Promise<ReportPayload> {
  const [contradictions, failedRuleResults, entities, linkedExtractions] = await Promise.all([
    prisma.contradiction.findMany({
      where: {
        organizationId,
        status: { in: [...OPEN_CONTRADICTION_STATUSES] },
        severity: { in: [...HIGH_RISK_CONTRADICTION_SEVERITIES] },
      },
      select: { label: true, severity: true, detectedAt: true },
      orderBy: { detectedAt: "desc" },
      take: 100,
    }),
    prisma.ruleExecutionResult.findMany({
      where: { organizationId, outcome: "FAILED" },
      select: { ruleId: true, evaluatedAt: true, rule: { select: { name: true, severity: true } } },
      orderBy: { evaluatedAt: "desc" },
      take: 100,
    }),
    prisma.engineeringEntity.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, identifier: true, name: true },
    }),
    prisma.extractedEntity.findMany({
      where: { organizationId, linkedEntityId: { not: null } },
      select: { linkedEntityId: true },
    }),
  ]);

  const linkedIds = new Set(linkedExtractions.map((e) => e.linkedEntityId));
  const missingEvidenceEntities = entities.filter((e) => !linkedIds.has(e.id)).slice(0, 100);

  const rows = [
    ...contradictions.map((c) => ({
      riskType: "CONTRADICTION",
      label: c.label,
      severity: c.severity,
      detectedAt: c.detectedAt.toISOString(),
    })),
    ...failedRuleResults.map((r) => ({
      riskType: "RULE_FAILURE",
      label: r.rule.name,
      severity: r.rule.severity,
      detectedAt: r.evaluatedAt.toISOString(),
    })),
    ...missingEvidenceEntities.map((e) => ({
      riskType: "MISSING_EVIDENCE",
      label: `${e.identifier} - ${e.name}`,
      severity: "INFORMATION_ONLY",
      detectedAt: null,
    })),
  ];

  return {
    summary: {
      totalRisks: rows.length,
      openHighRiskContradictions: contradictions.length,
      failedRuleCount: failedRuleResults.length,
      missingEvidenceCount: missingEvidenceEntities.length,
    },
    columns: ["riskType", "label", "severity", "detectedAt"],
    rows,
    generatedAt: new Date().toISOString(),
  };
}
