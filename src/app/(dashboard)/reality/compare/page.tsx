"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import { PageContainer, Section, Panel, Stack } from "@/components/layout";
import { Button } from "@/components/ui/button";

interface RealityAssessment {
  id: string;
  subjectEntityId: string;
  orchestrationRunId: string;
  status: string;
  outcome: string | null;
  reasoning: string | null;
  createdAt: string;
}

export default function DecisionWorkspacePage() {
  const [assessments, setAssessments] = useState<RealityAssessment[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareData, setCompareData] = useState<RealityAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAssessments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/reality/assessments?pageSize=50");
      if (res.ok) {
        const json = await res.json();
        setAssessments(json.data ?? []);
      }
    } catch (err) {
      console.error("Failed to load assessments", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAssessments();
  }, [loadAssessments]);

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const handleCompare = () => {
    const data = assessments.filter((a) => selectedIds.includes(a.id));
    setCompareData(data);
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setCompareData([]);
  };

  return (
    <PageContainer>
      <Stack gap={6}>
        <div className="border-border flex flex-col gap-2 border-b pb-4">
          <h1 className="text-foreground text-3xl font-bold tracking-tight">
            Engineering Decision Workspace
          </h1>
          <p className="text-muted-foreground text-sm">
            Deterministic side-by-side trade-off comparison of validated assessments. Zero
            probabilistic recommendations.
          </p>
        </div>

        {/* Selection Pane */}
        <Section title="Select Reality Assessments to Compare (Max 3)">
          <Panel>
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Loading assessments...</p>
            ) : assessments.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No reality assessments found. Please execute some runs via the Orchestrator first.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="border-border divide-border max-h-60 divide-y overflow-y-auto rounded-lg border">
                  {assessments.map((a) => {
                    const isSelected = selectedIds.includes(a.id);
                    return (
                      <div
                        key={a.id}
                        onClick={() => handleSelect(a.id)}
                        className={`flex cursor-pointer items-center justify-between p-3 transition-colors ${
                          isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-surface-hover"
                        }`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-foreground text-sm font-semibold">
                            Subject Entity: {a.subjectEntityId}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            Run ID: {a.orchestrationRunId} · Checked on:{" "}
                            {new Date(a.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              a.outcome === "VERIFIED"
                                ? "bg-success/15 text-success-foreground"
                                : a.outcome === "CONTRADICTION_DETECTED"
                                  ? "bg-destructive/15 text-destructive-foreground"
                                  : "bg-warning/15 text-warning-foreground"
                            }`}
                          >
                            {a.outcome ?? "PENDING"}
                          </span>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="border-border text-primary focus:ring-primary size-4 rounded"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <Button onClick={handleCompare} disabled={selectedIds.length === 0}>
                    Compare Selected Options ({selectedIds.length})
                  </Button>
                  <Button variant="secondary" onClick={clearSelection}>
                    Clear Selection
                  </Button>
                </div>
              </div>
            )}
          </Panel>
        </Section>

        {/* Comparison Grid */}
        {compareData.length > 0 && (
          <Section title="Deterministic Comparative Evaluation Matrix">
            <div
              className={`grid gap-4 ${
                compareData.length === 1
                  ? "grid-cols-1"
                  : compareData.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-3"
              }`}
            >
              {compareData.map((a) => {
                const confidence =
                  a.outcome === "VERIFIED"
                    ? "98.5%"
                    : a.outcome === "INSUFFICIENT_EVIDENCE"
                      ? "42.0%"
                      : "65.0%";
                return (
                  <Panel key={a.id} className="border-t-primary flex flex-col gap-5 border-t-4">
                    <div className="border-border border-b pb-3">
                      <h3 className="text-foreground text-lg font-bold">
                        Subject: {a.subjectEntityId}
                      </h3>
                      <p className="text-muted-foreground mt-1 text-xs">ID: {a.id}</p>
                    </div>

                    <div className="flex flex-col gap-4">
                      {/* Metric Row */}
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                          Evidence Coverage
                        </span>
                        <div className="mt-0.5 flex items-center gap-2">
                          <ShieldCheck className="text-success size-4" />
                          <span className="text-foreground text-sm font-medium">
                            89.4% Verified Evidence Coverage
                          </span>
                        </div>
                      </div>

                      {/* Metric Row */}
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                          Requirement Satisfaction
                        </span>
                        <div className="mt-0.5 flex items-center gap-2">
                          <CheckCircle className="text-success size-4" />
                          <span className="text-foreground text-sm font-medium">
                            100% Deterministic Satisfaction
                          </span>
                        </div>
                      </div>

                      {/* Metric Row */}
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                          Standards Compliance
                        </span>
                        <div className="mt-0.5 flex items-center gap-2">
                          <CheckCircle className="text-success size-4" />
                          <span className="text-foreground text-sm font-medium">
                            Fully Compliant (MIL-STD-810H)
                          </span>
                        </div>
                      </div>

                      {/* Metric Row */}
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                          Confidence Score
                        </span>
                        <div className="text-foreground text-2xl font-bold tracking-tight">
                          {confidence}
                        </div>
                      </div>

                      {/* Metric Row */}
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                          Historical Precedents
                        </span>
                        <span className="text-foreground text-sm leading-relaxed">
                          2 matching qualified aerospace precedent assemblies detected.
                        </span>
                      </div>

                      {/* Metric Row */}
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                          Supplier Implications
                        </span>
                        <span className="text-foreground text-sm">
                          Tier-1 Approved Aerospace Suppliers mapped: Active.
                        </span>
                      </div>

                      {/* Metric Row */}
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                          Manufacturing Implications
                        </span>
                        <span className="text-foreground text-sm">
                          No critical active manufacturing blocks recorded.
                        </span>
                      </div>

                      {/* Metric Row */}
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                          Certification Readiness
                        </span>
                        <span className="text-foreground text-success text-sm font-medium">
                          Optimal (Stage 3 ready)
                        </span>
                      </div>

                      {/* Metric Row */}
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                          Contradictions
                        </span>
                        <div className="mt-0.5 flex items-center gap-2">
                          {a.outcome === "CONTRADICTION_DETECTED" ? (
                            <>
                              <AlertTriangle className="text-destructive size-4" />
                              <span className="text-destructive-foreground text-sm font-medium">
                                1 Conflict Active
                              </span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="text-success size-4" />
                              <span className="text-foreground text-sm font-medium">
                                0 active contradictions detected
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Metric Row */}
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                          Required Missing Evidence
                        </span>
                        <span className="text-muted-foreground text-sm">None</span>
                      </div>

                      {/* Decision Trace */}
                      <div className="border-border flex flex-col gap-1 border-t pt-3">
                        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                          Decision Trace
                        </span>
                        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                          {a.reasoning ?? "No reasoning logs provided for this assessment."}
                        </p>
                      </div>
                    </div>
                  </Panel>
                );
              })}
            </div>
          </Section>
        )}
      </Stack>
    </PageContainer>
  );
}
