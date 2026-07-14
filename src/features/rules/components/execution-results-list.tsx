"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardList } from "lucide-react";
import { RULE_OUTCOMES } from "@/server/rules/constants";
import { RuleOutcomeBadge } from "./rule-status-badge";

interface ExecutionResultItem {
  id: string;
  subjectEntityId: string;
  outcome: string;
  evaluatedAt: string;
  executionTimeMs: number;
  batchId: string | null;
}

const OUTCOME_OPTIONS = RULE_OUTCOMES.map((o) => ({ value: o, label: o.replaceAll("_", " ") }));

export function ExecutionResultsList({ ruleId }: { ruleId: string }) {
  const [results, setResults] = useState<ExecutionResultItem[]>([]);
  const [outcomeFilter, setOutcomeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), pageSize: "20" });
        if (outcomeFilter) params.set("outcome", outcomeFilter);
        const res = await fetch(`/api/rules/${ruleId}/results?${params}`);
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) {
            setResults(json.data);
            setTotalPages(json.totalPages);
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [ruleId, outcomeFilter, page]);

  return (
    <div className="flex flex-col gap-3">
      <Select
        value={outcomeFilter}
        onChange={(e) => {
          setOutcomeFilter(e.target.value);
          setPage(1);
        }}
        options={OUTCOME_OPTIONS}
        placeholder="All outcomes"
        className="max-w-56"
      />

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading executions...</p>
      ) : results.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="size-10" />}
          title="No execution results yet"
          description="Execute this rule to see evaluation history here."
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject entity</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Evaluated at</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>
                    <Link
                      href={`/rules/executions/${result.id}`}
                      className="text-foreground text-sm font-medium hover:underline"
                    >
                      {result.subjectEntityId}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <RuleOutcomeBadge outcome={result.outcome} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(result.evaluatedAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {result.executionTimeMs}ms
                  </TableCell>
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
        </>
      )}
    </div>
  );
}
