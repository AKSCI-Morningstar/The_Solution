"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";
import { RUN_STATUSES } from "@/server/orchestrator/constants";
import { RunListTable, type OrchestrationRunListItem } from "./run-list-table";

const STATUS_OPTIONS = RUN_STATUSES.map((s) => ({ value: s, label: s }));

export function RunList() {
  const [runs, setRuns] = useState<OrchestrationRunListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ page: String(page), pageSize: "20" });
        if (search) params.set("search", search);
        if (statusFilter) params.set("status", statusFilter);

        const res = await fetch(`/api/orchestrator/runs?${params}`);
        if (!res.ok) {
          const err = await res.json();
          if (!cancelled) setError(err.error ?? "Failed to load evaluations");
          return;
        }
        const json = await res.json();
        if (!cancelled) {
          setRuns(json.data);
          setTotal(json.total);
          setTotalPages(json.totalPages);
        }
      } catch {
        if (!cancelled) setError("Failed to load evaluations");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [page, search, statusFilter]);

  const runningCount = runs.filter((r) => r.status === "RUNNING" || r.status === "QUEUED").length;
  const completedCount = runs.filter((r) => r.status === "COMPLETED").length;
  const failedCount = runs.filter((r) => r.status === "FAILED").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="In progress (this page)" value={runningCount} />
        <MetricCard label="Completed (this page)" value={completedCount} />
        <MetricCard label="Failed (this page)" value={failedCount} />
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search by subject entity ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          placeholder="All statuses"
        />
        <Link href="/orchestrator/new">
          <Button>
            <Plus className="mr-1.5 size-4" />
            New evaluation
          </Button>
        </Link>
      </div>

      {error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : isLoading ? (
        <p className="text-muted-foreground text-sm">Loading evaluations...</p>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            {total} evaluation{total !== 1 ? "s" : ""}
          </p>
          <RunListTable runs={runs} />
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
        </>
      )}
    </div>
  );
}
