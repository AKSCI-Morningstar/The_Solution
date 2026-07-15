"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/ui/query-error";
import { Plus } from "lucide-react";
import {
  JobHistoryTable,
  ParserHealthCards,
  type JobListItem,
  type ParserHealthItem,
} from "@/features/ingestion/components";

const PAGE_SIZE = 20;

export default function IngestionDashboardPage() {
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [parsers, setParsers] = useState<ParserHealthItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [jobsRes, parsersRes] = await Promise.all([
        fetch(`/api/ingestion/jobs?page=${page}&pageSize=${PAGE_SIZE}`),
        fetch("/api/ingestion/parsers"),
      ]);
      if (!jobsRes.ok) {
        const json = await jobsRes.json().catch(() => ({}));
        throw new Error(json.error ?? "Failed to load jobs");
      }
      const jobsJson = await jobsRes.json();
      setJobs(jobsJson.data ?? []);
      setTotal(jobsJson.total ?? 0);

      if (parsersRes.ok) {
        const parsersJson = await parsersRes.json();
        setParsers(parsersJson.data ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ingestion dashboard");
      setJobs([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const statusCounts = jobs.reduce<Record<string, number>>((acc, job) => {
    acc[job.status] = (acc[job.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">Ingestion Pipeline</h1>
          <p className="text-muted-foreground text-sm">
            Upload engineering documents and monitor structured extraction.
          </p>
        </div>
        <Link href="/ingestion/upload">
          <Button>
            <Plus className="mr-1.5 size-4" aria-hidden="true" />
            Upload document
          </Button>
        </Link>
      </div>

      {error && <QueryError message={error} onRetry={() => void load()} />}

      {!error && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <MetricCard label="Queued" value={statusCounts.QUEUED ?? 0} />
            <MetricCard label="Running" value={statusCounts.RUNNING ?? 0} />
            <MetricCard label="Succeeded" value={statusCounts.SUCCEEDED ?? 0} />
            <MetricCard label="Failed" value={statusCounts.FAILED ?? 0} />
            <MetricCard label="Cancelled" value={statusCounts.CANCELLED ?? 0} />
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-foreground text-sm font-semibold">Parser health</h2>
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <ParserHealthCards parsers={parsers} />
            )}
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-foreground text-sm font-semibold">Job history</h2>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <>
                <JobHistoryTable jobs={jobs} />
                <Pagination
                  currentPage={page}
                  totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
                  onPageChange={setPage}
                />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
