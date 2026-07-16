"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  History,
  Share2,
  Bookmark,
  Network,
  FileText,
  GitBranch,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TypeBadge } from "./type-badge";
import { StatusBadge } from "./status-badge";
import { EntityDetailSkeleton } from "./loading-state";
import { ErrorState } from "./error-state";
import { EngineeringPrecedent } from "@/features/precedents/types";

export interface Entity {
  id: string;
  identifier: string;
  name: string;
  description: string | null;
  entityType: string;
  status: string;
  version: string;
  tags: string[] | null;
  labels: Record<string, string> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string | null; email: string } | null;
  updatedBy: { id: string; name: string | null; email: string } | null;
}

interface EntityDetailProps {
  entityId: string;
  onEdit?: (entity: Entity) => void;
  onDelete?: () => void;
}

export function EntityDetail({ entityId, onEdit, onDelete }: EntityDetailProps) {
  const router = useRouter();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Historical Organizational Memory State
  const [relatedPrecedents, setRelatedPrecedents] = useState<EngineeringPrecedent[]>([]);
  const [isPrecedentsLoading, setIsPrecedentsLoading] = useState(false);
  const [selectedPrecId, setSelectedPrecId] = useState<string | null>(null);
  const [hasKeywordMatch, setHasKeywordMatch] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      setError("");
      try {
        const res = await fetch(`/api/engineering/entities/${entityId}`);
        if (!res.ok) {
          if (res.status === 404) {
            router.push("/entities");
            return;
          }
          const err = await res.json();
          if (!cancelled) setError(err.error ?? "Failed to load");
          return;
        }
        const json = await res.json();
        if (!cancelled) setEntity(json.data);
      } catch {
        if (!cancelled) setError("Failed to load entity");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    loadData();
    return () => {
      cancelled = true;
    };
  }, [entityId, router, reloadKey]);

  useEffect(() => {
    if (!entity) return;
    let cancelled = false;
    const fetchPrecedents = async () => {
      setIsPrecedentsLoading(true);
      try {
        // Construct search query from entity details
        const searchTerms = [
          entity.name,
          ...(entity.tags || []),
          ...Object.values(entity.labels || {})
        ].filter(Boolean).join(" ");

        const res = await fetch(`/api/precedents?search=${encodeURIComponent(searchTerms)}`);
        if (res.ok) {
          const json = await res.json();
          let matched = json.data || [];
          const directMatch = matched.length > 0;

          // Fallback to general/all precedents if no direct match was detected
          if (matched.length === 0) {
            const fallbackRes = await fetch("/api/precedents");
            if (fallbackRes.ok) {
              const fallbackJson = await fallbackRes.json();
              matched = fallbackJson.data || [];
            }
          }

          if (!cancelled) {
            setRelatedPrecedents(matched);
            setHasKeywordMatch(directMatch);
            if (matched.length > 0) {
              setSelectedPrecId(matched[0].id);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch matching precedents", err);
      } finally {
        if (!cancelled) setIsPrecedentsLoading(false);
      }
    };
    fetchPrecedents();
    return () => {
      cancelled = true;
    };
  }, [entity]);

  if (isLoading) return <EntityDetailSkeleton />;
  if (error) return <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />;
  if (!entity) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.push("/entities")}>
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-foreground text-2xl font-bold tracking-tight">{entity.name}</h1>
              <TypeBadge type={entity.entityType} size="md" />
              <StatusBadge status={entity.status} size="md" />
            </div>
            <p className="text-muted-foreground text-sm">
              {entity.identifier} &middot; v{entity.version}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button variant="secondary" size="sm" onClick={() => onEdit(entity)}>
              <Edit3 className="mr-1.5 size-4" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="secondary"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="mr-1.5 size-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {entity.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm leading-relaxed">{entity.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <History className="size-4" />
              Metadata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs">Created</span>
                <span>{new Date(entity.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Updated</span>
                <span>{new Date(entity.updatedAt).toLocaleDateString()}</span>
              </div>
              {entity.createdBy && (
                <div className="col-span-2">
                  <span className="text-muted-foreground block text-xs">Created by</span>
                  <span>{entity.createdBy.name ?? entity.createdBy.email}</span>
                </div>
              )}
              {entity.updatedBy && (
                <div className="col-span-2">
                  <span className="text-muted-foreground block text-xs">Updated by</span>
                  <span>{entity.updatedBy.name ?? entity.updatedBy.email}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Share2 className="size-4" />
              Relationships
            </CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={`/entities/${entity.id}?tab=relationships`}
              className="text-primary text-sm hover:underline"
            >
              View relationships
            </a>
          </CardContent>
        </Card>
      </div>

      {entity.tags && entity.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {entity.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-muted text-muted-foreground inline-flex rounded px-2 py-0.5 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {entity.labels && Object.keys(entity.labels).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Labels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(entity.labels).map(([key, value]) => (
                <div key={key}>
                  <span className="text-muted-foreground block text-xs">{key}</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Historical Context Section */}
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="flex flex-col gap-1.5">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <History className="size-4 text-amber-500" />
              Related Historical Context & Lessons Learned
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Institutional engineering memory matching this entity&apos;s design space and system profile.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded px-2 py-0.5 font-semibold">
              Deterministic Memory
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isPrecedentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
            </div>
          ) : relatedPrecedents.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <HelpCircle className="size-8 mx-auto text-muted-foreground opacity-50 mb-2" />
              <p className="text-sm text-foreground font-semibold">No historical precedents found</p>
              <p className="text-xs text-muted-foreground mt-1">There are no records in the organizational database for this design signature.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: List of Matched Precedents */}
              <div className="lg:col-span-5 space-y-3">
                <div className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground uppercase mb-2">
                  {hasKeywordMatch ? "HIGHLY RELEVANT PRECEDENTS" : "GENERAL SYSTEM PRECEDENTS (FALLBACK)"}
                </div>
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {relatedPrecedents.map((prec) => {
                    const isSelected = selectedPrecId === prec.id;
                    return (
                      <button
                        key={prec.id}
                        type="button"
                        onClick={() => setSelectedPrecId(prec.id)}
                        className={`w-full text-left p-3.5 rounded-lg border transition-all flex flex-col gap-2 group ${
                          isSelected
                            ? "bg-amber-500/5 border-amber-500/30 ring-1 ring-amber-500/20"
                            : "bg-background border-border hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-xs font-bold transition-colors line-clamp-1 ${
                            isSelected ? "text-amber-600 dark:text-amber-400" : "text-foreground group-hover:text-amber-500"
                          }`}>
                            {prec.title}
                          </span>
                          <ChevronRight className={`size-3 shrink-0 transition-transform ${
                            isSelected ? "text-amber-500 translate-x-0.5" : "text-muted-foreground opacity-0 group-hover:opacity-100"
                          }`} />
                        </div>
                        
                        <p className="text-[11px] text-muted-foreground line-clamp-2">
                          {prec.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                            prec.type === "FAILURE" ? "bg-red-500/10 text-red-600" :
                            prec.type === "SUCCESSFUL_DESIGN" ? "bg-green-500/10 text-green-600" :
                            prec.type === "REGULATORY_PRECEDENT" ? "bg-blue-500/10 text-blue-600" :
                            "bg-purple-500/10 text-purple-600"
                          }`}>
                            {prec.type.replace("_", " ")}
                          </span>

                          <span className={`text-[10px] font-medium inline-flex items-center gap-1 ${
                            prec.resolutionStatus === "RESOLVED" ? "text-green-600" :
                            prec.resolutionStatus === "MITIGATED" ? "text-amber-600" : "text-zinc-500"
                          }`}>
                            <span className={`size-1 rounded-full ${
                              prec.resolutionStatus === "RESOLVED" ? "bg-green-500" :
                              prec.resolutionStatus === "MITIGATED" ? "bg-amber-500" : "bg-zinc-500"
                            }`} />
                            {prec.resolutionStatus}
                          </span>

                          <span className="text-[10px] font-mono text-muted-foreground ml-auto">
                            Confidence: {Math.round(prec.confidenceScore * 100)}%
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Precedent Details & Rich Explainability */}
              <div className="lg:col-span-7 border rounded-xl p-5 bg-zinc-50/20 dark:bg-zinc-900/10">
                {(() => {
                  const prec = relatedPrecedents.find(p => p.id === selectedPrecId);
                  if (!prec) return null;
                  return (
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between border-b pb-3.5">
                        <div className="flex flex-col gap-1 pr-6">
                          <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                            <Bookmark className="size-3 text-amber-500" />
                            Precedent Rationale
                          </span>
                          <h4 className="text-sm font-bold text-foreground">
                            {prec.title}
                          </h4>
                        </div>
                        <span className={`text-[10px] font-mono font-bold border rounded px-2 py-0.5 ${
                          prec.type === "FAILURE" ? "border-red-500/20 bg-red-500/5 text-red-600" :
                          prec.type === "SUCCESSFUL_DESIGN" ? "border-green-500/20 bg-green-500/5 text-green-600" :
                          prec.type === "REGULATORY_PRECEDENT" ? "border-blue-500/20 bg-blue-500/5 text-blue-600" :
                          "border-purple-500/20 bg-purple-500/5 text-purple-600"
                        }`}>
                          {prec.type.replace("_", " ")}
                        </span>
                      </div>

                      {/* Relevance description */}
                      <div>
                        <span className="text-[10px] font-mono font-semibold text-muted-foreground block mb-1">
                          RELEVANCE ANALYSIS
                        </span>
                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 text-xs text-foreground leading-relaxed">
                          {prec.whyRelevant || "Direct match discovered based on system context overlap."}
                        </div>
                      </div>

                      {/* Abstract / Problem description */}
                      <div>
                        <span className="text-[10px] font-mono font-semibold text-muted-foreground block mb-1">
                          ABSTRACT
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {prec.description}
                        </p>
                      </div>

                      {/* Root cause and corrective action */}
                      {prec.rootCause && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-3.5">
                          <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                            <span className="text-[10px] font-mono font-bold text-red-600 block mb-1 uppercase tracking-wider">
                              Root Cause
                            </span>
                            <p className="text-xs text-foreground leading-relaxed">
                              {prec.rootCause}
                            </p>
                          </div>
                          {prec.correctiveAction && (
                            <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-3">
                              <span className="text-[10px] font-mono font-bold text-green-600 block mb-1 uppercase tracking-wider">
                                Corrective Action
                              </span>
                              <p className="text-xs text-foreground leading-relaxed">
                                {prec.correctiveAction}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Strength Ratings */}
                      <div className="border-t pt-3.5">
                        <span className="text-[10px] font-mono font-semibold text-muted-foreground block mb-2">
                          STRENGTH RATINGS
                        </span>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="border border-border rounded-lg p-2.5 bg-background">
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium mb-1">
                              <ShieldCheck className="size-3.5 text-amber-500" />
                              <span>CONFIDENCE SCORE</span>
                            </div>
                            <span className="text-base font-extrabold font-mono text-foreground">
                              {Math.round(prec.confidenceScore * 100)}%
                            </span>
                          </div>
                          <div className="border border-border rounded-lg p-2.5 bg-background">
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium mb-1">
                              <ShieldAlert className="size-3.5 text-blue-500" />
                              <span>EVIDENCE STRENGTH</span>
                            </div>
                            <span className="text-base font-extrabold font-mono text-foreground">
                              {Math.round((prec.evidenceStrength ?? prec.confidenceScore) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Assumptions Rejected */}
                      {prec.assumptionsRejected && prec.assumptionsRejected.length > 0 && (
                        <div className="border-t pt-3.5">
                          <span className="text-[10px] font-mono font-semibold text-muted-foreground block mb-2">
                            ASSUMPTIONS REJECTED / DEBUNKED
                          </span>
                          <div className="bg-red-500/5 border border-red-500/15 rounded-lg p-3">
                            <ul className="space-y-1.5">
                              {prec.assumptionsRejected.map((as, idx) => (
                                <li key={idx} className="text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
                                  <span className="text-red-500 font-bold shrink-0">✕</span>
                                  <span>{as}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Knowledge Graph Traversed Paths */}
                      {prec.graphRelationshipsTraversed && prec.graphRelationshipsTraversed.length > 0 && (
                        <div className="border-t pt-3.5">
                          <span className="text-[10px] font-mono font-semibold text-muted-foreground block mb-2">
                            KNOWLEDGE GRAPH PATHS TRAVERSED
                          </span>
                          <div className="space-y-1">
                            {prec.graphRelationshipsTraversed.map((path, idx) => (
                              <div key={idx} className="bg-muted/40 rounded px-2.5 py-1.5 text-[10px] font-mono flex items-center gap-1.5 text-foreground leading-tight">
                                <Network className="size-3.5 text-muted-foreground shrink-0" />
                                <span>{path}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Verifiable Evidence Chains */}
                      {prec.evidenceMetadata && (
                        <div className="border-t pt-3.5">
                          <span className="text-[10px] font-mono font-semibold text-muted-foreground block mb-2">
                            VERIFIABLE EVIDENCE CHAINS
                          </span>
                          <div className="space-y-1.5">
                            {prec.evidenceMetadata.documents?.map((doc) => (
                              <div key={doc} className="flex items-center gap-2 text-xs text-foreground bg-background border rounded px-2.5 py-1.5">
                                <FileText className="size-3.5 text-blue-500 shrink-0" />
                                <span className="font-medium truncate">{doc}</span>
                                <span className="text-[9px] font-mono text-green-600 bg-green-500/10 px-1 py-0.2 rounded ml-auto">VERIFIED</span>
                              </div>
                            ))}
                            {prec.evidenceMetadata.standards?.map((std) => (
                              <div key={std} className="flex items-center gap-2 text-xs text-foreground bg-background border rounded px-2.5 py-1.5">
                                <GitBranch className="size-3.5 text-purple-500 shrink-0" />
                                <span className="font-medium truncate">{std}</span>
                                <span className="text-[9px] font-mono text-purple-600 bg-purple-500/10 px-1 py-0.2 rounded ml-auto font-semibold">STANDARD</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Audit Trail */}
                      {prec.auditTrail && prec.auditTrail.length > 0 && (
                        <div className="border-t pt-3.5">
                          <span className="text-[10px] font-mono font-semibold text-muted-foreground block mb-2">
                            AUDIT TRAIL & HISTORY
                          </span>
                          <div className="relative border-l pl-3 space-y-3.5">
                            {prec.auditTrail.map((log) => (
                              <div key={log.id} className="relative text-[11px]">
                                <div className="absolute -left-[16.5px] top-1 size-2 bg-amber-500 rounded-full border border-background shadow-sm" />
                                <div className="flex flex-col">
                                  <span className="font-bold text-foreground">
                                    {log.action.replace("_", " ")}
                                  </span>
                                  <span className="text-[9px] text-muted-foreground font-mono mt-0.5 flex items-center gap-1">
                                    <Clock className="size-3" />
                                    {new Date(log.createdAt).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
