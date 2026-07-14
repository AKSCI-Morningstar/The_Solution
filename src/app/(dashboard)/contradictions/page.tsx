"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Search,
  Loader2,
  ShieldAlert,
  ChevronRight,
} from "lucide-react";
import { PageContainer, Stack } from "@/components/layout";
import { Input, Button, Select } from "@/components/ui";
import { cn } from "@/shared/utils";

interface Contradiction {
  id: string;
  type: string;
  severity: string;
  status: string;
  label: string;
  description: string;
  detectedAt: string;
  resolvedAt: string | null;
  _count?: { lifecycleLogs: number };
}

interface Summary {
  total: number;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  criticalCount: number;
  unresolvedCount: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700 border-red-200",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
  LOW: "bg-blue-100 text-blue-700 border-blue-200",
  INFORMATION_ONLY: "bg-gray-100 text-gray-700 border-gray-200",
  BLOCKED_BY_MISSING_EVIDENCE: "bg-purple-100 text-purple-700 border-purple-200",
  NEEDS_REVIEW: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

const STATUS_COLORS: Record<string, string> = {
  DETECTED: "bg-blue-100 text-blue-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  ARCHIVED: "bg-gray-100 text-gray-700",
};

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "REQUIREMENT_CONTRADICTION", label: "Requirement Contradiction" },
  { value: "SPECIFICATION_CONTRADICTION", label: "Specification Contradiction" },
  { value: "DOCUMENT_CONTRADICTION", label: "Document Contradiction" },
  { value: "EVIDENCE_CONTRADICTION", label: "Evidence Contradiction" },
  { value: "MATERIAL_CONTRADICTION", label: "Material Contradiction" },
  { value: "SUPPLIER_CONTRADICTION", label: "Supplier Contradiction" },
  { value: "INTERFACE_CONTRADICTION", label: "Interface Contradiction" },
  { value: "VERSION_CONTRADICTION", label: "Version Contradiction" },
  { value: "LIFECYCLE_CONTRADICTION", label: "Lifecycle Contradiction" },
  { value: "RELATIONSHIP_CONTRADICTION", label: "Relationship Contradiction" },
  { value: "CERTIFICATION_CONTRADICTION", label: "Certification Contradiction" },
  { value: "RULE_VIOLATION", label: "Rule Violation" },
];

const SEVERITY_OPTIONS = [
  { value: "", label: "All severities" },
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
  { value: "INFORMATION_ONLY", label: "Information Only" },
  { value: "BLOCKED_BY_MISSING_EVIDENCE", label: "Blocked by Missing Evidence" },
  { value: "NEEDS_REVIEW", label: "Needs Review" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "DETECTED", label: "Detected" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "REJECTED", label: "Rejected" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "ARCHIVED", label: "Archived" },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function ContradictionsPage() {
  const [contradictions, setContradictions] = useState<Contradiction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchContradictions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (search) params.set("search", search);
      if (typeFilter) params.set("type", typeFilter);
      if (severityFilter) params.set("severity", severityFilter);
      if (statusFilter) params.set("status", statusFilter);

      const [listRes, summaryRes] = await Promise.all([
        fetch(`/api/contradictions?${params}`),
        fetch("/api/contradictions?summary=true"),
      ]);

      if (listRes.ok) {
        const json = await listRes.json();
        setContradictions(json.data ?? []);
        setTotal(json.total ?? 0);
        setTotalPages(json.totalPages ?? 1);
      }
      if (summaryRes.ok) {
        const json = await summaryRes.json();
        setSummary(json.data ?? null);
      }
    } catch {
      // silently handle
    } finally {
      setIsLoading(false);
    }
  }, [page, search, typeFilter, severityFilter, statusFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchContradictions();
  }, [fetchContradictions]);

  return (
    <PageContainer>
      <Stack gap={6}>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Contradictions
          </h1>
          <p className="text-sm text-muted-foreground">
            Deterministic detection and classification of engineering contradictions.
          </p>
        </div>

        {summary && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="border-border bg-background rounded-lg border p-4">
              <span className="text-muted-foreground text-xs font-medium">Total</span>
              <p className="text-foreground text-2xl font-bold">{summary.total}</p>
            </div>
            <div className="border-border bg-background rounded-lg border p-4">
              <span className="text-muted-foreground text-xs font-medium">Critical/High</span>
              <p className="text-2xl font-bold text-destructive">{summary.criticalCount}</p>
            </div>
            <div className="border-border bg-background rounded-lg border p-4">
              <span className="text-muted-foreground text-xs font-medium">Unresolved</span>
              <p className="text-2xl font-bold text-warning">{summary.unresolvedCount}</p>
            </div>
            <div className="border-border bg-background rounded-lg border p-4">
              <span className="text-muted-foreground text-xs font-medium">Resolved</span>
              <p className="text-2xl font-bold text-success">{summary.byStatus["RESOLVED"] ?? 0}</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search contradictions..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            options={TYPE_OPTIONS}
          />
          <Select
            value={severityFilter}
            onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
            options={SEVERITY_OPTIONS}
          />
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            options={STATUS_OPTIONS}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="text-muted-foreground size-8 animate-spin" />
          </div>
        ) : contradictions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-muted text-muted-foreground mb-4 flex size-16 items-center justify-center rounded-full">
              <ShieldAlert className="size-8" />
            </div>
            <p className="text-lg font-medium text-foreground">No contradictions detected</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Run contradiction detection on an entity to find engineering conflicts.
            </p>
          </div>
        ) : (
          <>
            <p className="text-muted-foreground text-sm">
              {total} contradiction{total !== 1 ? "s" : ""}
            </p>
            <div className="border-border divide-border overflow-hidden rounded-lg border">
              {contradictions.map((c) => (
                <Link
                  key={c.id}
                  href={`/contradictions/${c.id}`}
                  className="hover:bg-surface-hover flex items-center gap-3 border-b px-4 py-3 transition-colors last:border-b-0"
                >
                  <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg border", SEVERITY_COLORS[c.severity] ?? SEVERITY_COLORS["NEEDS_REVIEW"])}>
                    <AlertTriangle className="size-4" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-foreground truncate text-sm font-medium">{c.label}</span>
                    <span className="text-muted-foreground truncate text-xs">{c.description}</span>
                    <div className="flex items-center gap-2">
                      <span className={cn("rounded border px-1.5 py-0.5 text-xs font-medium", SEVERITY_COLORS[c.severity] ?? SEVERITY_COLORS["NEEDS_REVIEW"])}>
                        {c.severity.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase())}
                      </span>
                      <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", STATUS_COLORS[c.status] ?? STATUS_COLORS["DETECTED"])}>
                        {c.status.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase())}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {c.type.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase())}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-muted-foreground text-xs">{timeAgo(c.detectedAt)}</span>
                    <ChevronRight className="text-muted-foreground size-4" />
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Previous
                </Button>
                <span className="text-muted-foreground text-sm">Page {page} of {totalPages}</span>
                <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </Stack>
    </PageContainer>
  );
}
