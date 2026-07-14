"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { TriangleAlert as AlertTriangle, ArrowLeft, Tags, GitBranch, CircleCheck as CheckCircle2, Circle as XCircle, Loader as Loader2, ShieldAlert, History } from "lucide-react";
import { PageContainer, Section, Panel, Stack } from "@/components/layout";
import { Button, Select } from "@/components/ui";
import { cn } from "@/shared/utils";

interface ContradictionDetail {
  id: string;
  type: string;
  severity: string;
  status: string;
  label: string;
  description: string;
  sourceEntityIds: string[];
  sourceDocumentIds: string[];
  supportingEvidence: EvidenceItem[];
  conflictingEvidence: EvidenceItem[];
  traceabilityChain: TraceabilityItem[];
  affectedEntities: AffectedItem[];
  detectedAt: string;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  detectedBy: { id: string; name: string | null; email: string } | null;
  resolvedBy: { id: string; name: string | null; email: string } | null;
  lifecycleLogs: LifecycleLog[];
}

interface EvidenceItem {
  nodeId: string;
  label: string;
  entityType?: string;
  status?: string;
  version?: string;
  documentId?: string;
  documentName?: string;
  page?: number;
  section?: string;
}

interface TraceabilityItem {
  entityId: string;
  entityName: string;
  entityType: string;
  entityVersion: string;
  entityStatus: string;
  documentId?: string;
  documentName?: string;
  page?: number;
  section?: string;
  relationshipPath: string[];
  timestamp: string;
}

interface AffectedItem {
  entityId: string;
  entityName: string;
  entityType: string;
  entityIdentifier: string;
  relationship: string;
}

interface LifecycleLog {
  id: string;
  action: string;
  fromStatus: string | null;
  toStatus: string;
  createdAt: string;
  performedBy: { id: string; name: string | null } | null;
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

const STATUS_OPTIONS = [
  { value: "", label: "Change status..." },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "ACCEPTED", label: "Accept" },
  { value: "REJECTED", label: "Reject" },
  { value: "RESOLVED", label: "Resolve" },
  { value: "ARCHIVED", label: "Archive" },
];

const ACTION_LABELS: Record<string, string> = {
  DETECTED: "Detected",
  REVIEW_STARTED: "Review Started",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  RESOLVED: "Resolved",
  ARCHIVED: "Archived",
  REOPENED: "Reopened",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function ContradictionDetailPage() {
  const params = useParams<{ id: string }>();
  const [contradiction, setContradiction] = useState<ContradictionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"evidence" | "traceability" | "affected" | "lifecycle">("evidence");
  const [statusUpdate, setStatusUpdate] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchContradiction = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/contradictions/${params.id}`);
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Failed to load");
        return;
      }
      const json = await res.json();
      setContradiction(json.data);
    } catch {
      setError("Failed to load contradiction");
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchContradiction();
  }, [fetchContradiction]);

  const handleStatusUpdate = useCallback(async () => {
    if (!statusUpdate) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/contradictions/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusUpdate }),
      });
      if (res.ok) {
        setStatusUpdate("");
        fetchContradiction();
      }
    } catch {
      setError("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  }, [statusUpdate, params.id, fetchContradiction]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="text-muted-foreground size-8 animate-spin" />
        </div>
      </PageContainer>
    );
  }

  if (error || !contradiction) {
    return (
      <PageContainer>
        <Stack align="center" gap={4}>
          <ShieldAlert className="text-muted-foreground size-12" />
          <p className="text-sm text-muted-foreground">{error || "Contradiction not found"}</p>
          <Link href="/contradictions">
            <Button variant="secondary">Back to Contradictions</Button>
          </Link>
        </Stack>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Stack gap={6}>
        <div className="flex items-center gap-3">
          <Link href="/contradictions" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className={cn("flex size-8 items-center justify-center rounded-lg border", SEVERITY_COLORS[contradiction.severity] ?? SEVERITY_COLORS["NEEDS_REVIEW"])}>
                <AlertTriangle className="size-4" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">{contradiction.label}</h1>
            </div>
            <p className="text-sm text-muted-foreground">{contradiction.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded border px-2 py-1 text-xs font-medium", SEVERITY_COLORS[contradiction.severity] ?? SEVERITY_COLORS["NEEDS_REVIEW"])}>
            {contradiction.severity.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
          <span className="bg-muted text-muted-foreground rounded px-2 py-1 text-xs font-medium">
            {contradiction.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
          <span className="text-muted-foreground text-xs">
            {contradiction.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
          <span className="text-muted-foreground ml-auto text-xs">
            Detected {timeAgo(contradiction.detectedAt)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={statusUpdate}
            onChange={(e) => setStatusUpdate(e.target.value)}
            options={STATUS_OPTIONS}
          />
          <Button onClick={handleStatusUpdate} disabled={!statusUpdate || isUpdating}>
            {isUpdating ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 size-4" />}
            Update Status
          </Button>
        </div>

        <div className="border-border flex gap-1 border-b">
          {([
            { key: "evidence", label: "Evidence", count: contradiction.supportingEvidence.length + contradiction.conflictingEvidence.length },
            { key: "traceability", label: "Traceability", count: contradiction.traceabilityChain.length },
            { key: "affected", label: "Affected", count: contradiction.affectedEntities.length },
            { key: "lifecycle", label: "Lifecycle", count: contradiction.lifecycleLogs.length },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">{tab.count}</span>
            </button>
          ))}
        </div>

        {activeTab === "evidence" && (
          <Stack gap={4}>
            <Section title="Supporting Evidence">
              {contradiction.supportingEvidence.length === 0 ? (
                <Panel padding="md" className="text-center text-sm text-muted-foreground">No supporting evidence.</Panel>
              ) : (
                <Panel padding="none">
                  <Stack gap={0}>
                    {contradiction.supportingEvidence.map((ev) => (
                      <EvidenceRow key={ev.nodeId} ev={ev} variant="supporting" />
                    ))}
                  </Stack>
                </Panel>
              )}
            </Section>
            <Section title="Conflicting Evidence">
              {contradiction.conflictingEvidence.length === 0 ? (
                <Panel padding="md" className="text-center text-sm text-muted-foreground">No conflicting evidence.</Panel>
              ) : (
                <Panel padding="none">
                  <Stack gap={0}>
                    {contradiction.conflictingEvidence.map((ev) => (
                      <EvidenceRow key={ev.nodeId} ev={ev} variant="conflicting" />
                    ))}
                  </Stack>
                </Panel>
              )}
            </Section>
          </Stack>
        )}

        {activeTab === "traceability" && (
          <Section title="Traceability Chain">
            {contradiction.traceabilityChain.length === 0 ? (
              <Panel padding="md" className="text-center text-sm text-muted-foreground">No traceability records.</Panel>
            ) : (
              <Panel padding="none">
                <div className="border-border bg-muted/30 flex items-center gap-3 border-b px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <span className="flex-1">Entity</span>
                  <span className="flex-1">Document</span>
                  <span className="flex-1">Path</span>
                  <span className="min-w-[80px] text-right">Timestamp</span>
                </div>
                {contradiction.traceabilityChain.map((rec, idx) => (
                  <div key={idx} className="border-border hover:bg-surface-hover flex items-start gap-3 border-b px-4 py-3 transition-colors last:border-b-0">
                    <div className="flex flex-1 flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">{rec.entityName}</span>
                      <span className="text-xs text-muted-foreground">v{rec.entityVersion} · {rec.entityStatus}</span>
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5">
                      {rec.documentName ? (
                        <>
                          <span className="text-sm text-foreground">{rec.documentName}</span>
                          <span className="text-xs text-muted-foreground">{rec.page ? `p.${rec.page}` : ""}{rec.section ? ` · ${rec.section}` : ""}</span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">No document</span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col">
                      {rec.relationshipPath.length > 0 ? (
                        <span className="text-xs text-muted-foreground">{rec.relationshipPath.join(" → ")}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Direct</span>
                      )}
                    </div>
                    <span className="text-muted-foreground min-w-[80px] text-right text-xs">{timeAgo(rec.timestamp)}</span>
                  </div>
                ))}
              </Panel>
            )}
          </Section>
        )}

        {activeTab === "affected" && (
          <Section title="Affected Entities">
            {contradiction.affectedEntities.length === 0 ? (
              <Panel padding="md" className="text-center text-sm text-muted-foreground">No affected entities.</Panel>
            ) : (
              <Panel padding="none">
                <Stack gap={0}>
                  {contradiction.affectedEntities.map((ent) => (
                    <Link
                      key={ent.entityId}
                      href={`/entities/${ent.entityId}`}
                      className="hover:bg-surface-hover flex items-center gap-3 border-b border-border px-4 py-3 transition-colors last:border-b-0"
                    >
                      <Tags className="text-muted-foreground size-4" />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="text-sm font-medium text-foreground">{ent.entityName}</span>
                        <span className="text-xs text-muted-foreground">{ent.entityType} · {ent.relationship}</span>
                      </div>
                      <GitBranch className="text-muted-foreground size-4" />
                    </Link>
                  ))}
                </Stack>
              </Panel>
            )}
          </Section>
        )}

        {activeTab === "lifecycle" && (
          <Section title="Lifecycle History">
            {contradiction.lifecycleLogs.length === 0 ? (
              <Panel padding="md" className="text-center text-sm text-muted-foreground">No lifecycle events.</Panel>
            ) : (
              <Panel padding="none">
                <Stack gap={0}>
                  {contradiction.lifecycleLogs.map((log) => (
                    <div key={log.id} className="border-border hover:bg-surface-hover flex items-center gap-3 border-b px-4 py-3 transition-colors last:border-b-0">
                      <History className="text-muted-foreground size-4" />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="text-sm font-medium text-foreground">
                          {ACTION_LABELS[log.action] ?? log.action}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {log.fromStatus ? `${log.fromStatus} → ` : ""}{log.toStatus}
                          {log.performedBy?.name ? ` · by ${log.performedBy.name}` : ""}
                        </span>
                      </div>
                      <span className="text-muted-foreground text-xs">{timeAgo(log.createdAt)}</span>
                    </div>
                  ))}
                </Stack>
              </Panel>
            )}
          </Section>
        )}
      </Stack>
    </PageContainer>
  );
}

function EvidenceRow({ ev, variant }: { ev: EvidenceItem; variant: "supporting" | "conflicting" }) {
  return (
    <div className="hover:bg-surface-hover flex items-center gap-3 border-b border-border px-4 py-3 transition-colors last:border-b-0">
      <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
        {variant === "supporting" ? <CheckCircle2 className="size-4 text-success" /> : <XCircle className="size-4 text-destructive" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-foreground truncate text-sm font-medium">{ev.label}</span>
        <span className="text-muted-foreground text-xs">
          {ev.entityType ?? "Unknown"}{ev.status ? ` · ${ev.status}` : ""}{ev.version ? ` · v${ev.version}` : ""}
        </span>
      </div>
      {ev.documentName && (
        <div className="hidden flex-col items-end sm:flex">
          <span className="text-xs text-muted-foreground">{ev.documentName}</span>
          {ev.page && <span className="text-xs text-muted-foreground">Page {ev.page}</span>}
        </div>
      )}
    </div>
  );
}
