"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KeyValue } from "@/components/ui/key-value";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { REALITY_STAGE_NAMES } from "@/server/reality/constants";
import { EngineeringPrecedent } from "@/features/precedents/types";
import {
  AssessmentStatusBadge,
  RealityOutcomeBadge,
  RealityStageStatusBadge,
} from "./assessment-status-badge";
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";

interface StageLogItem {
  stageName: string;
  stageIndex: number;
  status: string;
  attempt: number;
  durationMs: number | null;
}

interface RealityAssessmentDetail {
  id: string;
  subjectEntityId: string;
  orchestrationRunId: string;
  status: string;
  currentStage: string | null;
  stageIndex: number;
  totalStages: number;
  outcome: string | null;
  reasoning: string | null;
  entitiesEvaluated: string[];
  evidenceSummary: {
    evidenceGraphSize: number;
    supportingEvidenceCount: number;
    missingEvidenceCount: number;
    conflictingEvidenceCount: number;
  } | null;
  ruleSummary: { ruleId: string; outcome: string }[] | null;
  contradictionSummary: { id: string; status: string; open: boolean }[] | null;
  traceabilitySummary: { recordCount: number } | null;
  ingestionCompleteness: {
    totalJobsChecked: number;
    pendingJobCount: number;
    failedJobCount: number;
    allComplete: boolean;
  } | null;
  errorStage: string | null;
  errorMessage: string | null;
  durationMs: number | null;
  startedAt: string | null;
  completedAt: string | null;
}

export function AssessmentDetail({ assessmentId }: { assessmentId: string }) {
  const [assessment, setAssessment] = useState<RealityAssessmentDetail | null>(null);
  const [logsByStage, setLogsByStage] = useState<Map<string, StageLogItem>>(new Map());
  const [error, setError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // --- Historical Precedents State ---
  const [precedents, setPrecedents] = useState<EngineeringPrecedent[]>([]);
  const [precedentStrength, setPrecedentStrength] = useState<"none" | "weak" | "strong">("none");
  const [precedentLoading, setPrecedentLoading] = useState(false);
  const [precedentChoices, setPrecedentChoices] = useState<Map<string, { action: "FOLLOW" | "REJECT" | "ADAPT" | ""; notes: string }>>(new Map());
  const [decisionRationale, setDecisionRationale] = useState("");
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizeSuccess, setFinalizeSuccess] = useState(false);

  const loadPrecedents = useCallback(async (subjectId: string, entities: string[]) => {
    setPrecedentLoading(true);
    try {
      const res = await fetch(`/api/precedents?system=${encodeURIComponent(subjectId)}`);
      const json = await res.json();
      let data: EngineeringPrecedent[] = json.data || [];

      if (data.length === 0 && entities.length > 0) {
        const searchTerms = entities.map(e => e.replace(/^COMP-|^STD-|^REQ-/, "").toLowerCase());
        const querySearch = searchTerms.join(" ");
        const searchRes = await fetch(`/api/precedents?search=${encodeURIComponent(querySearch)}`);
        const searchJson = await searchRes.json();
        data = searchJson.data || [];
      }

      if (data.length === 0) {
        const fallbackRes = await fetch(`/api/precedents`);
        const fallbackJson = await fallbackRes.json();
        data = fallbackJson.data || [];
      }

      setPrecedents(data);

      const hasDirectSystemMatch = data.some((p: EngineeringPrecedent) =>
        p.applicableSystems.some((sys: string) => sys.toLowerCase() === subjectId.toLowerCase()) ||
        p.applicableSystems.some((sys: string) => subjectId.toLowerCase().includes(sys.toLowerCase()))
      );

      if (data.length > 0 && hasDirectSystemMatch) {
        setPrecedentStrength("strong");
      } else if (data.length > 0) {
        setPrecedentStrength("weak");
      } else {
        setPrecedentStrength("none");
      }
    } catch (err) {
      console.error("Failed to fetch precedents for assessment", err);
      setPrecedentStrength("none");
    } finally {
      setPrecedentLoading(false);
    }
  }, []);

  const handlePrecedentAction = (precedentId: string, action: "FOLLOW" | "REJECT" | "ADAPT" | "", pTitle: string, pCorrectiveAction?: string) => {
    setPrecedentChoices(prev => {
      const newMap = new Map(prev);
      let defaultNotes = "";
      if (action === "FOLLOW") {
        defaultNotes = `Following historical precedent "${pTitle}" guidelines. Implementing corrective action: ${pCorrectiveAction || "Verify all operand conversion check limits."}`;
      } else if (action === "REJECT") {
        defaultNotes = `Diverging from historical precedent "${pTitle}" because the operating environment and physical boundaries of our current subject system do not share the exact failure modes.`;
      } else if (action === "ADAPT") {
        defaultNotes = `Adapting historical precedent "${pTitle}" rules. Custom adaptation notes: `;
      }
      newMap.set(precedentId, { action, notes: defaultNotes });
      return newMap;
    });
  };

  const handleNotesChange = (precedentId: string, notes: string) => {
    setPrecedentChoices(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(precedentId) || { action: "", notes: "" };
      newMap.set(precedentId, { ...existing, notes });
      return newMap;
    });
  };

  const handleFinalizeDecision = async () => {
    if (!assessment) return;
    setIsFinalizing(true);
    try {
      const linkages = Array.from(precedentChoices.entries())
        .filter(([, choice]) => choice.action !== "")
        .map(([id, choice]) => {
          const prec = precedents.find(p => p.id === id);
          return `[Precedent: ${prec?.title || id}] Action: ${choice.action}. Engineer Notes: ${choice.notes}`;
        });

      const fullDescription = `Reality Assessment finalized for subject system: ${assessment.subjectEntityId}.\n\n` +
        `Outcome computed by Reality Engine: ${assessment.outcome}.\n` +
        `Computed Reasoning: ${assessment.reasoning}.\n\n` +
        `Engineer Decision Notes:\n${decisionRationale}\n\n` +
        `Historical Precedent Linkages:\n${linkages.length > 0 ? linkages.join("\n") : "No precedents linked."}`;

      let precType: "SUCCESSFUL_DESIGN" | "FAILURE" | "REGULATORY_PRECEDENT" | "SUPPLIER_HISTORY" = "SUCCESSFUL_DESIGN";
      if (assessment.outcome === "CONTRADICTED") {
        precType = "FAILURE";
      } else if (assessment.outcome === "NEEDS_REVIEW") {
        precType = "REGULATORY_PRECEDENT";
      }

      const payload = {
        title: `Finalized Decision: ${assessment.subjectEntityId} Reality Check`,
        type: precType,
        description: fullDescription,
        rootCause: assessment.errorMessage || "N/A - Deterministic context reconciled.",
        correctiveAction: decisionRationale,
        resolutionStatus: assessment.outcome || "RESOLVED",
        confidenceScore: 1.0,
        applicableSystems: [assessment.subjectEntityId, ...(assessment.entitiesEvaluated || [])],
        evidenceMetadata: {
          documents: assessment.evidenceSummary ? [`Orchestration Run ${assessment.orchestrationRunId}`] : [],
          standards: assessment.ruleSummary ? assessment.ruleSummary.map(r => r.ruleId) : [],
          testReports: []
        }
      };

      const res = await fetch("/api/precedents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setFinalizeSuccess(true);
        await loadPrecedents(assessment.subjectEntityId, assessment.entitiesEvaluated || []);
        setTimeout(() => setFinalizeSuccess(false), 5000);
      } else {
        console.error("Failed to save precedent enrichment", await res.text());
      }
    } catch (err) {
      console.error("Failed to finalize decision and enrich memory", err);
    } finally {
      setIsFinalizing(false);
    }
  };

  const load = useCallback(async () => {
    try {
      const [assessmentRes, logsRes] = await Promise.all([
        fetch(`/api/reality/assessments/${assessmentId}`),
        fetch(`/api/reality/assessments/${assessmentId}/logs?pageSize=100`),
      ]);
      const assessmentJson = await assessmentRes.json();
      if (!assessmentRes.ok) {
        setError(assessmentJson.error ?? "Failed to load assessment");
        return;
      }
      setAssessment(assessmentJson.data);

      const logsJson = await logsRes.json();
      if (logsRes.ok) {
        const latestByStage = new Map<string, StageLogItem>();
        for (const log of logsJson.data as StageLogItem[]) {
          latestByStage.set(log.stageName, log);
        }
        setLogsByStage(latestByStage);
      }
    } catch {
      setError("Failed to load assessment");
    }
  }, [assessmentId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const interval = setInterval(() => {
      if (assessment?.status === "RUNNING" || assessment?.status === "QUEUED") load();
    }, 3000);
    return () => clearInterval(interval);
  }, [load, assessment?.status]);

  useEffect(() => {
    if (assessment?.subjectEntityId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadPrecedents(assessment.subjectEntityId, assessment.entitiesEvaluated || []);
    }
  }, [assessment?.subjectEntityId, assessment?.entitiesEvaluated, loadPrecedents]);

  async function handleCancel() {
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/reality/assessments/${assessmentId}/cancel`, {
        method: "POST",
      });
      if (res.ok) await load();
    } finally {
      setIsCancelling(false);
    }
  }

  if (error) return <p className="text-destructive text-sm">{error}</p>;
  if (!assessment) return <p className="text-muted-foreground text-sm">Loading assessment...</p>;

  const canCancel = assessment.status === "QUEUED" || assessment.status === "RUNNING";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            Engineering reality assessment
          </h1>
          <p className="text-muted-foreground font-mono text-sm">{assessment.subjectEntityId}</p>
          <Link
            href={`/orchestrator/${assessment.orchestrationRunId}`}
            className="text-muted-foreground text-xs hover:underline"
          >
            Source orchestration run &rarr;
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <AssessmentStatusBadge status={assessment.status} />
          {canCancel && (
            <Button variant="secondary" size="sm" disabled={isCancelling} onClick={handleCancel}>
              {isCancelling ? "Cancelling..." : "Cancel"}
            </Button>
          )}
        </div>
      </div>

      {assessment.outcome && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Deterministic reality assessment</CardTitle>
              <RealityOutcomeBadge outcome={assessment.outcome} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground text-sm">{assessment.reasoning}</p>
          </CardContent>
        </Card>
      )}

      {/* --- HISTORICAL PRECEDENTS & DECISION SAFEGUARD SECTION --- */}
      <Card className="border-sky-500/20 shadow-md">
        <CardHeader className="flex flex-col gap-2">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <Brain className="text-sky-500 h-5 w-5" />
                Engineering Precedent Safeguard & Memory
              </CardTitle>
              <CardDescription className="text-xs">
                Leverage matched historical designs, failure modes, and past regulatory rulings to validate the active decision.
              </CardDescription>
            </div>

            <div className="mt-2 md:mt-0">
              {precedentLoading ? (
                <Badge variant="secondary" className="flex items-center gap-1.5 font-mono text-xs">
                  <LoadingSpinner className="h-3 w-3" />
                  Querying memory...
                </Badge>
              ) : precedentStrength === "strong" ? (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 flex items-center gap-1.5 px-2.5 py-1 font-mono text-xs font-semibold uppercase">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Strong Precedent Match
                </Badge>
              ) : precedentStrength === "weak" ? (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 flex items-center gap-1.5 px-2.5 py-1 font-mono text-xs font-semibold uppercase">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Weak Precedent Match
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/20 flex items-center gap-1.5 px-2.5 py-1 font-mono text-xs font-semibold uppercase">
                  <Clock className="h-3.5 w-3.5" />
                  No Matching Precedents
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          {/* Precedent Strength Alert Banner */}
          {!precedentLoading && (
            <div className={`rounded-lg border p-3 text-xs ${
              precedentStrength === "strong"
                ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/15"
                : precedentStrength === "weak"
                ? "bg-amber-500/5 text-amber-600 border-amber-500/15"
                : "bg-slate-500/5 text-slate-500 border-slate-500/15"
            }`}>
              {precedentStrength === "strong" && (
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span>
                    <strong>Direct architectural alignment detected.</strong> Key historical decision records match the system identifier <strong>{assessment.subjectEntityId}</strong>. These guidelines provide a high-confidence, deterministically verified corrective path.
                  </span>
                </p>
              )}
              {precedentStrength === "weak" && (
                <p className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>
                    <strong>Caution: Related records found but direct system alignment is absent.</strong> Retrieved design lessons from similar systems or sub-components. Validate environmental boundaries carefully before adopting any corrective actions.
                  </span>
                </p>
              )}
              {precedentStrength === "none" && (
                <p className="flex items-start gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-slate-500" />
                  <span>
                    <strong>First-of-Kind Validation recommended.</strong> No precedents matching the active system or evaluated sub-components are present in our engineering memory. Please verify against physical boundary equations manually and record your findings below to educate future runs.
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Matched Precedents List */}
          {precedentLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <LoadingSpinner className="text-sky-500 h-8 w-8" />
              <p className="text-muted-foreground mt-2 text-xs font-mono">Running semantic and index searches across organizational logs...</p>
            </div>
          ) : precedents.length === 0 ? (
            <div className="border-dashed border-border flex flex-col items-center justify-center rounded-lg border py-8 text-center">
              <p className="text-muted-foreground font-mono text-xs">No historical precedent records matching the target system {assessment.subjectEntityId}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <h3 className="text-foreground text-xs font-bold uppercase tracking-wider">Retrieved Historical Memory Entries ({precedents.length})</h3>
              <div className="flex flex-col gap-4">
                {precedents.map((prec) => {
                  const choice = precedentChoices.get(prec.id) || { action: "", notes: "" };
                  return (
                    <div key={prec.id} className="border-border flex flex-col gap-3 rounded-lg border p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h4 className="text-foreground text-sm font-semibold">{prec.title}</h4>
                          <span className="text-muted-foreground font-mono text-[10px]">ID: {prec.id}</span>
                        </div>
                        <Badge variant="outline" className={`text-[10px] uppercase ${
                          prec.type === "FAILURE" 
                            ? "bg-rose-500/10 text-rose-500 border-rose-500/20" 
                            : prec.type === "REGULATORY_PRECEDENT" 
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        }`}>
                          {prec.type.replaceAll("_", " ")}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <div className="text-xs">
                            <strong className="text-muted-foreground block text-[10px] uppercase font-semibold">Prior Decision / Summary</strong>
                            <p className="text-foreground mt-1 leading-relaxed">{prec.description}</p>
                          </div>
                          {prec.rootCause && (
                            <div className="text-xs">
                              <strong className="text-muted-foreground block text-[10px] uppercase font-semibold">Root Cause / Lessons Learned</strong>
                              <p className="text-foreground mt-1 leading-relaxed">{prec.rootCause}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 border-l border-border pl-4">
                          {prec.correctiveAction && (
                            <div className="text-xs">
                              <strong className="text-muted-foreground block text-[10px] uppercase font-semibold">Corrective Action</strong>
                              <p className="text-foreground mt-1 leading-relaxed">{prec.correctiveAction}</p>
                            </div>
                          )}
                          <div className="text-[10px] font-mono flex flex-wrap gap-1.5 mt-2">
                            <span className="text-muted-foreground">Systems:</span>
                            {prec.applicableSystems.map(sys => (
                              <span key={sys} className="bg-muted px-1.5 py-0.5 rounded text-foreground">{sys}</span>
                            ))}
                          </div>
                          {prec.evidenceMetadata?.standards && prec.evidenceMetadata.standards.length > 0 && (
                            <div className="text-[10px] font-mono flex flex-wrap gap-1.5">
                              <span className="text-muted-foreground">Standards:</span>
                              {prec.evidenceMetadata.standards.map(std => (
                                <span key={std} className="bg-sky-500/10 text-sky-500 px-1.5 py-0.5 rounded">{std}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* User interaction: Follow, Reject, Adapt */}
                      <div className="border-t border-border/60 mt-2 pt-3 flex flex-col gap-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-foreground">Link and act upon this precedent:</span>
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="secondary"
                              size="sm"
                              className={`text-[10px] px-2.5 py-1 h-7 font-semibold ${
                                choice.action === "FOLLOW" 
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20" 
                                  : "text-muted-foreground hover:bg-muted"
                              }`}
                              onClick={() => handlePrecedentAction(prec.id, "FOLLOW", prec.title, prec.correctiveAction)}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Follow
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className={`text-[10px] px-2.5 py-1 h-7 font-semibold ${
                                choice.action === "REJECT" 
                                  ? "bg-rose-500/10 text-rose-600 border-rose-500/30 hover:bg-rose-500/20" 
                                  : "text-muted-foreground hover:bg-muted"
                              }`}
                              onClick={() => handlePrecedentAction(prec.id, "REJECT", prec.title)}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className={`text-[10px] px-2.5 py-1 h-7 font-semibold ${
                                choice.action === "ADAPT" 
                                  ? "bg-blue-500/10 text-blue-600 border-blue-500/30 hover:bg-blue-500/20" 
                                  : "text-muted-foreground hover:bg-muted"
                              }`}
                              onClick={() => handlePrecedentAction(prec.id, "ADAPT", prec.title)}
                            >
                              <Brain className="h-3 w-3 mr-1" />
                              Adapt
                            </Button>
                          </div>
                        </div>

                        {choice.action && (
                          <div className="flex flex-col gap-1.5 bg-muted/40 p-2.5 rounded-md">
                            <label className="text-[10px] font-semibold text-muted-foreground">ENGINEER LINKAGE RATIONALE</label>
                            <Textarea
                              className="text-xs bg-background border-border"
                              rows={2}
                              placeholder="Detail your reasons for linking or adapting this historical lesson..."
                              value={choice.notes}
                              onChange={(e) => handleNotesChange(prec.id, e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Final decision execution pane */}
          <div className="border-t border-border/80 pt-4 flex flex-col gap-3">
            <h3 className="text-foreground text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-sky-500" />
              Finalize Engineering Decision & Memory Enrichment
            </h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Describe the final engineering corrective action, materials upgrade, physical override, or manual justification. Your input reconciles the deterministic contradictions and creates a durable memory entry for future system runs.
            </p>

            <Textarea
              className="text-xs font-sans min-h-[80px]"
              placeholder="Describe the engineering justification, overridden rules, or upgraded specifications (e.g. Upgraded high-pressure valve tolerance to 400 MPa and verified operand conversion checks)..."
              value={decisionRationale}
              onChange={(e) => setDecisionRationale(e.target.value)}
            />

            <div className="flex items-center justify-between gap-4">
              <div>
                {finalizeSuccess && (
                  <span className="text-emerald-500 font-mono text-[11px] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Decision saved! Memory successfully enriched.
                  </span>
                )}
              </div>
              <Button
                variant="primary"
                size="sm"
                disabled={isFinalizing || !decisionRationale.trim()}
                onClick={handleFinalizeDecision}
                className="bg-sky-600 text-white hover:bg-sky-500 px-4 py-2 font-semibold h-9"
              >
                {isFinalizing ? (
                  <>
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                    Enriching memory...
                  </>
                ) : (
                  "Enrich Engineering Memory"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>


      {assessment.errorMessage && (
        <Card>
          <CardHeader>
            <CardTitle>Failure</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive text-sm">
              Stage {assessment.errorStage}: {assessment.errorMessage}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Assessment timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-2">
            {REALITY_STAGE_NAMES.map((stageName, index) => {
              const log = logsByStage.get(stageName);
              const isCurrent = assessment.currentStage === stageName;
              return (
                <li
                  key={stageName}
                  className="border-border flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground w-6 text-xs">{index + 1}</span>
                    <span className="text-foreground text-sm">
                      {stageName.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {log?.durationMs !== undefined && log?.durationMs !== null && (
                      <span className="text-muted-foreground text-xs">{log.durationMs}ms</span>
                    )}
                    <RealityStageStatusBadge
                      status={log?.status ?? (isCurrent ? "RUNNING" : "PENDING")}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
          <Link
            href={`/reality/${assessmentId}/logs`}
            className="text-muted-foreground mt-3 inline-block text-sm hover:underline"
          >
            View full stage logs &rarr;
          </Link>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Evidence</CardTitle>
          </CardHeader>
          <CardContent>
            <KeyValue
              pairs={[
                { key: "Entities evaluated", value: assessment.entitiesEvaluated?.length ?? 0 },
                {
                  key: "Supporting evidence count",
                  value: assessment.evidenceSummary?.supportingEvidenceCount ?? "-",
                },
                {
                  key: "Missing evidence",
                  value: assessment.evidenceSummary?.missingEvidenceCount ?? 0,
                },
                {
                  key: "Conflicting evidence",
                  value: assessment.evidenceSummary?.conflictingEvidenceCount ?? 0,
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rules, contradictions, traceability</CardTitle>
          </CardHeader>
          <CardContent>
            <KeyValue
              pairs={[
                { key: "Rules re-read", value: assessment.ruleSummary?.length ?? 0 },
                {
                  key: "Open contradictions",
                  value: assessment.contradictionSummary?.filter((c) => c.open).length ?? 0,
                },
                {
                  key: "Traceability records",
                  value: assessment.traceabilitySummary?.recordCount ?? 0,
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ingestion completeness</CardTitle>
          </CardHeader>
          <CardContent>
            <KeyValue
              pairs={[
                {
                  key: "Jobs checked",
                  value: assessment.ingestionCompleteness?.totalJobsChecked ?? 0,
                },
                { key: "Pending", value: assessment.ingestionCompleteness?.pendingJobCount ?? 0 },
                { key: "Failed", value: assessment.ingestionCompleteness?.failedJobCount ?? 0 },
                {
                  key: "Complete",
                  value: assessment.ingestionCompleteness?.allComplete ? "Yes" : "No",
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Execution</CardTitle>
          </CardHeader>
          <CardContent>
            <KeyValue
              pairs={[
                {
                  key: "Started",
                  value: assessment.startedAt
                    ? new Date(assessment.startedAt).toLocaleString()
                    : "-",
                },
                {
                  key: "Completed",
                  value: assessment.completedAt
                    ? new Date(assessment.completedAt).toLocaleString()
                    : "-",
                },
                {
                  key: "Duration",
                  value:
                    assessment.durationMs !== null
                      ? `${(assessment.durationMs / 1000).toFixed(2)}s`
                      : "-",
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
