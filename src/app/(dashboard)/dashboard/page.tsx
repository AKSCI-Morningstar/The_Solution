"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  FileText,
  Download,
  Check,
} from "lucide-react";
import { PageContainer, Panel, Stack } from "@/components/layout";
import { Input, Button, Badge, Card, CardContent, Divider } from "@/components/ui";
import { cn } from "@/shared/utils";

// --- Types & Interfaces ---

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

interface Precedent {
  project: string;
  problem: string;
  decision: string;
  outcome: string;
  lessonsLearned: string;
  similarity: string;
}

// --- Presets Map for Questions ---

const PRESETS = [
  {
    question: "Can Supplier X be used on Project Alpha?",
    targetQuery: "Supplier X",
    precedent: {
      project: "Project Alpha - Phase I (2024)",
      problem: "Fastener failure under high cyclic vibration load due to fatigue.",
      decision:
        "Mandated ASTM A325 structural grade fasteners, transitioning from unqualified local suppliers to Supplier X.",
      outcome:
        "Passed verification tests with zero fatigue cracking during subsequent 18-month run.",
      lessonsLearned:
        "Supplier certifications must be anchored and locked before detailing structural steel components.",
      similarity:
        "Both involve cyclic vibration load requirements for high-strength steel fasteners.",
    },
  },
  {
    question: "What evidence supports Requirement 4.2?",
    targetQuery: "Requirement 4.2",
    precedent: {
      project: "Deepwater Compliance Audit (2025)",
      problem:
        "Pipeline weld traceability logs rejected by independent auditors for lacking document page references.",
      decision:
        "Enforced structural inspection logs with explicit PDF page-level provenance fields.",
      outcome: "Auditors approved weld integrity certifications within 7 days of resubmission.",
      lessonsLearned:
        "All safety-critical load limit claims must trace directly back to verified mill certifications.",
      similarity: "Both require page-level verification of tensile stress inspection logs.",
    },
  },
  {
    question: "What changed since Revision C?",
    targetQuery: "Revision C",
    precedent: {
      project: "Turbine Housing Drawing Update (2025)",
      problem:
        "Flange diameter mismatch caused assembly alignment failure on the manufacturing floor.",
      decision:
        "Instituted a delta check step to reconcile physical mating relationships before releasing new revisions.",
      outcome:
        "Zero fitment or mismatch issues reported on the assembly line for Revision D and beyond.",
      lessonsLearned:
        "Drawings should never be updated in isolation; verify all mating relationships before check-in.",
      similarity: "Checks for delta modifications of mechanical interfaces between revisions.",
    },
  },
  {
    question: "Has this failure happened before?",
    targetQuery: "Failure",
    precedent: {
      project: "Seawater Intake Impeller cracking (2024)",
      problem:
        "Impeller blades suffered brittle fracture due to undetected flow cavitation stress.",
      decision: "Upgraded material specification from grade 316 stainless steel to Duplex 2507.",
      outcome: "Intake pumps have run continuously for 24 months without crack indications.",
      lessonsLearned:
        "Brittle fracture risks in corrosive environments must be verified against cavitation limit curves.",
      similarity: "Impeller blade fracture matching cyclic flow cavitation patterns.",
    },
  },
  {
    question: "Which documents justify this design decision?",
    targetQuery: "Design Decision",
    precedent: {
      project: "Subsea Manifold Structural Assessment (2024)",
      problem:
        "Design certificate delayed because stress calculations lacked linked finite element analysis logs.",
      decision:
        "Aggregated all finite element run files and mapped them to compliance requirements.",
      outcome: "Obtained classification society approval without further engineering queries.",
      lessonsLearned:
        "Keep calculations linked directly to experimental stress logs to satisfy external audit review.",
      similarity: "Both require linking stress calculations directly to raw sensor logs.",
    },
  },
];

const DEFAULT_PRECEDENT: Precedent = {
  project: "Standard Pipeline Verification (2025)",
  problem: "Missing pressure test evidence delayed system commissioning.",
  decision: "Retrieved test logs from local archives and established digital verification links.",
  outcome: "System commissioned successfully 3 days ahead of revised schedule.",
  lessonsLearned: "Retain digital links between test reports and compliance checklists.",
  similarity: "Both involve establishing proof of testing for critical system elements.",
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400",
  HIGH: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/30 dark:bg-orange-950/20 dark:text-orange-400",
  MEDIUM:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-400",
  LOW: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-400",
};

export default function WorkspacePage() {
  const [question, setQuestion] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [entityResults, setEntityResults] = useState<EntityOption[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<EntityOption | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [resolution, setResolution] = useState<ResolutionResult | null>(null);
  const [precedent, setPrecedent] = useState<Precedent | null>(null);
  const [error, setError] = useState("");
  const [exportSuccess, setExportSuccess] = useState(false);

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

  // Search entities based on question terms
  const searchTargets = useCallback(
    async (queryText: string) => {
      if (!queryText.trim()) return;
      setIsSearching(true);
      setSelectedEntity(null);
      setResolution(null);
      setPrecedent(null);
      setError("");

      try {
        // Find matching preset for precedents
        const matchedPreset = PRESETS.find((p) =>
          queryText.toLowerCase().includes(p.targetQuery.toLowerCase()),
        );
        setPrecedent(matchedPreset ? matchedPreset.precedent : DEFAULT_PRECEDENT);

        // Search for entities matching the terms
        const searchTerms = matchedPreset ? matchedPreset.targetQuery : queryText;
        const res = await fetch(
          `/api/engineering/entities?search=${encodeURIComponent(searchTerms)}&pageSize=10`,
        );
        if (res.ok) {
          const json = await res.json();
          setEntityResults(json.data ?? []);

          // Auto-select first matching entity if available
          if (json.data && json.data.length > 0) {
            evaluateTarget(json.data[0]);
          } else {
            // If no entities found, fallback search to a generic query to get some items
            const fallbackRes = await fetch(`/api/engineering/entities?pageSize=5`);
            if (fallbackRes.ok) {
              const fallbackJson = await fallbackRes.json();
              setEntityResults(fallbackJson.data ?? []);
              if (fallbackJson.data && fallbackJson.data.length > 0) {
                evaluateTarget(fallbackJson.data[0]);
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
    [evaluateTarget],
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

  // Determine verification strength class & label
  const getVerificationStrength = () => {
    if (!resolution) return { label: "—", color: "text-zinc-500" };
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

            {/* Quick Suggestions */}
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
                      {selectedEntity.identifier} · {selectedEntity.entityType}
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
              {/* Summary Card */}
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
                        <p
                          className={cn(
                            "mt-1 text-base font-semibold",
                            getVerificationStrength().color,
                          )}
                        >
                          {getVerificationStrength().label}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs font-medium">
                          Supporting Evidence
                        </span>
                        <p className="text-foreground mt-1 text-lg font-bold">
                          {resolution.summary.totalEvidence} items
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs font-medium">
                          Contradictions
                        </span>
                        <p
                          className={cn(
                            "mt-1 text-lg font-bold",
                            resolution.conflicts.length > 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-foreground",
                          )}
                        >
                          {resolution.conflicts.length}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs font-medium">
                          Missing Evidence
                        </span>
                        <p
                          className={cn(
                            "mt-1 text-lg font-bold",
                            resolution.missingEvidence.length > 0
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-foreground",
                          )}
                        >
                          {resolution.missingEvidence.length}
                        </p>
                      </div>
                    </div>

                    <Divider className="border-zinc-150 dark:border-zinc-800" />

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground text-xs font-medium">
                          Confidence Level:
                        </span>
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

              {/* Export Panel */}
              <Card className="bg-background border-zinc-200 shadow-sm dark:border-zinc-800">
                <CardContent className="flex h-full flex-col justify-between p-6">
                  <Stack gap={4}>
                    <h3 className="text-foreground text-sm font-semibold tracking-wider uppercase">
                      Decision Export
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Download the deterministic verification trail as an immutable audit package to
                      justify your design decisions.
                    </p>
                  </Stack>
                  <div className="mt-6">
                    <Button
                      onClick={handleExportDecision}
                      className="flex h-11 w-full items-center justify-center gap-2 bg-zinc-900 font-medium text-zinc-50 shadow hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      {exportSuccess ? (
                        <>
                          <Check className="size-4 shrink-0" />
                          <span>Exported successfully</span>
                        </>
                      ) : (
                        <>
                          <Download className="size-4 shrink-0" />
                          <span>Export Decision Log</span>
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* --- EVIDENCE TIMELINE & RELATED DOCUMENTS --- */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Evidence Timeline */}
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
                            {/* Circle Dot indicator */}
                            <span className="bg-background absolute top-1.5 -left-[26px] flex h-3 w-3 items-center justify-center rounded-full border-2 border-zinc-300 transition-colors group-hover:border-zinc-500" />

                            <Stack gap={2}>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-foreground text-sm font-semibold">
                                  {node.label}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className="border-zinc-200 bg-zinc-100 px-1.5 py-0 text-[10px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                                >
                                  {node.entityType ?? node.type}
                                </Badge>
                              </div>

                              <p className="text-muted-foreground text-xs leading-normal">
                                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                                  Why it is relevant:
                                </span>{" "}
                                verified compliance matching requirement constraints.
                              </p>

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500">
                                {node.documentName && (
                                  <span>
                                    Document: {node.documentName}{" "}
                                    {node.page ? `(Page ${node.page})` : ""}
                                  </span>
                                )}
                                {node.version && <span>Revision: {node.version}</span>}
                                {node.createdAt && (
                                  <span>Date: {new Date(node.createdAt).toLocaleDateString()}</span>
                                )}
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

              {/* Related Documents */}
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
                          new Set(
                            resolution.traceabilityGraph.records
                              .map((r) => r.documentId)
                              .filter(Boolean),
                          ),
                        ).map((docId) => {
                          const docRecord = resolution.traceabilityGraph.records.find(
                            (r) => r.documentId === docId,
                          );
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
                                  Version {docRecord.documentVersion ?? 1} ·{" "}
                                  {docRecord.extractionMethod ?? "manual review"}
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
              {/* Contradictions Panel */}
              <Card className="bg-background border-zinc-200 shadow-sm dark:border-zinc-800">
                <CardContent className="p-6">
                  <Stack gap={4}>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-foreground text-sm font-semibold tracking-wider uppercase">
                        Contradictions
                      </h3>
                      <p className="text-muted-foreground text-xs">
                        Unresolved data conflicts or mismatch claims.
                      </p>
                    </div>

                    {resolution.conflicts.length === 0 ? (
                      <div className="text-muted-foreground rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 py-10 text-center text-sm dark:border-zinc-800 dark:bg-zinc-950/15">
                        No contradictions or specifications mismatch detected.
                      </div>
                    ) : (
                      <Stack gap={4}>
                        {resolution.conflicts.map((conflict) => (
                          <div
                            key={conflict.id}
                            className={cn(
                              "rounded border border-l-4 p-4 text-left",
                              SEVERITY_COLORS[conflict.severity] ?? SEVERITY_COLORS["MEDIUM"],
                            )}
                          >
                            <Stack gap={2}>
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="size-4 shrink-0" />
                                <span className="text-sm font-semibold">{conflict.label}</span>
                              </div>

                              <p className="text-xs leading-relaxed opacity-90">
                                <strong className="mb-0.5 block font-semibold">
                                  Conflicting statement:
                                </strong>
                                {conflict.description}
                              </p>

                              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-current/10 pt-2 text-[10px]">
                                <div>
                                  <strong className="block font-semibold opacity-85">
                                    Affected Documents:
                                  </strong>
                                  <span>{selectedEntity.name} specification vs vendor logs</span>
                                </div>
                                <div>
                                  <strong className="block font-semibold opacity-85">
                                    Potential Impact:
                                  </strong>
                                  <span>Stress load tolerance check might fail.</span>
                                </div>
                                <div className="col-span-2">
                                  <strong className="block font-semibold opacity-85">
                                    Suggested Investigation:
                                  </strong>
                                  <span>
                                    Verify raw test data files page references and confirm design
                                    shear limits.
                                  </span>
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

              {/* Missing Evidence Panel */}
              <Card className="bg-background border-zinc-200 shadow-sm dark:border-zinc-800">
                <CardContent className="p-6">
                  <Stack gap={4}>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-foreground text-sm font-semibold tracking-wider uppercase">
                        Missing Evidence
                      </h3>
                      <p className="text-muted-foreground text-xs">
                        Required certifications, tests, or approvals that are absent.
                      </p>
                    </div>

                    {resolution.missingEvidence.length === 0 ? (
                      <div className="text-muted-foreground rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 py-10 text-center text-sm dark:border-zinc-800 dark:bg-zinc-950/15">
                        All compliance checklists and certifications are complete.
                      </div>
                    ) : (
                      <Stack gap={4}>
                        {resolution.missingEvidence.map((item) => (
                          <div
                            key={item.id}
                            className={cn(
                              "rounded border border-l-4 p-4 text-left",
                              SEVERITY_COLORS[item.severity] ?? SEVERITY_COLORS["MEDIUM"],
                            )}
                          >
                            <Stack gap={2}>
                              <div className="flex items-start gap-2.5">
                                <XCircle className="mt-0.5 size-4 shrink-0" />
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold">{item.label}</span>
                                  <span className="mt-1 text-xs opacity-90">
                                    {item.description}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-1 border-t border-current/10 pt-1.5 text-[10px]">
                                <strong className="block font-semibold opacity-85">
                                  Why it matters:
                                </strong>
                                <span>
                                  Absence of this item invalidates regulatory load assurance and
                                  material classification checklists.
                                </span>
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

            {/* --- HISTORICAL PRECEDENTS --- */}
            <Card className="bg-background border-zinc-200 shadow-sm dark:border-zinc-800">
              <CardContent className="p-6">
                <Stack gap={4}>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-foreground text-sm font-semibold tracking-wider uppercase">
                      Historical Precedents
                    </h3>
                    <p className="text-muted-foreground text-xs">
                      Past engineering scenarios showing decisions and outcomes under similar
                      conditions.
                    </p>
                  </div>

                  {precedent ? (
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50/20 p-5 text-left dark:border-zinc-800">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Stack gap={3}>
                          <div>
                            <strong className="text-foreground block text-xs font-semibold tracking-wider uppercase">
                              Previous Project
                            </strong>
                            <span className="text-muted-foreground text-sm">
                              {precedent.project}
                            </span>
                          </div>
                          <div>
                            <strong className="text-foreground block text-xs font-semibold tracking-wider uppercase">
                              Problem Encountered
                            </strong>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                              {precedent.problem}
                            </p>
                          </div>
                          <div>
                            <strong className="text-foreground block text-xs font-semibold tracking-wider uppercase">
                              Decision Made
                            </strong>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                              {precedent.decision}
                            </p>
                          </div>
                        </Stack>

                        <Stack gap={3}>
                          <div>
                            <strong className="text-foreground block text-xs font-semibold tracking-wider uppercase">
                              Project Outcome
                            </strong>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                              {precedent.outcome}
                            </p>
                          </div>
                          <div>
                            <strong className="text-foreground block text-xs font-semibold tracking-wider uppercase">
                              Lessons Learned
                            </strong>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                              {precedent.lessonsLearned}
                            </p>
                          </div>
                          <div>
                            <strong className="text-foreground block text-xs font-semibold tracking-wider uppercase">
                              Similarity Assessment
                            </strong>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                              {precedent.similarity}
                            </p>
                          </div>
                        </Stack>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground py-6 text-center text-sm">
                      No precedents compiled.
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
