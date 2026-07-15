"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { QueryError } from "@/components/ui/query-error";
import { StatusIndicator } from "@/components/ui/status-indicator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DocumentListItem {
  id: string;
  fileName: string;
  fileExtension: string;
  mimeType: string;
  sizeBytes: number;
  status: string;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
  _count?: { versions: number; jobs: number };
}

const PAGE_SIZE = 20;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusTone(
  status: string,
): "active" | "inactive" | "pending" | "error" | "success" | "warning" {
  switch (status) {
    case "PROCESSED":
    case "READY":
      return "success";
    case "FAILED":
      return "error";
    case "PROCESSING":
    case "QUEUED":
      return "pending";
    case "UPLOADED":
      return "active";
    default:
      return "inactive";
  }
}

function badgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "success" | "warning" | "outline" {
  switch (status) {
    case "FAILED":
      return "destructive";
    case "PROCESSED":
    case "READY":
      return "success";
    case "PROCESSING":
      return "warning";
    default:
      return "secondary";
  }
}

export function DocumentWorkspace() {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
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
    return params.toString();
  }, [page, debouncedSearch]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ingestion/documents?${queryString}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? `Failed to load documents (${res.status})`);
      }
      setDocuments(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
      setDocuments([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-9 left-3 size-4"
            aria-hidden="true"
          />
          <Input
            label="Search documents"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Filter by file name..."
            className="pl-9"
            aria-label="Search documents"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/ingestion">
            <Button variant="secondary">Pipeline jobs</Button>
          </Link>
          <Link href="/ingestion/upload">
            <Button>
              <Plus className="mr-1.5 size-4" aria-hidden="true" />
              Upload
            </Button>
          </Link>
        </div>
      </div>

      {error && <QueryError message={error} onRetry={() => void load()} />}

      {!error && isLoading && <Skeleton className="h-72 w-full" />}

      {!error && !isLoading && documents.length === 0 && (
        <EmptyState
          icon={<FileText className="size-10" aria-hidden="true" />}
          title="No documents yet"
          description="Upload engineering documents to begin ingestion and evidence extraction."
          action={
            <Link href="/ingestion/upload">
              <Button>
                <Plus className="mr-1.5 size-4" aria-hidden="true" />
                Upload document
              </Button>
            </Link>
          }
        />
      )}

      {!error && !isLoading && documents.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Jobs</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <Link
                      href={`/ingestion/documents/${doc.id}`}
                      className="text-foreground hover:underline"
                    >
                      <span className="font-medium">{doc.fileName}</span>
                      <span className="text-muted-foreground ml-2 text-xs uppercase">
                        {doc.fileExtension}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <StatusIndicator
                        status={statusTone(doc.status)}
                        showLabel={false}
                        aria-hidden="true"
                      />
                      <Badge variant={badgeVariant(doc.status)} size="sm">
                        {doc.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatBytes(doc.sizeBytes)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    v{doc.currentVersion}
                    {doc._count ? ` · ${doc._count.versions} total` : ""}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {doc._count?.jobs ?? 0}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(doc.updatedAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between gap-3">
            <p className="text-muted-foreground text-xs">
              {total.toLocaleString()} document{total === 1 ? "" : "s"}
            </p>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
