"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

export const metadata = {
  title: "Dashboard | Aᴷ: The Morningstar Solution",
  description: "Query engineering specifications, gather traceable evidence, analyze contradictions, and package verified decisions deterministically.",
  openGraph: {
    title: "Dashboard | Aᴷ: The Morningstar Solution",
    description: "Query engineering specifications, gather traceable evidence, analyze contradictions, and package verified decisions deterministically.",
    type: "website",
    url: "https://morningstar.aksci.io/dashboard",
  },
};
import {
  ShieldCheck,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  FileText,
  Download,
  Check,
  History,
  Bookmark,
  User,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { PageContainer, Panel, Stack } from "@/components/layout";
import { Input, Button, Badge, Card, CardContent, Divider } from "@/components/ui";
import { cn } from "@/shared/utils";

interface EntityOption {
  id: string;
  name: string;
  identifier: string;
  entityType: string;
}

interface EvidenceNode {
  id: string;
  type: string;
  label: string;
  entityId?: string;
  entityType?: string;
  status?: string;
  version?: string;
  documentId?: string;
  documentName?: string;
  documentVersion?: number;
  page?: number;
  section?: string;
  extractionMethod?: string;
  createdAt: string;
  updatedAt: string;
}

interface Conflict {
  id: string;
  type: string;
  label: string;
  description: string;
  severity: string;
  detectedAt: string;
}

interface MissingEvidence {
  id: string;
  type: string;
  label: string;
  description: string;
  severity: string;
}

interface EvidenceChainLink {
  nodeId: string;
  node: EvidenceNode;
  relationType: string;
  depth: number;
}

interface EvidenceChain {
  rootId: string;
  links: EvidenceChainLink[];
  totalDepth: number;
}

interface TraceabilityRecord {
  entityId: string;
  entityName: string;
  entityType: string;
  entityIdentifier: string;
  entityVersion: string;
  entityStatus: string;
  documentId?: string;
  documentName?: string;
  documentVersion?: number;
  page?: number;
  section?: string;
  relationshipPath: string[];
  extractionMethod?: string;
  timestamp: string;
}

interface QualityIndicators {
  totalNodes: number;
  supportingNodes: number;
  conflictingNodes: number;
  missingNodes: number;
  hasDocumentProvenance: boolean;
  hasVersionInfo: boolean;
  hasPageReferences: boolean;
  hasExtractionSource: boolean;
  quality: string;
}

interface EvidenceSummary {
  totalEvidence: number;
  supportingEvidence: number;
  conflictingEvidence: number;
  missingEvidence: number;
  uniqueDocuments: number;
  uniqueEntities: number;
  oldestEvidence: string | null;
  newestEvidence: string | null;
}

interface ResolutionResult {
  status: string;
  subjectId: string;
  subjectLabel: string;
  supportingEvidence: EvidenceNode[];
  conflictingEvidence: EvidenceNode[];
  missingEvidence: MissingEvidence[];
  evidenceChains: EvidenceChain[];
  traceabilityGraph: { rootEntityId: string; records: TraceabilityRecord[]; totalRecords: number };
  conflicts: Conflict[];
  qualityIndicators: QualityIndicators;
  summary: EvidenceSummary;
  resolvedAt: string;
}

interface MatchedPrecedent {
  id: string;
  title: string;
  summary: string | null;
  outcome: string | null;
  lessonsLearned: string[];
  decisionMade: string | null;
  decisionDate: string | null;
  decisionOwner: string | null;
  supportingEvidence: string[];
  similarityScore: number;
  matchReasons: string[];
  confidence: number;
  tags: string[];
  relatedSuppliers: string[];
  relatedComponents: string[];
  relatedStandards: string[];
  relatedCertifications: string[];
}

const PRESETS = [
  {
    question: "Can Supplier X be used on Project Alpha?",
    targetQuery: "Supplier X",
  },
  {
    question: "What evidence supports Requirement 4.2?",
    targetQuery: "Requirement 4.2",
  },
  {
    question: "What changed since Revision C?",
    targetQuery: "Revision C",
  },
  {
    question: "Has this failure happened before?",
    targetQuery: "Failure",
  },
  {
    question: "Which documents justify this design decision?",
    targetQuery: "Design Decision",
  },
];

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400",
  HIGH: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/30 dark:bg-orange-950/20 dark:text-orange-400",
  MEDIUM:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-400",
  LOW: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-400",
};

export default function DashboardPage() {
  const [question, setQuestion] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [entityResults, setEntityResults] = useState<EntityOption[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<EntityOption | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [resolution, setResolution] = useState<ResolutionResult | null>(null);
  const [error, setError] = useState("");
  const [exportSuccess, setExportSuccess] = useState(false);

  // Historical precedent state
  const [matchedPrecedents, setMatchedPrecedents] = useState<MatchedPrecedent[]>([]);
  const [isLoadingPrecedents, setIsLoadingPrecedents] = useState(false);
  const [selectedPrecedent, setSelectedPrecedent] = useState<MatchedPrecedent | null>(null);

  // Auto-create precedent from resolution
  const [isSavingPrecedent, setIsSavingPrecedent] = useState(false);
  const [precedentSaved, setPrecedentSaved] = useState(false);

  const saveAsPrecedent = useCallback(async () => {
    if (!resolution || !selectedEntity) return;
    setIsSavingPrecedent(true);
    try {
      await fetch("/api/precedents/from-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          entityId: selectedEntity.id,
          entityName: selectedEntity.name,
          entityType: selectedEntity.entityType,
          decision: `Assessment completed with status: ${resolution.status}`,
          outcome: resolution.summary.totalEvidence > 0 ? "Evidence evaluated and documented" : "No evidence found",
          supportingEvidence: resolution.supportingEvidence.map((n) => n.label),
          contradictions: resolution.conflicts.map((c) => `${c.label}: ${c.description}`),
          missingEvidence: resolution.missingEvidence.map((m) => m.label),
          confidence: resolution.status === "VERIFIED" ? 0.95 : 0.7,
          tags: [selectedEntity.entityType.toLowerCase(), "assessment"],
        }),
      });
      setPrecedentSaved(true);
      setTimeout(() => setPrecedentSaved(false), 3000);
    } catch {
      // silently fail
    } finally {
      setIsSavingPrecedent(false);
    }
  }, [resolution, selectedEntity, question]);

  // Run target compliance evaluation
  const evaluateTarget = useCallback(async (entity: EntityOption) => {
    setSelectedEntity(entity);
    setIsEvaluating(true);
    setError("");
    setResolution(null);

    try {
      const res = await fetch("/api/evidence/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityId: entity.id, maxDepth: 5 }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Verification failed");
        return;
      }
      const json = await res.json();
      setResolution(json.data);
    } catch {
      setError("An error occurred during target compliance evaluation.");
    } finally {
      setIsEvaluating(false);
    }
  }, []);

  // Find similar historical precedents
  const findPrecedents = useCallback(async (queryText: string, entity?: EntityOption) => {
    setIsLoadingPrecedents(true);
    setMatchedPrecedents([]);
    setSelectedPrecedent(null);

    try {
      const context: Record<string, unknown> = {
        question: queryText,
      };

      if (entity) {
        context.components = [entity.name];
      }

      const res = await fetch("/api/precedents/similar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(context),
      });

      if (res.ok) {
        const json = await res.json();
        setMatchedPrecedents(json.data ?? []);
      }
    } catch {
      // Silently fail - precedents are supplemental
    } finally {
      setIsLoadingPrecedents(false);
    }
  }, []);

  // Search entities based on question terms
  const searchTargets = useCallback(
    async (queryText: string) => {
      if (!queryText.trim()) return;
      setIsSearching(true);
      setSelectedEntity(null);
      setResolution(null);
      setError("");

      try {
        const matchedPreset = PRESETS.find((p) =>
          queryText.toLowerCase().includes(p.targetQuery.toLowerCase()),
        );
        const searchTerms = matchedPreset ? matchedPreset.targetQuery : queryText;

        const res = await fetch(
          `/api/engineering/entities?search=${encodeURIComponent(searchTerms)}&pageSize=10`,
        );
        if (res.ok) {
          const json = await res.json();
          const entities = json.data ?? [];
          setEntityResults(entities);

          if (entities.length > 0) {
            const entity = entities[0];
            await evaluateTarget(entity);
            await findPrecedents(queryText, entity);
          } else {
            const fallbackRes = await fetch(`/api/engineering/entities?pageSize=5`);
            if (fallbackRes.ok) {
              const fallbackJson = await fallbackRes.json();
              const fallbackEntities = fallbackJson.data ?? [];
              setEntityResults(fallbackEntities);
              if (fallbackEntities.length > 0) {
                const entity = fallbackEntities[0];
                await evaluateTarget(entity);
                await findPrecedents(queryText, entity);
              }
            }
          }
        }
      } catch {
        setError("Failed to resolve target elements related to the query.");
      } finally {
        setIsSearching(false);
      }
    },
    [evaluateTarget, findPrecedents],
  );

  const handlePresetClick = (presetText: string) => {
    setQuestion(presetText);
    searchTargets(presetText);
  };

  const handleExportDecision = () => {
    if (!resolution) return;
    setExportSuccess(true);

    const exportData = {
      target: selectedEntity?.name ?? resolution.subjectLabel,
      identifier: selectedEntity?.identifier ?? "",
      status: resolution.status,
      evidenceSummary: {
        total: resolution.summary.totalEvidence,
        supporting: resolution.summary.supportingEvidence,
        conflicting: resolution.summary.conflictingEvidence,
        missing: resolution.summary.missingEvidence,
      },
      qualityRating: resolution.qualityIndicators.quality,
      matchedPrecedents: matchedPrecedents.map((p) => ({
        id: p.id,
        title: p.title,
        similarityScore: p.similarityScore,
        reasons: p.matchReasons,
      })),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `decision-export-${selectedEntity?.identifier ?? "target"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setTimeout(() => setExportSuccess(false), 3000);
  };

  const getVerificationStrength = () => {
    if (!resolution) return { label: "\u2014", color: "text-zinc-500" };
    if (resolution.status === "VERIFIED" || resolution.status === "SUFFICIENT") {
      return { label: "Strong", color: "text-emerald-600 dark:text-emerald-400" };
    }
    if (resolution.status === "INCOMPLETE" || resolution.status === "NEEDS_REVIEW") {
      return { label: "Sufficient with gaps", color: "text-amber-600 dark:text-amber-400" };
    }
    return { label: "Weak / Compromised", color: "text-rose-600 dark:text-rose-400" };
  };

  const getVerificationStatusLabel = (status: string) => {
    if (status === "INSUFFICIENT") return "INCOMPLETE";
    return status.replace(/_/g, " ");
  };

  return (
    <PageContainer>
      <Stack gap={8}>
        {/* Header Title */}
        <div className="flex flex-col gap-2">
          <h1 className="text-foreground text-3xl font-semibold tracking-tight">
            Verification Workspace
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-normal">
            Query engineering specifications, gather traceable evidence, analyze contradictions, and
            package verified decisions deterministically.
          </p>
        </div>

        {/* --- QUESTION INPUT SECTION --- */}
        <Panel padding="lg" className="border border-zinc-200 bg-zinc-950/20 dark:border-zinc-800">
          <Stack gap={4}>
            <div className="flex flex-col gap-2">
              <label htmlFor="question-input" className="text-foreground text-sm font-medium">
                Ask an Engineering Question
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="text-muted-foreground absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
                  <Input
                    id="question-input"
                    placeholder="Enter an engineering question or verify a supplier, component, or revision..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchTargets(question)}
                    className="h-11 border-zinc-200 pl-10 dark:border-zinc-800"
                  />
                </div>
                <Button
                  className="h-11 shrink-0 bg-zinc-900 px-6 font-medium text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  onClick={() => searchTargets(question)}
                  disabled={isSearching}
                >
                  {isSearching ? "Processing..." : "Verify"}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Suggested Questions
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePresetClick(preset.question)}
                    className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-left text-xs text-zinc-700 transition-colors hover:bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {preset.question}
                  </button>
                ))}
              </div>
            </div>
          </Stack>
        </Panel>

        {/* --- ERROR FEEDBACK --- */}
        {error && (
          <Panel
            padding="md"
            className="border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/10"
          >
            <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
              <XCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          </Panel>
        )}

        {/* --- LOADING EXPERIENCE --- */}
        {(isSearching || isEvaluating) && (
          <div className="flex flex-col items-center justify-center py-20">
            <Clock className="mb-3 size-8 animate-pulse text-zinc-400" />
            <p className="text-sm font-medium text-zinc-500">
              Reconciling specifications and gathering evidence...
            </p>
          </div>
        )}

        {/* --- DYNAMIC TARGET RESOLUTION SELECTOR --- */}
        {entityResults.length > 0 && !isSearching && !isEvaluating && (
          <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-zinc-50/20 p-4 dark:border-zinc-800">
            <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Verification Targets Resolved
            </span>
            <div className="flex flex-wrap gap-2">
              {entityResults.map((ent) => (
                <button
                  key={ent.id}
                  onClick={() => evaluateTarget(ent)}
                  className={cn(
                    "rounded border px-3 py-1.5 text-left text-xs font-medium transition-colors",
                    selectedEntity?.id === ent.id
                      ? "border-zinc-900 bg-zinc-900 text-zinc-50 shadow-sm dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                      : "border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800",
                  )}
                >
                  {ent.name} ({ent.identifier})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- NO ACTIVE SELECTION --- */}
        {!selectedEntity && !isSearching && !isEvaluating && entityResults.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/30 py-24 text-center dark:border-zinc-800 dark:bg-zinc-950/10">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600">
              <ShieldCheck className="size-7" />
            </div>
            <p className="text-foreground text-base font-medium">Workspace Idle</p>
            <p className="text-muted-foreground mt-1.5 max-w-sm text-sm leading-normal">
              Enter an engineering question above or click a suggestion to run the compliance
              verification checklist.
            </p>
          </div>
        )}

        {/* --- ACTIVE WORKSPACE COMPLIANCE DATA --- */}
        {resolution && selectedEntity && !isEvaluating && !isSearching && (
          <Stack gap={8}>
            {/* Target Header Banner */}
            <Panel
              padding="md"
              className="border border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/10"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                    <FileText className="size-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-foreground text-sm font-semibold">
                      {selectedEntity.name}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {selectedEntity.identifier} &middot; {selectedEntity.entityType}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Badge
                    variant="secondary"
                    className="border-zinc-200 bg-zinc-100 font-medium text-zinc-800 capitalize dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    Status: {getVerificationStatusLabel(resolution.status).toLowerCase()}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    Verified at {new Date(resolution.resolvedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </Panel>

            {/* --- ASSESSMENT SUMMARY & DECISION EXPORT --- */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="bg-background border-zinc-200 shadow-sm lg:col-span-2 dark:border-zinc-800">
                <CardContent className="p-6">
                  <Stack gap={4}>
                    <h3 className="text-foreground text-sm font-semibold tracking-wider uppercase">
                      Verification Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <span className="text-muted-foreground text-xs font-medium">
                          Evidence Strength
                        </span>
                        <p className={cn("mt-1 text-base font-semibold", getVerificationStrength().color)}>
                          {getVerificationStrength().label}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs font-medium">Supporting Evidence</span>
                        <p className="text-foreground mt-1 text-lg font-bold">
                          {resolution.summary.totalEvidence} items
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs font-medium">Contradictions</span>
                        <p className={cn("mt-1 text-lg font-bold", resolution.conflicts.length > 0 ? "text-red-600 dark:text-red-400" : "text-foreground")}>
                          {resolution.conflicts.length}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs font-medium">Missing Evidence</span>
                        <p className={cn("mt-1 text-lg font-bold", resolution.missingEvidence.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground")}>
                          {resolution.missingEvidence.length}
                        </p>
                      </div>
                    </div>
                    <Divider className="border-zinc-150 dark:border-zinc-800" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground text-xs font-medium">Confidence Level:</span>
                        <span className="text-foreground text-sm font-semibold capitalize">
                          {resolution.qualityIndicators.quality.toLowerCase()}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                        {resolution.status === "VERIFIED" || resolution.status === "SUFFICIENT"
                          ? `The target has strong compliance integrity. We identified ${resolution.summary.totalEvidence} supporting verification data points and found zero contradictions or missing qualifications. Documentation provenance is complete.`
                          : `The target compliance level is moderate to weak. We found ${resolution.conflicts.length} contradictions and ${resolution.missingEvidence.length} missing certifications/qualifications that prevent complete verification. Further review is required.`}
                      </p>
                    </div>
                  </Stack>
                </CardContent>
              </Card>

              <Card className="bg-background border-zinc-200 shadow-sm dark:border-zinc-800">
                <CardContent className="flex h-full flex-col justify-between p-6">
                  <Stack gap={4}>
                    <h3 className="text-foreground text-sm font-semibold tracking-wider uppercase">
                      Decision Actions
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Download the deterministic verification trail or save this decision as a historical precedent for future reference.
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={handleExportDecision}
                        className="flex h-10 w-full items-center justify-center gap-2 bg-zinc-900 font-medium text-zinc-50 shadow hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                      >
                        {exportSuccess ? (
                          <><Check className="size-4 shrink-0" /><span>Exported</span></>
                        ) : (
                          <><Download className="size-4 shrink-0" /><span>Export Decision Log</span></>
                        )}
                      </Button>
                      <Button
                        onClick={saveAsPrecedent}
                        disabled={isSavingPrecedent}
                        className="flex h-10 w-full items-center justify-center gap-2 border border-zinc-300 dark:border-zinc-700 font-medium text-foreground bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      >
                        {precedentSaved ? (
                          <><Check className="size-4 shrink-0 text-green-500" /><span>Saved as Precedent</span></>
                        ) : (
                          <><Bookmark className="size-4 shrink-0" /><span>{isSavingPrecedent ? "Saving..." : "Save as Precedent"}</span></>
                        )}
                      </Button>
                    </div>
                  </Stack>
                </CardContent>
              </Card>
            </div>

            {/* --- EVIDENCE TIMELINE & RELATED DOCUMENTS --- */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="bg-background border-zinc-200 shadow-sm lg:col-span-2 dark:border-zinc-800">
                <CardContent className="p-6">
                  <Stack gap={6}>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-foreground text-sm font-semibold tracking-wider uppercase">
                        Evidence Timeline
                      </h3>
                      <p className="text-muted-foreground text-xs">
                        Deterministic compliance verification checkpoints retrieved for this target.
                      </p>
                    </div>
                    {resolution.supportingEvidence.length === 0 ? (
                      <div className="text-muted-foreground py-8 text-center text-sm">
                        No supporting compliance documents verified.
                      </div>
                    ) : (
                      <div className="relative ml-2.5 space-y-6 border-l border-zinc-200 pl-5 dark:border-zinc-800">
                        {resolution.supportingEvidence.map((node) => (
                          <div key={node.id} className="group relative">
                            <span className="bg-background absolute top-1.5 -left-[26px] flex h-3 w-3 items-center justify-center rounded-full border-2 border-zinc-300 transition-colors group-hover:border-zinc-500" />
                            <Stack gap={2}>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-foreground text-sm font-semibold">{node.label}</span>
                                <Badge variant="secondary" className="border-zinc-200 bg-zinc-100 px-1.5 py-0 text-[10px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                                  {node.entityType ?? node.type}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground text-xs leading-normal">
                                <span className="font-semibold text-zinc-700 dark:text-zinc-300">Why it is relevant:</span> verified compliance matching requirement constraints.
                              </p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500">
                                {node.documentName && (
                                  <span>Document: {node.documentName} {node.page ? `(Page ${node.page})` : ""}</span>
                                )}
                                {node.version && <span>Revision: {node.version}</span>}
                                {node.createdAt && <span>Date: {new Date(node.createdAt).toLocaleDateString()}</span>}
                                <span>Confidence: high</span>
                              </div>
                            </Stack>
                          </div>
                        ))}
                      </div>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              <Card className="bg-background border-zinc-200 shadow-sm dark:border-zinc-800">
                <CardContent className="p-6">
                  <Stack gap={4}>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-foreground text-sm font-semibold tracking-wider uppercase">
                        Related Documents
                      </h3>
                      <p className="text-muted-foreground text-xs">
                        Origin files supporting this verification.
                      </p>
                    </div>
                    {resolution.traceabilityGraph.records.length === 0 ? (
                      <div className="text-muted-foreground py-8 text-center text-xs">
                        No supporting reference files.
                      </div>
                    ) : (
                      <Stack gap={3}>
                        {Array.from(
                          new Set(resolution.traceabilityGraph.records.map((r) => r.documentId).filter(Boolean)),
                        ).map((docId) => {
                          const docRecord = resolution.traceabilityGraph.records.find((r) => r.documentId === docId);
                          if (!docRecord) return null;
                          return (
                            <Link
                              key={docId}
                              href={`/documents/${docId}`}
                              className="group flex items-start gap-2.5 rounded border border-transparent p-2 text-left transition-all hover:border-zinc-200 hover:bg-zinc-50 dark:hover:border-zinc-800 dark:hover:bg-zinc-900"
                            >
                              <FileText className="mt-0.5 size-4 shrink-0 text-zinc-400 group-hover:text-zinc-600" />
                              <div className="flex min-w-0 flex-col">
                                <span className="text-foreground truncate text-xs font-semibold transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                  {docRecord.documentName}
                                </span>
                                <span className="mt-0.5 text-[10px] text-zinc-500">
                                  Version {docRecord.documentVersion ?? 1} &middot; {docRecord.extractionMethod ?? "manual review"}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </Stack>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </div>

            {/* --- CONTRADICTIONS & MISSING EVIDENCE --- */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="bg-background border-zinc-200 shadow-sm dark:border-zinc-800">
                <CardContent className="p-6">
                  <Stack gap={4}>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-foreground text-sm font-semibold tracking-wider uppercase">Contradictions</h3>
                      <p className="text-muted-foreground text-xs">Unresolved data conflicts or mismatch claims.</p>
                    </div>
                    {resolution.conflicts.length === 0 ? (
                      <div className="text-muted-foreground rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 py-10 text-center text-sm dark:border-zinc-800 dark:bg-zinc-950/15">
                        No contradictions or specifications mismatch detected.
                      </div>
                    ) : (
                      <Stack gap={4}>
                        {resolution.conflicts.map((conflict) => (
                          <div key={conflict.id} className={cn("rounded border border-l-4 p-4 text-left", SEVERITY_COLORS[conflict.severity] ?? SEVERITY_COLORS["MEDIUM"])}>
                            <Stack gap={2}>
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="size-4 shrink-0" />
                                <span className="text-sm font-semibold">{conflict.label}</span>
                              </div>
                              <p className="text-xs leading-relaxed opacity-90">
                                <strong className="mb-0.5 block font-semibold">Conflicting statement:</strong>
                                {conflict.description}
                              </p>
                            </Stack>
                          </div>
                        ))}
                      </Stack>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              <Card className="bg-background border-zinc-200 shadow-sm dark:border-zinc-800">
                <CardContent className="p-6">
                  <Stack gap={4}>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-foreground text-sm font-semibold tracking-wider uppercase">Missing Evidence</h3>
                      <p className="text-muted-foreground text-xs">Required certifications, tests, or approvals that are absent.</p>
                    </div>
                    {resolution.missingEvidence.length === 0 ? (
                      <div className="text-muted-foreground rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 py-10 text-center text-sm dark:border-zinc-800 dark:bg-zinc-950/15">
                        All compliance checklists and certifications are complete.
                      </div>
                    ) : (
                      <Stack gap={4}>
                        {resolution.missingEvidence.map((item) => (
                          <div key={item.id} className={cn("rounded border border-l-4 p-4 text-left", SEVERITY_COLORS[item.severity] ?? SEVERITY_COLORS["MEDIUM"])}>
                            <Stack gap={2}>
                              <div className="flex items-start gap-2.5">
                                <XCircle className="mt-0.5 size-4 shrink-0" />
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold">{item.label}</span>
                                  <span className="mt-1 text-xs opacity-90">{item.description}</span>
                                </div>
                              </div>
                            </Stack>
                          </div>
                        ))}
                      </Stack>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </div>

            {/* --- RELATED HISTORICAL CONTEXT --- */}
            <Card className="bg-background border-zinc-200 shadow-sm dark:border-zinc-800">
              <CardContent className="p-6">
                <Stack gap={4}>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-foreground text-sm font-semibold tracking-wider uppercase flex items-center gap-2">
                        <History className="size-4 text-amber-500" />
                        Related Historical Context
                      </h3>
                      <p className="text-muted-foreground text-xs">
                        Prior engineering work with similar conditions, surfaced by deterministic matching.
                      </p>
                    </div>
                    {matchedPrecedents.length > 0 && (
                      <Link
                        href="/precedents"
                        className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium flex items-center gap-1"
                      >
                        View all <ChevronRight className="size-3" />
                      </Link>
                    )}
                  </div>

                  {isLoadingPrecedents ? (
                    <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                      <Clock className="size-4 animate-pulse" />
                      <span>Searching historical precedents...</span>
                    </div>
                  ) : matchedPrecedents.length === 0 ? (
                    <div className="text-muted-foreground rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 py-8 text-center text-sm dark:border-zinc-800 dark:bg-zinc-950/15">
                      <History className="mx-auto mb-2 size-6 text-muted-foreground/50" />
                      No matching historical precedents found. Decisions made here will become available as future precedents.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {matchedPrecedents.map((prec) => (
                        <div
                          key={prec.id}
                          className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 transition-all hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-sm cursor-pointer"
                          onClick={() => setSelectedPrecedent(selectedPrecedent?.id === prec.id ? null : prec)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Bookmark className="size-3.5 text-amber-500 shrink-0" />
                                <span className="text-sm font-semibold text-foreground truncate">{prec.title}</span>
                              </div>

                              {/* Similarity score bar */}
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                  <div
                                    className={cn(
                                      "h-full rounded-full transition-all",
                                      prec.similarityScore >= 0.7 ? "bg-green-500" :
                                      prec.similarityScore >= 0.4 ? "bg-amber-500" : "bg-zinc-400",
                                    )}
                                    style={{ width: `${prec.similarityScore * 100}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-mono font-semibold text-muted-foreground shrink-0">
                                  {Math.round(prec.similarityScore * 100)}%
                                </span>
                              </div>

                              {/* Match reasons */}
                              <div className="flex flex-wrap gap-1 mb-2">
                                {prec.matchReasons.slice(0, 4).map((reason, i) => (
                                  <span key={i} className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 px-1.5 py-0.5 rounded font-medium">
                                    {reason}
                                  </span>
                                ))}
                              </div>

                              {/* Key details */}
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                                {prec.decisionDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="size-3" />
                                    {new Date(prec.decisionDate).toLocaleDateString()}
                                  </span>
                                )}
                                {prec.decisionOwner && (
                                  <span className="flex items-center gap-1">
                                    <User className="size-3" />
                                    {prec.decisionOwner}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <FileText className="size-3" />
                                  {prec.supportingEvidence.length} evidence items
                                </span>
                                <span className="flex items-center gap-1">
                                  Confidence: {Math.round(prec.confidence * 100)}%
                                </span>
                              </div>
                            </div>

                            <ChevronRight className={cn(
                              "size-4 shrink-0 mt-1 transition-transform",
                              selectedPrecedent?.id === prec.id ? "rotate-90" : "",
                              "text-muted-foreground"
                            )} />
                          </div>

                          {/* Detail expand */}
                          {selectedPrecedent?.id === prec.id && (
                            <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                              {prec.outcome && (
                                <div>
                                  <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">Outcome</span>
                                  <p className="text-sm text-foreground mt-0.5">{prec.outcome}</p>
                                </div>
                              )}

                              {prec.lessonsLearned && prec.lessonsLearned.length > 0 && (
                                <div>
                                  <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">Lessons Learned</span>
                                  <ul className="mt-0.5 space-y-1">
                                    {prec.lessonsLearned.map((lesson, i) => (
                                      <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                                        <span className="text-amber-500 mt-0.5">&bull;</span>
                                        {lesson}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {prec.decisionMade && (
                                <div>
                                  <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">Decision Made</span>
                                  <p className="text-sm text-foreground mt-0.5">{prec.decisionMade}</p>
                                </div>
                              )}

                              <div className="flex flex-wrap gap-2 pt-1">
                                {prec.relatedSuppliers.length > 0 && (
                                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <span className="font-medium">Suppliers:</span>
                                    {prec.relatedSuppliers.join(", ")}
                                  </div>
                                )}
                                {prec.relatedStandards.length > 0 && (
                                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <span className="font-medium">Standards:</span>
                                    {prec.relatedStandards.join(", ")}
                                  </div>
                                )}
                                {prec.relatedComponents.length > 0 && (
                                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <span className="font-medium">Components:</span>
                                    {prec.relatedComponents.join(", ")}
                                  </div>
                                )}
                              </div>

                              {prec.matchReasons.length > 0 && (
                                <div>
                                  <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">Why This Matched</span>
                                  <ul className="mt-1 space-y-0.5">
                                    {prec.matchReasons.map((reason, i) => (
                                      <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                                        <span className="text-green-500 mt-0.5">&#x2713;</span>
                                        {reason}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        )}
      </Stack>
    </PageContainer>
  );
}
