"use client";

import Link from "next/link";
import { ScanEye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { AssessmentStatusBadge, RealityOutcomeBadge } from "./assessment-status-badge";

export interface RealityAssessmentListItem {
  id: string;
  subjectEntityId: string;
  orchestrationRunId: string;
  status: string;
  outcome: string | null;
  stageIndex: number;
  totalStages: number;
  durationMs: number | null;
  createdAt: string;
}

export function AssessmentListTable({ assessments }: { assessments: RealityAssessmentListItem[] }) {
  if (assessments.length === 0) {
    return (
      <EmptyState
        icon={<ScanEye className="size-10" />}
        title="No reality assessments yet"
        description="Assess engineering reality for a completed orchestration run to reinterpret its outputs into a Verified / Contradicted / Incomplete judgment."
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
        {assessments.map((a) => (
          <TableRow key={a.id}>
            <TableCell>
              <Link
                href={`/reality/${a.id}`}
                className="text-foreground font-mono text-sm font-medium hover:underline"
              >
                {a.subjectEntityId}
              </Link>
            </TableCell>
            <TableCell>
              <AssessmentStatusBadge status={a.status} />
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {a.status === "RUNNING" || a.status === "QUEUED"
                ? `${a.stageIndex}/${a.totalStages}`
                : "-"}
            </TableCell>
            <TableCell>
              {a.outcome ? (
                <RealityOutcomeBadge outcome={a.outcome} />
              ) : (
                <span className="text-muted-foreground text-xs">-</span>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {a.durationMs !== null ? `${(a.durationMs / 1000).toFixed(1)}s` : "-"}
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {new Date(a.createdAt).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
