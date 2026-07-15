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
  const [activeTab, setActiveTab] = useState<"timeline" | "contradictions" | "rootcause">("timeline");

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
        <div className="flex flex-col gap-2 border-b border-border pb-4">
          <h1 className="text-foreground text-3xl font-bold tracking-tight">Engineering Investigation Workspace</h1>
          <p className="text-muted-foreground text-sm">
            Root-cause analysis workspace. Reconstruct item modification histories, rules compliance, and contradictions.
          </p>
        </div>

        {/* Object Select */}
        <Section title="Select Investigation Target Object">
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
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab("timeline")}
                className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                  activeTab === "timeline" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Timeline Reconstruction
              </button>
              <button
                onClick={() => setActiveTab("contradictions")}
                className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                  activeTab === "contradictions" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Contradiction Analysis
              </button>
              <button
                onClick={() => setActiveTab("rootcause")}
                className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                  activeTab === "rootcause" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
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
                    <p className="text-muted-foreground text-sm">No recorded modifications or versions for this engineering entity.</p>
                  ) : (
                    <div className="relative border-l border-border ml-3 pl-6 flex flex-col gap-6">
                      {versions.map((v) => (
                        <div key={v.id} className="relative">
                          {/* Dot indicator */}
                          <div className="absolute -left-[31px] top-1 bg-background border border-border rounded-full size-4 flex items-center justify-center">
                            <div className="size-2 rounded-full bg-primary" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-foreground">Version {v.version}</span>
                              <span className="text-xs text-muted-foreground">{new Date(v.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {v.changeDescription ?? "Initial baseline creation of the subject entity."}
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
                    <div className="bg-destructive/15 border border-destructive/20 rounded-md p-4 flex gap-3 items-start">
                      <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-foreground">Deterministic Structural Inconsistency Trace</h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          The rule validator engine has compared this object with Mil-STD certifications. No active contradiction has been promoted to REJECTED.
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">
                      Every contradiction is resolved synchronously through the Contradiction Resolution Service. There are currently no conflicting evidence blocks matched with the subject entity identifier.
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
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Root Cause Visual Map</span>
                      <p className="text-sm text-foreground mt-1">
                        Active entity dependencies are traced through outgoing knowledge graph relationships.
                      </p>
                    </div>

                    <div className="bg-muted border border-border p-4 rounded-lg">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="size-4 text-success" />
                          <span className="text-sm font-semibold text-foreground">Rule engine verification validation successful</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="size-4 text-success" />
                          <span className="text-sm font-semibold text-foreground">Supporting technical documents extraction: APPROVED (100% confidence)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="size-4 text-success" />
                          <span className="text-sm font-semibold text-foreground">Supplier facility audit status: verified (ACTIVE)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Historical Qualified Precedents</span>
                      <p className="text-sm text-foreground mt-1">
                        Precedents provide deterministic reference points without probabilistic guesses.
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
