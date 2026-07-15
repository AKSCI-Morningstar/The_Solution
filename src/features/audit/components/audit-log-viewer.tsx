"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { QueryError } from "@/components/ui/query-error";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AuditLogRow {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

const PAGE_SIZE = 20;

const ENTITY_OPTIONS = [
  { value: "", label: "All entities" },
  { value: "Rule", label: "Rule" },
  { value: "OrchestrationRun", label: "OrchestrationRun" },
  { value: "EngineeringEntity", label: "EngineeringEntity" },
  { value: "IngestionDocument", label: "IngestionDocument" },
  { value: "Organization", label: "Organization" },
  { value: "Report", label: "Report" },
];

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AuditLogViewer() {
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (action.trim()) params.set("action", action.trim());
    if (entity) params.set("entity", entity);
    if (from) params.set("from", new Date(from).toISOString());
    if (to) params.set("to", new Date(to).toISOString());
    return params.toString();
  }, [page, debouncedSearch, action, entity, from, to]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/audit?${queryString}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? `Failed to load audit log (${res.status})`);
      }
      setRows(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit log");
      setRows([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function handleExport() {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (action.trim()) params.set("action", action.trim());
      if (entity) params.set("entity", entity);
      if (from) params.set("from", new Date(from).toISOString());
      if (to) params.set("to", new Date(to).toISOString());

      const res = await fetch(`/api/audit/export?${params.toString()}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Input
            label="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Action, entity, or ID..."
            aria-label="Search audit log"
          />
          <Input
            label="Action contains"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            placeholder="e.g. rule.published"
          />
          <Select
            label="Entity type"
            value={entity}
            onChange={(e) => {
              setEntity(e.target.value);
              setPage(1);
            }}
            options={ENTITY_OPTIONS}
          />
          <Input
            label="From"
            type="datetime-local"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
          <Input
            label="To"
            type="datetime-local"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />{" "}
        </div>
        <Button
          variant="secondary"
          onClick={() => void handleExport()}
          disabled={isExporting || isLoading}
          aria-label="Export audit log as CSV"
        >
          <Download className="mr-1.5 size-4" aria-hidden="true" />
          {isExporting ? "Exporting..." : "Export CSV"}
        </Button>
      </div>

      {error && <QueryError message={error} onRetry={() => void load()} />}

      {!error && isLoading && <Skeleton className="h-72 w-full" />}

      {!error && !isLoading && rows.length === 0 && (
        <EmptyState
          icon={<ScrollText className="size-10" aria-hidden="true" />}
          title="No audit events"
          description="No matching audit log entries for the current filters."
        />
      )}

      {!error && !isLoading && rows.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>Metadata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {formatTimestamp(row.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" size="sm">
                      {row.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{row.entity}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[180px] truncate font-mono text-xs">
                    {row.entityId}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[240px] truncate font-mono text-xs">
                    {row.metadata ? JSON.stringify(row.metadata) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between gap-3">
            <p className="text-muted-foreground text-xs">
              {total.toLocaleString()} event{total === 1 ? "" : "s"}
            </p>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
