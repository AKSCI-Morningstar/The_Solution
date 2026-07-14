"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyValue } from "@/components/ui/key-value";
import { Button } from "@/components/ui/button";
import { REALITY_STAGE_NAMES } from "@/server/reality/constants";
import {
  AssessmentStatusBadge,
  RealityOutcomeBadge,
  RealityStageStatusBadge,
} from "./assessment-status-badge";

interface StageLogItem {
  stageName: string;
  stageIndex: number;
  status: string;
  attempt: number;
  durationMs: number | null;
}

interface RealityAssessmentDetail {
  id: string;
  subjectEntityId: string;
  orchestrationRunId: string;
  status: string;
  currentStage: string | null;
  stageIndex: number;
  totalStages: number;
  outcome: string | null;
  reasoning: string | null;
  entitiesEvaluated: string[];
  evidenceSummary: {
    evidenceGraphSize: number;
    supportingEvidenceCount: number;
    missingEvidenceCount: number;
    conflictingEvidenceCount: number;
  } | null;
  ruleSummary: { ruleId: string; outcome: string }[] | null;
  contradictionSummary: { id: string; status: string; open: boolean }[] | null;
  traceabilitySummary: { recordCount: number } | null;
  ingestionCompleteness: {
    totalJobsChecked: number;
    pendingJobCount: number;
    failedJobCount: number;
    allComplete: boolean;
  } | null;
  errorStage: string | null;
  errorMessage: string | null;
  durationMs: number | null;
  startedAt: string | null;
  completedAt: string | null;
}

export function AssessmentDetail({ assessmentId }: { assessmentId: string }) {
  const [assessment, setAssessment] = useState<RealityAssessmentDetail | null>(null);
  const [logsByStage, setLogsByStage] = useState<Map<string, StageLogItem>>(new Map());
  const [error, setError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const load = useCallback(async () => {
    try {
      const [assessmentRes, logsRes] = await Promise.all([
        fetch(`/api/reality/assessments/${assessmentId}`),
        fetch(`/api/reality/assessments/${assessmentId}/logs?pageSize=100`),
      ]);
      const assessmentJson = await assessmentRes.json();
      if (!assessmentRes.ok) {
        setError(assessmentJson.error ?? "Failed to load assessment");
        return;
      }
      setAssessment(assessmentJson.data);

      const logsJson = await logsRes.json();
      if (logsRes.ok) {
        const latestByStage = new Map<string, StageLogItem>();
        for (const log of logsJson.data as StageLogItem[]) {
          latestByStage.set(log.stageName, log);
        }
        setLogsByStage(latestByStage);
      }
    } catch {
      setError("Failed to load assessment");
    }
  }, [assessmentId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const interval = setInterval(() => {
      if (assessment?.status === "RUNNING" || assessment?.status === "QUEUED") load();
    }, 3000);
    return () => clearInterval(interval);
  }, [load, assessment?.status]);

  async function handleCancel() {
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/reality/assessments/${assessmentId}/cancel`, {
        method: "POST",
      });
      if (res.ok) await load();
    } finally {
      setIsCancelling(false);
    }
  }

  if (error) return <p className="text-destructive text-sm">{error}</p>;
  if (!assessment) return <p className="text-muted-foreground text-sm">Loading assessment...</p>;

  const canCancel = assessment.status === "QUEUED" || assessment.status === "RUNNING";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            Engineering reality assessment
          </h1>
          <p className="text-muted-foreground font-mono text-sm">{assessment.subjectEntityId}</p>
          <Link
            href={`/orchestrator/${assessment.orchestrationRunId}`}
            className="text-muted-foreground text-xs hover:underline"
          >
            Source orchestration run &rarr;
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <AssessmentStatusBadge status={assessment.status} />
          {canCancel && (
            <Button variant="secondary" size="sm" disabled={isCancelling} onClick={handleCancel}>
              {isCancelling ? "Cancelling..." : "Cancel"}
            </Button>
          )}
        </div>
      </div>

      {assessment.outcome && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Deterministic reality assessment</CardTitle>
              <RealityOutcomeBadge outcome={assessment.outcome} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground text-sm">{assessment.reasoning}</p>
          </CardContent>
        </Card>
      )}

      {assessment.errorMessage && (
        <Card>
          <CardHeader>
            <CardTitle>Failure</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive text-sm">
              Stage {assessment.errorStage}: {assessment.errorMessage}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Assessment timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-2">
            {REALITY_STAGE_NAMES.map((stageName, index) => {
              const log = logsByStage.get(stageName);
              const isCurrent = assessment.currentStage === stageName;
              return (
                <li
                  key={stageName}
                  className="border-border flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground w-6 text-xs">{index + 1}</span>
                    <span className="text-foreground text-sm">
                      {stageName.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {log?.durationMs !== undefined && log?.durationMs !== null && (
                      <span className="text-muted-foreground text-xs">{log.durationMs}ms</span>
                    )}
                    <RealityStageStatusBadge
                      status={log?.status ?? (isCurrent ? "RUNNING" : "PENDING")}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
          <Link
            href={`/reality/${assessmentId}/logs`}
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
                { key: "Entities evaluated", value: assessment.entitiesEvaluated?.length ?? 0 },
                {
                  key: "Supporting evidence count",
                  value: assessment.evidenceSummary?.supportingEvidenceCount ?? "-",
                },
                {
                  key: "Missing evidence",
                  value: assessment.evidenceSummary?.missingEvidenceCount ?? 0,
                },
                {
                  key: "Conflicting evidence",
                  value: assessment.evidenceSummary?.conflictingEvidenceCount ?? 0,
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rules, contradictions, traceability</CardTitle>
          </CardHeader>
          <CardContent>
            <KeyValue
              pairs={[
                { key: "Rules re-read", value: assessment.ruleSummary?.length ?? 0 },
                {
                  key: "Open contradictions",
                  value: assessment.contradictionSummary?.filter((c) => c.open).length ?? 0,
                },
                {
                  key: "Traceability records",
                  value: assessment.traceabilitySummary?.recordCount ?? 0,
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ingestion completeness</CardTitle>
          </CardHeader>
          <CardContent>
            <KeyValue
              pairs={[
                {
                  key: "Jobs checked",
                  value: assessment.ingestionCompleteness?.totalJobsChecked ?? 0,
                },
                { key: "Pending", value: assessment.ingestionCompleteness?.pendingJobCount ?? 0 },
                { key: "Failed", value: assessment.ingestionCompleteness?.failedJobCount ?? 0 },
                {
                  key: "Complete",
                  value: assessment.ingestionCompleteness?.allComplete ? "Yes" : "No",
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Execution</CardTitle>
          </CardHeader>
          <CardContent>
            <KeyValue
              pairs={[
                {
                  key: "Started",
                  value: assessment.startedAt
                    ? new Date(assessment.startedAt).toLocaleString()
                    : "-",
                },
                {
                  key: "Completed",
                  value: assessment.completedAt
                    ? new Date(assessment.completedAt).toLocaleString()
                    : "-",
                },
                {
                  key: "Duration",
                  value:
                    assessment.durationMs !== null
                      ? `${(assessment.durationMs / 1000).toFixed(2)}s`
                      : "-",
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
