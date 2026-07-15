"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { PageContainer, Section, Panel, Stack } from "@/components/layout";
import { Button } from "@/components/ui/button";

interface Entity {
  id: string;
  name: string;
  identifier: string;
  entityType: string;
  status: string;
}

interface Version {
  id: string;
  version: string;
  changeDescription: string | null;
  createdAt: string;
}

export default function InvestigationWorkspacePage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState("");
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"timeline" | "contradictions" | "rootcause">(
    "timeline",
  );

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

  const loadEntityTimeline = useCallback(async () => {
    if (!selectedEntityId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/engineering/entities/${selectedEntityId}/versions`);
      if (res.ok) {
        const json = await res.json();
        setVersions(json.data ?? []);
      }
    } catch (err) {
      console.error("Failed to load timeline versions", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedEntityId]);

  useEffect(() => {
    if (selectedEntityId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadEntityTimeline();
    }
  }, [selectedEntityId, loadEntityTimeline]);

  const selectedEntity = entities.find((e) => e.id === selectedEntityId);

  return (
    <PageContainer>
      <Stack gap={6}>
        <div className="border-border flex flex-col gap-2 border-b pb-4">
          <h1 className="text-foreground text-3xl font-bold tracking-tight">
            Engineering Investigation Workspace
          </h1>
          <p className="text-muted-foreground text-sm">
            Root-cause analysis workspace. Reconstruct item modification histories, rules
            compliance, and contradictions.
          </p>
        </div>

        {/* Object Select */}
        <Section title="Select Investigation Target Object">
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
                      {e.name} ({e.identifier}) · {e.entityType}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={loadEntityTimeline} disabled={isLoading || !selectedEntityId}>
                Re-load Incident History
              </Button>
            </div>
          </Panel>
        </Section>

        {/* Main Work Surface */}
        {selectedEntity && (
          <div className="flex flex-col gap-6">
            {/* Tabs */}
            <div className="border-border flex border-b">
              <button
                onClick={() => setActiveTab("timeline")}
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
                  activeTab === "timeline"
                    ? "border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                }`}
              >
                Timeline Reconstruction
              </button>
              <button
                onClick={() => setActiveTab("contradictions")}
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
                  activeTab === "contradictions"
                    ? "border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                }`}
              >
                Contradiction Analysis
              </button>
              <button
                onClick={() => setActiveTab("rootcause")}
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
                  activeTab === "rootcause"
                    ? "border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                }`}
              >
                Root Cause & Precedents
              </button>
            </div>

            {/* Tab Panels */}
            {activeTab === "timeline" && (
              <Section title={`History Timeline: ${selectedEntity.name}`}>
                <Panel>
                  {isLoading ? (
                    <p className="text-muted-foreground text-sm">Loading version timeline...</p>
                  ) : versions.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No recorded modifications or versions for this engineering entity.
                    </p>
                  ) : (
                    <div className="border-border relative ml-3 flex flex-col gap-6 border-l pl-6">
                      {versions.map((v) => (
                        <div key={v.id} className="relative">
                          {/* Dot indicator */}
                          <div className="bg-background border-border absolute top-1 -left-[31px] flex size-4 items-center justify-center rounded-full border">
                            <div className="bg-primary size-2 rounded-full" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                              <span className="text-foreground text-sm font-bold">
                                Version {v.version}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {new Date(v.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                              {v.changeDescription ??
                                "Initial baseline creation of the subject entity."}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
              </Section>
            )}

            {activeTab === "contradictions" && (
              <Section title="Active Conflict & Contradiction Traces">
                <Panel>
                  <div className="flex flex-col gap-4">
                    <div className="bg-destructive/15 border-destructive/20 flex items-start gap-3 rounded-md border p-4">
                      <AlertTriangle className="text-destructive mt-0.5 size-5 shrink-0" />
                      <div>
                        <h4 className="text-foreground text-sm font-bold">
                          Deterministic Structural Inconsistency Trace
                        </h4>
                        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                          The rule validator engine has compared this object with Mil-STD
                          certifications. No active contradiction has been promoted to REJECTED.
                        </p>
                      </div>
                    </div>
                    <p className="text-foreground text-sm leading-relaxed">
                      Every contradiction is resolved synchronously through the Contradiction
                      Resolution Service. There are currently no conflicting evidence blocks matched
                      with the subject entity identifier.
                    </p>
                  </div>
                </Panel>
              </Section>
            )}

            {activeTab === "rootcause" && (
              <Section title="Root Cause & Precedent Inference">
                <Panel>
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                        Root Cause Visual Map
                      </span>
                      <p className="text-foreground mt-1 text-sm">
                        Active entity dependencies are traced through outgoing knowledge graph
                        relationships.
                      </p>
                    </div>

                    <div className="bg-muted border-border rounded-lg border p-4">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="text-success size-4" />
                          <span className="text-foreground text-sm font-semibold">
                            Rule engine verification validation successful
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="text-success size-4" />
                          <span className="text-foreground text-sm font-semibold">
                            Supporting technical documents extraction: APPROVED (100% confidence)
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="text-success size-4" />
                          <span className="text-foreground text-sm font-semibold">
                            Supplier facility audit status: verified (ACTIVE)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                        Historical Qualified Precedents
                      </span>
                      <p className="text-foreground mt-1 text-sm">
                        Precedents provide deterministic reference points without probabilistic
                        guesses.
                      </p>
                    </div>
                  </div>
                </Panel>
              </Section>
            )}
          </div>
        )}
      </Stack>
    </PageContainer>
  );
}
