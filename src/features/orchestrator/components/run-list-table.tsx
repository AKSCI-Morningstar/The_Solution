"use client";

import Link from "next/link";
import { Waypoints } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { RunStatusBadge, AssessmentOutcomeBadge } from "./run-status-badge";

export interface OrchestrationRunListItem {
  id: string;
  subjectEntityId: string;
  status: string;
  currentStage: string | null;
  stageIndex: number;
  totalStages: number;
  assessment: { outcome: string } | null;
  durationMs: number | null;
  createdAt: string;
}

export function RunListTable({ runs }: { runs: OrchestrationRunListItem[] }) {
  if (runs.length === 0) {
    return (
      <EmptyState
        icon={<Waypoints className="size-10" />}
        title="No evaluations yet"
        description="Start a new engineering evaluation to coordinate the deterministic reasoning engines for a subject entity."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Subject entity</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Stage</TableHead>
          <TableHead>Outcome</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Started</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {runs.map((run) => (
          <TableRow key={run.id}>
            <TableCell>
              <Link
                href={`/orchestrator/${run.id}`}
                className="text-foreground font-mono text-sm font-medium hover:underline"
              >
                {run.subjectEntityId}
              </Link>
            </TableCell>
            <TableCell>
              <RunStatusBadge status={run.status} />
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {run.status === "RUNNING" || run.status === "QUEUED"
                ? `${run.stageIndex}/${run.totalStages} - ${run.currentStage ?? "pending"}`
                : "-"}
            </TableCell>
            <TableCell>
              {run.assessment ? (
                <AssessmentOutcomeBadge outcome={run.assessment.outcome} />
              ) : (
                <span className="text-muted-foreground text-xs">-</span>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {run.durationMs !== null ? `${(run.durationMs / 1000).toFixed(1)}s` : "-"}
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {new Date(run.createdAt).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
