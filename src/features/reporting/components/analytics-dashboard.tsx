"use client";

import { useEffect, useState } from "react";
import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Meter, TrendLine } from "@/components/ui/charts";
import type { AnalyticsSnapshot } from "@/server/reporting/types";

function toBarData(breakdown: Record<string, number>) {
  return Object.entries(breakdown)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export function AnalyticsDashboard() {
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/reporting/analytics");
        const json = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(json.error ?? "Failed to load analytics");
          return;
        }
        if (!cancelled) setSnapshot(json.data);
      } catch {
        if (!cancelled) setError("Failed to load analytics");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="text-destructive text-sm">{error}</p>;
  if (!snapshot) return <p className="text-muted-foreground text-sm">Loading analytics...</p>;

  const { kpis, trends } = snapshot;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total entities" value={kpis.totalEntities} />
        <MetricCard label="Total documents" value={kpis.totalDocuments} />
        <MetricCard label="Total relationships" value={kpis.totalRelationships} />
        <MetricCard label="Open contradictions" value={kpis.openContradictionCount} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coverage and compliance</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Meter label="Evidence completeness" valuePercent={kpis.evidenceCompletenessPercent} />
          <Meter label="Requirement coverage" valuePercent={kpis.requirementCoveragePercent} />
          <Meter label="Rule pass rate" valuePercent={kpis.rulePassRatePercent} />
          <Meter
            label="Contradiction containment"
            valuePercent={Number((100 - kpis.contradictionDensityPercent).toFixed(2))}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Knowledge graph growth (last 30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendLine points={trends.knowledgeGraphGrowth} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Engineering activity (last 30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendLine points={trends.engineeringActivity} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Document activity (last 30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendLine points={trends.documentActivity} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Audit activity (last 30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendLine points={trends.auditActivity} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Entities by type</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={toBarData(snapshot.entityTypeBreakdown)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Rule outcomes</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={toBarData(snapshot.ruleOutcomeBreakdown)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Contradictions by severity</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={toBarData(snapshot.contradictionSeverityBreakdown)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Organization members by role</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={toBarData(snapshot.organizationMemberRoleBreakdown)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
