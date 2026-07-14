"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RULE_STATUSES, RULE_SEVERITIES } from "@/server/rules/constants";
import { RuleListTable, type RuleListItem } from "./rule-list-table";

const STATUS_OPTIONS = RULE_STATUSES.map((s) => ({ value: s, label: s }));
const SEVERITY_OPTIONS = RULE_SEVERITIES.map((s) => ({ value: s, label: s }));

export function RuleList() {
  const [rules, setRules] = useState<RuleListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
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
        if (severityFilter) params.set("severity", severityFilter);

        const res = await fetch(`/api/rules?${params}`);
        if (!res.ok) {
          const err = await res.json();
          if (!cancelled) setError(err.error ?? "Failed to load rules");
          return;
        }
        const json = await res.json();
        if (!cancelled) {
          setRules(json.data);
          setTotal(json.total);
          setTotalPages(json.totalPages);
        }
      } catch {
        if (!cancelled) setError("Failed to load rules");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [page, search, statusFilter, severityFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search rules..."
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
          value={severityFilter}
          onChange={(e) => {
            setSeverityFilter(e.target.value);
            setPage(1);
          }}
          options={SEVERITY_OPTIONS}
          placeholder="All severities"
        />
        <Link href="/rules/new">
          <Button>
            <Plus className="mr-1.5 size-4" />
            New rule
          </Button>
        </Link>
      </div>

      {error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : isLoading ? (
        <p className="text-muted-foreground text-sm">Loading rules...</p>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            {total} rule{total !== 1 ? "s" : ""}
          </p>
          <RuleListTable rules={rules} />
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
