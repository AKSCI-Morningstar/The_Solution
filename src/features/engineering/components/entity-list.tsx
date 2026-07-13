"use client";

import { useState, useEffect } from "react";
import { Plus, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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
  }, [page, search, typeFilter, statusFilter]);

  function handleSearch() {
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
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
          <div className="divide-border border-border divide-y rounded-lg border">
            {entities.map((entity) => (
              <a
                key={entity.id}
                href={`/entities/${entity.id}`}
                className="hover:bg-muted/50 flex items-center justify-between px-4 py-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-lg text-xs font-medium">
                    {entity.identifier.slice(0, 3)}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-medium">{entity.name}</span>
                      <span className="text-muted-foreground text-xs">{entity.identifier}</span>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <TypeBadge type={entity.entityType} />
                      <span>v{entity.version}</span>
                      <span>
                        {entity._count.sourceRelationships + entity._count.targetRelationships}{" "}
                        relationship
                        {entity._count.sourceRelationships + entity._count.targetRelationships !== 1
                          ? "s"
                          : ""}
                      </span>
                    </div>
                  </div>
                </div>
                <StatusBadge status={entity.status} />
              </a>
            ))}
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
