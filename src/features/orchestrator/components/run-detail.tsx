"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyValue } from "@/components/ui/key-value";
import { Button } from "@/components/ui/button";
import { STAGE_NAMES } from "@/server/orchestrator/constants";
import { RunStatusBadge, AssessmentOutcomeBadge, StageStatusBadge } from "./run-status-badge";

interface StageLogItem {
  stageName: string;
  stageIndex: number;
  status: string;
  attempt: number;
  durationMs: number | null;
  errorMessage: string | null;
}

interface OrchestrationRunDetail {
  id: string;
  organizationId: string;
  subjectEntityId: string;
  status: string;
  currentStage: string | null;
  stageIndex: number;
  totalStages: number;
  cancelRequested: boolean;
  assessment: {
    outcome: string;
    reasoning: string;
    missingEvidence: string[];
    conflictingEvidence: { type: string; label: string; description: string }[];
  } | null;
  evidenceSummary: {
    evidenceGraphSize: number;
    supportingEvidenceCount: number;
    missingEvidence: string[];
    conflictingEvidence: unknown[];
  } | null;
  ruleResultIds: string[];
  contradictionIds: string[];
  traceabilitySummary: { recordCount: number } | null;
  errorStage: string | null;
  errorMessage: string | null;
  durationMs: number | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export function RunDetail({ runId }: { runId: string }) {
  const [run, setRun] = useState<OrchestrationRunDetail | null>(null);
  const [logsByStage, setLogsByStage] = useState<Map<string, StageLogItem>>(new Map());
  const [error, setError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const load = useCallback(async () => {
    try {
      const [runRes, logsRes] = await Promise.all([
        fetch(`/api/orchestrator/runs/${runId}`),
        fetch(`/api/orchestrator/runs/${runId}/logs?pageSize=100`),
      ]);
      const runJson = await runRes.json();
      if (!runRes.ok) {
        setError(runJson.error ?? "Failed to load evaluation");
        return;
      }
      setRun(runJson.data);

      const logsJson = await logsRes.json();
      if (logsRes.ok) {
        const latestByStage = new Map<string, StageLogItem>();
        for (const log of logsJson.data as StageLogItem[]) {
          latestByStage.set(log.stageName, log);
        }
        setLogsByStage(latestByStage);
      }
    } catch {
      setError("Failed to load evaluation");
    }
  }, [runId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const interval = setInterval(() => {
      if (run?.status === "RUNNING" || run?.status === "QUEUED") load();
    }, 3000);
    return () => clearInterval(interval);
  }, [load, run?.status]);

  async function handleCancel() {
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/orchestrator/runs/${runId}/cancel`, { method: "POST" });
      if (res.ok) await load();
    } finally {
      setIsCancelling(false);
    }
  }

  if (error) return <p className="text-destructive text-sm">{error}</p>;
  if (!run) return <p className="text-muted-foreground text-sm">Loading evaluation...</p>;

  const canCancel = run.status === "QUEUED" || run.status === "RUNNING";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            Engineering evaluation
          </h1>
          <p className="text-muted-foreground font-mono text-sm">{run.subjectEntityId}</p>
        </div>
        <div className="flex items-center gap-2">
          <RunStatusBadge status={run.status} />
          {canCancel && (
            <Button variant="secondary" size="sm" disabled={isCancelling} onClick={handleCancel}>
              {isCancelling ? "Cancelling..." : "Cancel"}
            </Button>
          )}
        </div>
      </div>

      {run.assessment && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Deterministic engineering assessment</CardTitle>
              <AssessmentOutcomeBadge outcome={run.assessment.outcome} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground text-sm">{run.assessment.reasoning}</p>
          </CardContent>
        </Card>
      )}

      {run.errorMessage && (
        <Card>
          <CardHeader>
            <CardTitle>Failure</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive text-sm">
              Stage {run.errorStage}: {run.errorMessage}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pipeline timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-2">
            {STAGE_NAMES.map((stageName, index) => {
              const log = logsByStage.get(stageName);
              const isCurrent = run.currentStage === stageName;
              return (
                <li
                  key={stageName}
                  className="border-border flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground w-6 text-xs">{index + 1}</span>
                    <span
                      className={
                        isCurrent
                          ? "text-foreground text-sm font-medium"
                          : "text-foreground text-sm"
                      }
                    >
                      {stageName.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {log?.durationMs !== undefined && log?.durationMs !== null && (
                      <span className="text-muted-foreground text-xs">{log.durationMs}ms</span>
                    )}
                    <StageStatusBadge status={log?.status ?? (isCurrent ? "RUNNING" : "PENDING")} />
                  </div>
                </li>
              );
            })}
          </ol>
          <Link
            href={`/orchestrator/${runId}/logs`}
            className="text-muted-foreground mt-3 inline-block text-sm hover:underline"
          >
            View full stage logs &rarr;
          </Link>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Evidence</CardTitle>
          </CardHeader>
          <CardContent>
            <KeyValue
              pairs={[
                {
                  key: "Evidence graph size",
                  value: run.evidenceSummary?.evidenceGraphSize ?? "-",
                },
                {
                  key: "Supporting evidence count",
                  value: run.evidenceSummary?.supportingEvidenceCount ?? "-",
                },
                {
                  key: "Missing evidence",
                  value: run.evidenceSummary?.missingEvidence.length ?? 0,
                },
                {
                  key: "Conflicting evidence",
                  value: run.evidenceSummary?.conflictingEvidence.length ?? 0,
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rules and contradictions</CardTitle>
          </CardHeader>
          <CardContent>
            <KeyValue
              pairs={[
                { key: "Rules evaluated", value: run.ruleResultIds.length },
                { key: "Contradictions detected", value: run.contradictionIds.length },
                { key: "Traceability records", value: run.traceabilitySummary?.recordCount ?? 0 },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Execution</CardTitle>
        </CardHeader>
        <CardContent>
          <KeyValue
            direction="row"
            pairs={[
              {
                key: "Started",
                value: run.startedAt ? new Date(run.startedAt).toLocaleString() : "-",
              },
              {
                key: "Completed",
                value: run.completedAt ? new Date(run.completedAt).toLocaleString() : "-",
              },
              {
                key: "Duration",
                value: run.durationMs !== null ? `${(run.durationMs / 1000).toFixed(2)}s` : "-",
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
