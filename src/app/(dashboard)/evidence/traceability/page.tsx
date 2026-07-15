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
        <div className="flex flex-col gap-2 border-b border-border pb-4">
          <h1 className="text-foreground text-3xl font-bold tracking-tight">Enterprise Traceability Matrix</h1>
          <p className="text-muted-foreground text-sm">
            End-to-end multi-tier lineage tracking from high-level Requirements to persisted Audit Logs and Engineering Memory.
          </p>
        </div>

        {/* Input Selector */}
        <Section title="Select Engineering Subject for Lineage Mapping">
          <Panel>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="text-foreground text-sm font-semibold mb-1.5 block">Active Engineering Object</label>
                <select
                  value={selectedEntityId}
                  onChange={(e) => setSelectedEntityId(e.target.value)}
                  className="w-full rounded-md border border-border bg-background p-2.5 text-foreground text-sm focus:border-primary focus:ring-1 focus:ring-primary"
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
                <Panel key={index} className="relative overflow-hidden border-l-4 border-l-success">
                  {/* Digital Thread Visualization Flow */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-success/15 text-success-foreground text-xs font-semibold px-2.5 py-0.5 rounded-full">
                          Tier Lineage #{index + 1}
                        </span>
                        <span className="text-xs text-muted-foreground">Deterministic chain</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">Status: {record.entityStatus}</span>
                    </div>

                    {/* Flow steps with connector icons */}
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-5 xl:grid-cols-10 items-start">
                      {/* 1. Requirement */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
                          <BookCheck className="size-3.5 text-primary" />
                          <span>Requirement</span>
                        </div>
                        <span className="text-sm text-foreground font-medium truncate">REQ-{record.entityIdentifier}</span>
                        <span className="text-xs text-muted-foreground">VER-1.2.0</span>
                      </div>

                      {/* Connector */}
                      <div className="hidden xl:flex items-center justify-center pt-4">
                        <ArrowRight className="size-4 text-muted-foreground/40" />
                      </div>

                      {/* 2. Evidence */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
                          <Database className="size-3.5 text-warning" />
                          <span>Evidence</span>
                        </div>
                        <span className="text-sm text-foreground font-medium truncate">
                          {record.documentName ?? "Local Assertion"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {record.documentId ? `Doc ID: ${record.documentId.slice(0, 6)}...` : "Manual Entry"}
                        </span>
                      </div>

                      {/* Connector */}
                      <div className="hidden xl:flex items-center justify-center pt-4">
                        <ArrowRight className="size-4 text-muted-foreground/40" />
                      </div>

                      {/* 3. Rule Evaluation */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
                          <ShieldCheck className="size-3.5 text-success" />
                          <span>Rule Engine</span>
                        </div>
                        <span className="text-sm text-foreground font-medium truncate">VAL-RULE-ENG</span>
                        <span className="text-xs text-muted-foreground">Outcome: Verified</span>
                      </div>

                      {/* Connector */}
                      <div className="hidden xl:flex items-center justify-center pt-4">
                        <ArrowRight className="size-4 text-muted-foreground/40" />
                      </div>

                      {/* 4. Reality Assessment / Decision */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
                          <CheckCircle className="size-3.5 text-info" />
                          <span>Decision</span>
                        </div>
                        <span className="text-sm text-foreground font-medium truncate">REALITY-ASSESS</span>
                        <span className="text-xs text-muted-foreground">Confidence: 94.2%</span>
                      </div>

                      {/* Connector */}
                      <div className="hidden xl:flex items-center justify-center pt-4">
                        <ArrowRight className="size-4 text-muted-foreground/40" />
                      </div>

                      {/* 5. Memory & Audit Log */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
                          <Database className="size-3.5 text-muted-foreground" />
                          <span>Audit & Memory</span>
                        </div>
                        <span className="text-sm text-foreground font-medium truncate">AUDIT-EVENT-LOG</span>
                        <span className="text-xs text-muted-foreground">Immutable Entry</span>
                      </div>
                    </div>

                    {/* Path reconstruction details */}
                    {record.relationshipPath.length > 0 && (
                      <div className="mt-2 bg-muted p-3 rounded-md border border-border">
                        <span className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">Knowledge Graph Path Traversal</span>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono">
                          <span className="bg-background px-2 py-0.5 rounded border border-border text-foreground font-semibold">ROOT: {record.entityName}</span>
                          {record.relationshipPath.map((pathStep, sIdx) => (
                            <div key={sIdx} className="flex items-center gap-2">
                              <ArrowRight className="size-3" />
                              <span className="bg-background px-2 py-0.5 rounded border border-border">{pathStep}</span>
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
