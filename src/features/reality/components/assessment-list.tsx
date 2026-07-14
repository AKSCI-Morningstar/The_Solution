"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";
import { REALITY_OUTCOMES, REALITY_RUN_STATUSES } from "@/server/reality/constants";
import { AssessmentListTable, type RealityAssessmentListItem } from "./assessment-list-table";

const STATUS_OPTIONS = REALITY_RUN_STATUSES.map((s) => ({ value: s, label: s }));
const OUTCOME_OPTIONS = REALITY_OUTCOMES.map((o) => ({ value: o, label: o.replaceAll("_", " ") }));

export function AssessmentList() {
  const [assessments, setAssessments] = useState<RealityAssessmentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("");
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
        if (outcomeFilter) params.set("outcome", outcomeFilter);

        const res = await fetch(`/api/reality/assessments?${params}`);
        if (!res.ok) {
          const err = await res.json();
          if (!cancelled) setError(err.error ?? "Failed to load assessments");
          return;
        }
        const json = await res.json();
        if (!cancelled) {
          setAssessments(json.data);
          setTotal(json.total);
          setTotalPages(json.totalPages);
        }
      } catch {
        if (!cancelled) setError("Failed to load assessments");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [page, search, statusFilter, outcomeFilter]);

  const verifiedCount = assessments.filter((a) => a.outcome === "VERIFIED").length;
  const contradictedCount = assessments.filter((a) => a.outcome === "CONTRADICTED").length;
  const needsReviewCount = assessments.filter((a) => a.outcome === "NEEDS_REVIEW").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Verified (this page)" value={verifiedCount} />
        <MetricCard label="Contradicted (this page)" value={contradictedCount} />
        <MetricCard label="Needs review (this page)" value={needsReviewCount} />
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
        <Select
          value={outcomeFilter}
          onChange={(e) => {
            setOutcomeFilter(e.target.value);
            setPage(1);
          }}
          options={OUTCOME_OPTIONS}
          placeholder="All outcomes"
        />
        <Link href="/reality/new">
          <Button>
            <Plus className="mr-1.5 size-4" />
            New assessment
          </Button>
        </Link>
      </div>

      {error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : isLoading ? (
        <p className="text-muted-foreground text-sm">Loading assessments...</p>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            {total} assessment{total !== 1 ? "s" : ""}
          </p>
          <AssessmentListTable assessments={assessments} />
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
