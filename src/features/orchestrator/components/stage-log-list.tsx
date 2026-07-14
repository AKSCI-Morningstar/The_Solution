"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StageStatusBadge } from "./run-status-badge";

interface StageLogItem {
  id: string;
  stageName: string;
  stageIndex: number;
  status: string;
  attempt: number;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  errorMessage: string | null;
}

export function StageLogList({ runId }: { runId: string }) {
  const [logs, setLogs] = useState<StageLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/orchestrator/runs/${runId}/logs?page=${page}&pageSize=50`);
        const json = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(json.error ?? "Failed to load logs");
          return;
        }
        if (!cancelled) {
          setLogs(json.data);
          setTotalPages(json.totalPages);
        }
      } catch {
        if (!cancelled) setError("Failed to load logs");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [runId, page]);

  if (error) return <p className="text-destructive text-sm">{error}</p>;
  if (isLoading) return <p className="text-muted-foreground text-sm">Loading stage logs...</p>;

  if (logs.length === 0) {
    return (
      <EmptyState
        icon={<ScrollText className="size-10" />}
        title="No stage log entries"
        description="This evaluation has not recorded any stage executions yet."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Attempt</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Error</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-muted-foreground text-xs">{log.stageIndex + 1}</TableCell>
              <TableCell className="text-foreground text-sm">
                {log.stageName.replaceAll("_", " ")}
              </TableCell>
              <TableCell>
                <StageStatusBadge status={log.status} />
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">{log.attempt}</TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {log.durationMs !== null ? `${log.durationMs}ms` : "-"}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {new Date(log.startedAt).toLocaleTimeString()}
              </TableCell>
              <TableCell className="text-destructive text-xs">{log.errorMessage ?? "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-muted-foreground text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
