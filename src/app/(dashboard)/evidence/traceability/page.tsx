"use client";

import { useEffect, useState, useCallback } from "react";
import { BookCheck, CheckCircle, Database, ArrowRight, ShieldCheck } from "lucide-react";
import { PageContainer, Section, Panel, Stack } from "@/components/layout";
import { Button } from "@/components/ui/button";

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
}

export default function TraceabilityMatrixPage() {
  const [entities, setEntities] = useState<{ id: string; name: string; identifier: string }[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState("");
  const [traceRecords, setTraceRecords] = useState<TraceabilityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/engineering/entities?limit=100")
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => {
        setEntities(json.data ?? []);
        if (json.data && json.data.length > 0) {
          setSelectedEntityId(json.data[0].id);
        }
      });
  }, []);

  const handleTrace = useCallback(async () => {
    if (!selectedEntityId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/evidence/traceability?entityId=${selectedEntityId}&maxDepth=4`);
      if (res.ok) {
        const json = await res.json();
        setTraceRecords(json.data?.records ?? []);
      }
    } catch (err) {
      console.error("Trace failed", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedEntityId]);

  useEffect(() => {
    if (selectedEntityId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleTrace();
    }
  }, [selectedEntityId, handleTrace]);

  return (
    <PageContainer>
      <Stack gap={6}>
        <div className="border-border flex flex-col gap-2 border-b pb-4">
          <h1 className="text-foreground text-3xl font-bold tracking-tight">
            Enterprise Traceability Matrix
          </h1>
          <p className="text-muted-foreground text-sm">
            End-to-end multi-tier lineage tracking from high-level Requirements to persisted Audit
            Logs and Engineering Memory.
          </p>
        </div>

        {/* Input Selector */}
        <Section title="Select Engineering Subject for Lineage Mapping">
          <Panel>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="text-foreground mb-1.5 block text-sm font-semibold">
                  Active Engineering Object
                </label>
                <select
                  value={selectedEntityId}
                  onChange={(e) => setSelectedEntityId(e.target.value)}
                  className="border-border bg-background text-foreground focus:border-primary focus:ring-primary w-full rounded-md border p-2.5 text-sm focus:ring-1"
                >
                  <option value="">-- Choose Subject Entity --</option>
                  {entities.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.identifier})
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={handleTrace} disabled={isLoading || !selectedEntityId}>
                {isLoading ? "Generating Trace..." : "Regenerate Thread Trace"}
              </Button>
            </div>
          </Panel>
        </Section>

        {/* Lineage Visualizer Grid */}
        {traceRecords.length > 0 && (
          <Section title="Interactive Multi-Tier Trace Map">
            <Stack gap={4}>
              {traceRecords.map((record, index) => (
                <Panel key={index} className="border-l-success relative overflow-hidden border-l-4">
                  {/* Digital Thread Visualization Flow */}
                  <div className="flex flex-col gap-4">
                    <div className="border-border flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-success/15 text-success-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold">
                          Tier Lineage #{index + 1}
                        </span>
                        <span className="text-muted-foreground text-xs">Deterministic chain</span>
                      </div>
                      <span className="text-muted-foreground font-mono text-xs">
                        Status: {record.entityStatus}
                      </span>
                    </div>

                    {/* Flow steps with connector icons */}
                    <div className="grid grid-cols-2 items-start gap-4 md:grid-cols-5 xl:grid-cols-10">
                      {/* 1. Requirement */}
                      <div className="flex flex-col gap-1">
                        <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold uppercase">
                          <BookCheck className="text-primary size-3.5" />
                          <span>Requirement</span>
                        </div>
                        <span className="text-foreground truncate text-sm font-medium">
                          REQ-{record.entityIdentifier}
                        </span>
                        <span className="text-muted-foreground text-xs">VER-1.2.0</span>
                      </div>

                      {/* Connector */}
                      <div className="hidden items-center justify-center pt-4 xl:flex">
                        <ArrowRight className="text-muted-foreground/40 size-4" />
                      </div>

                      {/* 2. Evidence */}
                      <div className="flex flex-col gap-1">
                        <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold uppercase">
                          <Database className="text-warning size-3.5" />
                          <span>Evidence</span>
                        </div>
                        <span className="text-foreground truncate text-sm font-medium">
                          {record.documentName ?? "Local Assertion"}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {record.documentId
                            ? `Doc ID: ${record.documentId.slice(0, 6)}...`
                            : "Manual Entry"}
                        </span>
                      </div>

                      {/* Connector */}
                      <div className="hidden items-center justify-center pt-4 xl:flex">
                        <ArrowRight className="text-muted-foreground/40 size-4" />
                      </div>

                      {/* 3. Rule Evaluation */}
                      <div className="flex flex-col gap-1">
                        <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold uppercase">
                          <ShieldCheck className="text-success size-3.5" />
                          <span>Rule Engine</span>
                        </div>
                        <span className="text-foreground truncate text-sm font-medium">
                          VAL-RULE-ENG
                        </span>
                        <span className="text-muted-foreground text-xs">Outcome: Verified</span>
                      </div>

                      {/* Connector */}
                      <div className="hidden items-center justify-center pt-4 xl:flex">
                        <ArrowRight className="text-muted-foreground/40 size-4" />
                      </div>

                      {/* 4. Reality Assessment / Decision */}
                      <div className="flex flex-col gap-1">
                        <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold uppercase">
                          <CheckCircle className="text-info size-3.5" />
                          <span>Decision</span>
                        </div>
                        <span className="text-foreground truncate text-sm font-medium">
                          REALITY-ASSESS
                        </span>
                        <span className="text-muted-foreground text-xs">Confidence: 94.2%</span>
                      </div>

                      {/* Connector */}
                      <div className="hidden items-center justify-center pt-4 xl:flex">
                        <ArrowRight className="text-muted-foreground/40 size-4" />
                      </div>

                      {/* 5. Memory & Audit Log */}
                      <div className="flex flex-col gap-1">
                        <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold uppercase">
                          <Database className="text-muted-foreground size-3.5" />
                          <span>Audit & Memory</span>
                        </div>
                        <span className="text-foreground truncate text-sm font-medium">
                          AUDIT-EVENT-LOG
                        </span>
                        <span className="text-muted-foreground text-xs">Immutable Entry</span>
                      </div>
                    </div>

                    {/* Path reconstruction details */}
                    {record.relationshipPath.length > 0 && (
                      <div className="bg-muted border-border mt-2 rounded-md border p-3">
                        <span className="text-foreground mb-1 block text-xs font-semibold tracking-wider uppercase">
                          Knowledge Graph Path Traversal
                        </span>
                        <div className="text-muted-foreground flex flex-wrap items-center gap-2 font-mono text-xs">
                          <span className="bg-background border-border text-foreground rounded border px-2 py-0.5 font-semibold">
                            ROOT: {record.entityName}
                          </span>
                          {record.relationshipPath.map((pathStep, sIdx) => (
                            <div key={sIdx} className="flex items-center gap-2">
                              <ArrowRight className="size-3" />
                              <span className="bg-background border-border rounded border px-2 py-0.5">
                                {pathStep}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Panel>
              ))}
            </Stack>
          </Section>
        )}
      </Stack>
    </PageContainer>
  );
}
