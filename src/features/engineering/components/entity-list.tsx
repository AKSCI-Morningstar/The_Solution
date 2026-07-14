"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, ListFilter as Filter, Search, ArrowUpDown, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/shared/utils";
import { TypeBadge } from "./type-badge";
import { StatusBadge } from "./status-badge";
import { EntityListSkeleton } from "./loading-state";
import { ErrorState } from "./error-state";
import { EmptyState } from "./empty-state";

interface Entity {
  id: string;
  identifier: string;
  name: string;
  entityType: string;
  status: string;
  version: string;
  updatedAt: string;
  createdBy: { id: string; name: string | null } | null;
  _count: { sourceRelationships: number; targetRelationships: number };
}

interface TypesResponse {
  entityTypes: { value: string; label: string }[];
  statuses: { value: string; label: string }[];
}

interface EntityListProps {
  onCreate?: () => void;
}

type SortField = "name" | "identifier" | "updatedAt";
type SortOrder = "asc" | "desc";

function SortIcon({
  field,
  sortField,
  sortOrder,
}: {
  field: SortField;
  sortField: SortField;
  sortOrder: SortOrder;
}) {
  if (sortField !== field) return <ArrowUpDown className="size-3 opacity-40" />;
  return sortOrder === "asc" ? (
    <ArrowUp className="size-3" />
  ) : (
    <ArrowDown className="size-3" />
  );
}

export function EntityList({ onCreate }: EntityListProps) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [total, setTotal] = useState(0);
  const [types, setTypes] = useState<TypesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadTypes() {
      try {
        const res = await fetch("/api/engineering/types");
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) setTypes(json.data);
        }
      } catch {
        // silently fail
      }
    }
    loadTypes();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ page: String(page), pageSize: "20" });
        if (search) params.set("search", search);
        if (typeFilter) params.set("entityType", typeFilter);
        if (statusFilter) params.set("status", statusFilter);
        params.set("sort", sortField);
        params.set("order", sortOrder);

        const res = await fetch(`/api/engineering/entities?${params}`);
        if (!res.ok) {
          const err = await res.json();
          if (!cancelled) setError(err.error ?? "Failed to load");
          return;
        }
        const json = await res.json();
        if (!cancelled) {
          setEntities(json.data);
          setTotal(json.total);
          setTotalPages(json.totalPages);
          setSelectedIds(new Set());
        }
      } catch {
        if (!cancelled) setError("Failed to load entities");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [page, search, typeFilter, statusFilter, sortField, sortOrder]);

  const handleSearch = useCallback(() => {
    setPage(1);
  }, []);

  const toggleSort = useCallback((field: SortField) => {
    setSortField(field);
    setSortOrder((prev) => (field === sortField ? (prev === "asc" ? "desc" : "asc") : "asc"));
  }, [sortField]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === entities.length) return new Set();
      return new Set(entities.map((e) => e.id));
    });
  }, [entities]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkActionLoading(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/engineering/entities/${id}`, { method: "DELETE" }),
        ),
      );
      setSelectedIds(new Set());
      setPage(1);
      // Reload by toggling page
      window.location.reload();
    } catch {
      setError("Failed to delete selected entities");
    } finally {
      setBulkActionLoading(false);
    }
  }, [selectedIds]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search entities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        {types && (
          <>
            <Select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              options={types.entityTypes}
              placeholder="All types"
            />
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              options={types.statuses}
              placeholder="All statuses"
            />
          </>
        )}
        <Button variant="secondary" onClick={handleSearch}>
          <Filter className="mr-1.5 size-4" />
          Filter
        </Button>
        {onCreate && (
          <Button onClick={onCreate}>
            <Plus className="mr-1.5 size-4" />
            New entity
          </Button>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="border-border bg-muted/50 flex items-center justify-between rounded-lg border px-4 py-2">
          <span className="text-sm font-medium text-foreground">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkActionLoading}
            >
              <Trash2 className="mr-1.5 size-3.5" />
              Delete Selected
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <EntityListSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : entities.length === 0 ? (
        <EmptyState entityType="engineering entities" onCreate={onCreate} />
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            {total} entity{total !== 1 ? "ies" : "y"}
          </p>
          <div className="border-border divide-border overflow-hidden rounded-lg border">
            <div className="border-border bg-muted/30 flex items-center gap-3 border-b px-4 py-2.5">
              <Checkbox
                checked={entities.length > 0 && selectedIds.size === entities.length}
                onChange={toggleSelectAll}
                aria-label="Select all"
              />
              <button
                onClick={() => toggleSort("name")}
                className="text-muted-foreground flex min-w-[180px] flex-1 items-center gap-1.5 text-left text-xs font-medium uppercase tracking-wide hover:text-foreground"
              >
                Name
                <SortIcon field="name" sortField={sortField} sortOrder={sortOrder} />
              </button>
              <button
                onClick={() => toggleSort("identifier")}
                className="text-muted-foreground hidden min-w-[120px] flex-1 items-center gap-1.5 text-left text-xs font-medium uppercase tracking-wide hover:text-foreground sm:flex"
              >
                Identifier
                <SortIcon field="identifier" sortField={sortField} sortOrder={sortOrder} />
              </button>
              <span className="text-muted-foreground hidden flex-1 text-xs font-medium uppercase tracking-wide md:block">
                Type
              </span>
              <span className="text-muted-foreground hidden flex-1 text-xs font-medium uppercase tracking-wide md:block">
                Relationships
              </span>
              <button
                onClick={() => toggleSort("updatedAt")}
                className="text-muted-foreground hidden min-w-[100px] flex-1 items-center gap-1.5 text-right text-xs font-medium uppercase tracking-wide hover:text-foreground sm:flex"
              >
                Updated
                <SortIcon field="updatedAt" sortField={sortField} sortOrder={sortOrder} />
              </button>
              <span className="min-w-[80px] text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Status
              </span>
            </div>
            {entities.map((entity) => {
              const relCount =
                entity._count.sourceRelationships + entity._count.targetRelationships;
              return (
                <div
                  key={entity.id}
                  className={cn(
                    "hover:bg-surface-hover flex items-center gap-3 border-b px-4 py-3 transition-colors last:border-b-0",
                    selectedIds.has(entity.id) && "bg-muted/40",
                  )}
                >
                  <Checkbox
                    checked={selectedIds.has(entity.id)}
                    onChange={() => toggleSelect(entity.id)}
                    aria-label={`Select ${entity.name}`}
                  />
                  <Link
                    href={`/entities/${entity.id}`}
                    className="flex min-w-[180px] flex-1 items-center gap-3"
                  >
                    <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-medium">
                      {entity.identifier.slice(0, 3)}
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="text-foreground truncate text-sm font-medium">
                        {entity.name}
                      </span>
                      <span className="text-muted-foreground truncate text-xs">
                        {entity.identifier}
                      </span>
                    </div>
                  </Link>
                  <Link
                    href={`/entities/${entity.id}`}
                    className="text-muted-foreground hidden min-w-[120px] flex-1 truncate text-sm sm:block"
                  >
                    {entity.identifier}
                  </Link>
                  <div className="hidden flex-1 md:block">
                    <TypeBadge type={entity.entityType} />
                  </div>
                  <span className="text-muted-foreground hidden flex-1 text-sm md:block">
                    {relCount} relationship{relCount !== 1 ? "s" : ""}
                  </span>
                  <span className="text-muted-foreground hidden min-w-[100px] flex-1 text-right text-xs sm:block">
                    {new Date(entity.updatedAt).toLocaleDateString()}
                  </span>
                  <div className="min-w-[80px] text-right">
                    <StatusBadge status={entity.status} />
                  </div>
                </div>
              );
            })}
          </div>

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
