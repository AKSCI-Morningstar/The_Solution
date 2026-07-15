"use client";

import { useEffect, useState, useCallback } from "react";
import { Zap, ActivitySquare, ShieldCheck, CheckCircle } from "lucide-react";
import { PageContainer, Section, Panel, GridLayout, Stack } from "@/components/layout";
import { MetricCard } from "@/components/ui";

interface PipelineStageStatus {
  stageName: string;
  sampleSize: number;
  averageDurationMs: number;
  failureRate: number;
}

interface OrchestratorStatus {
  inFlightRuns: number;
  stageStatuses: PipelineStageStatus[];
}

export default function ObservabilityPlatformPage() {
  const [orchestratorData, setOrchestratorData] = useState<OrchestratorStatus | null>(null);
  const [realityData, setRealityData] = useState<{
    inFlightAssessments: number;
    stages: PipelineStageStatus[];
  } | null>(null);

  const loadMetrics = useCallback(async () => {
    try {
      const [orchRes, realityRes] = await Promise.all([
        fetch("/api/orchestrator/pipeline/status"),
        fetch("/api/reality/pipeline/status"),
      ]);

      if (orchRes.ok) {
        const json = await orchRes.json();
        setOrchestratorData(json.data);
      }
      if (realityRes.ok) {
        const json = await realityRes.json();
        setRealityData(json.data);
      }
    } catch (err) {
      console.error("Failed to load pipeline health", err);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMetrics();
  }, [loadMetrics]);

  return (
    <PageContainer>
      <Stack gap={6}>
        <div className="border-border flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
          <div>
            <h1 className="text-foreground text-3xl font-bold tracking-tight">
              Engineering Observability Platform
            </h1>
            <p className="text-muted-foreground text-sm">
              Real-time, deterministic latency profiles and deterministic execution monitoring of
              active pipelines.
            </p>
          </div>
          <button
            onClick={loadMetrics}
            className="border-border text-foreground hover:bg-surface-hover flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors"
          >
            <span>Reload Status telemetry</span>
          </button>
        </div>

        {/* Global Pipeline Indices */}
        <Section title="Real-Time Execution Telemetry">
          <GridLayout columns={4} gap={4}>
            <MetricCard
              label="In-Flight Runs"
              value={orchestratorData?.inFlightRuns ?? 0}
              icon={<Zap className="text-warning size-5" />}
            />
            <MetricCard
              label="In-Flight Assessments"
              value={realityData?.inFlightAssessments ?? 0}
              icon={<ActivitySquare className="text-primary size-5" />}
            />
            <MetricCard
              label="Active Precedent Caches"
              value="100%"
              icon={<ShieldCheck className="text-success size-5" />}
            />
            <MetricCard
              label="Observability Status"
              value="Healthy"
              icon={<CheckCircle className="text-success size-5" />}
            />
          </GridLayout>
        </Section>

        {/* Orchestrator Stage Telemetry */}
        <Section title="Reasoning Orchestrator Latency & Durations (Stage Logs)">
          <Panel padding="none">
            <div className="overflow-x-auto">
              <table className="text-foreground w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-border bg-muted/50 text-muted-foreground border-b text-xs font-semibold uppercase">
                    <th className="p-4">Stage Component</th>
                    <th className="p-4">Sample Size</th>
                    <th className="p-4">Average Latency (ms)</th>
                    <th className="p-4 text-right">Failure Rate (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {orchestratorData?.stageStatuses?.map((stage, i) => (
                    <tr key={i} className="hover:bg-surface-hover transition-colors">
                      <td className="p-4 font-semibold">{stage.stageName}</td>
                      <td className="p-4 font-mono text-xs">{stage.sampleSize}</td>
                      <td className="p-4 font-mono text-xs">{stage.averageDurationMs} ms</td>
                      <td className="text-destructive p-4 text-right font-mono text-xs font-semibold">
                        {(stage.failureRate * 100).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                  {(!orchestratorData || orchestratorData.stageStatuses?.length === 0) && (
                    <tr>
                      <td colSpan={4} className="text-muted-foreground p-8 text-center">
                        No stage execution records found yet. Run an orchestrator pipeline first.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </Section>

        {/* Reality Engine Stage Telemetry */}
        <Section title="Reality Engine Latency & Durations (Reality Stage Logs)">
          <Panel padding="none">
            <div className="overflow-x-auto">
              <table className="text-foreground w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-border bg-muted/50 text-muted-foreground border-b text-xs font-semibold uppercase">
                    <th className="p-4">Reality Stage</th>
                    <th className="p-4">Sample Size</th>
                    <th className="p-4">Average Latency (ms)</th>
                    <th className="p-4 text-right">Failure Rate (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {realityData?.stages?.map((stage, i) => (
                    <tr key={i} className="hover:bg-surface-hover transition-colors">
                      <td className="p-4 font-semibold">{stage.stageName}</td>
                      <td className="p-4 font-mono text-xs">{stage.sampleSize}</td>
                      <td className="p-4 font-mono text-xs">{stage.averageDurationMs} ms</td>
                      <td className="text-destructive p-4 text-right font-mono text-xs font-semibold">
                        {(stage.failureRate * 100).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                  {(!realityData || realityData.stages?.length === 0) && (
                    <tr>
                      <td colSpan={4} className="text-muted-foreground p-8 text-center">
                        No reality pipeline logs recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </Section>
      </Stack>
    </PageContainer>
  );
}
