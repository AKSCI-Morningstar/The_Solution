"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { REPORT_TYPES, REPORT_TYPE_LABELS } from "@/server/reporting/constants";
import { ReportListTable, type ReportListItem } from "./report-list-table";

const TYPE_OPTIONS = REPORT_TYPES.map((t) => ({ value: t, label: REPORT_TYPE_LABELS[t] }));

export function ReportExplorer() {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [tab, setTab] = useState<"all" | "favorites">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (search) params.set("search", search);
      if (typeFilter) params.set("type", typeFilter);
      if (tab === "favorites") params.set("isFavorite", "true");

      const res = await fetch(`/api/reporting/reports?${params}`);
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Failed to load reports");
        return;
      }
      const json = await res.json();
      setReports(json.data);
      setTotal(json.total);
      setTotalPages(json.totalPages);
    } catch {
      setError("Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, typeFilter, tab]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleToggleFavorite(id: string) {
    const res = await fetch(`/api/reporting/reports/${id}/favorite`, { method: "POST" });
    if (res.ok) await load();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | "favorites")}>
          <TabsList className="border-border flex gap-1 rounded-lg border p-1">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-muted rounded-md px-3 py-1.5 text-sm"
            >
              All reports
            </TabsTrigger>
            <TabsTrigger
              value="favorites"
              className="data-[state=active]:bg-muted rounded-md px-3 py-1.5 text-sm"
            >
              Favorites
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Link href="/reports/analytics">
            <Button variant="secondary">Analytics dashboard</Button>
          </Link>
          <Link href="/reports/new">
            <Button>
              <Plus className="mr-1.5 size-4" />
              New report
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search report titles..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          options={TYPE_OPTIONS}
          placeholder="All types"
        />
      </div>

      {error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : isLoading ? (
        <p className="text-muted-foreground text-sm">Loading reports...</p>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            {total} report{total !== 1 ? "s" : ""}
          </p>
          <ReportListTable reports={reports} onToggleFavorite={handleToggleFavorite} />
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
