"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Clock, Tags, FileText, Layers } from "lucide-react";
import { PageContainer, Section, Panel, Stack } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";

interface TimelineEvent {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

export default function EngineeringTimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "20",
    });
    if (search.trim()) params.set("search", search.trim());
    if (entityFilter) params.set("entity", entityFilter);
    return params.toString();
  }, [page, search, entityFilter]);

  const loadTimeline = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/audit?${queryString}`);
      if (res.ok) {
        const json = await res.json();
        setEvents(json.data ?? []);
        setTotal(json.total ?? 0);
      }
    } catch (err) {
      console.error("Failed to load timeline events", err);
    } finally {
      setIsLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTimeline();
  }, [loadTimeline]);

  const totalPages = Math.ceil(total / 20);

  return (
    <PageContainer>
      <Stack gap={6}>
        <div className="border-border flex flex-col gap-2 border-b pb-4">
          <h1 className="text-foreground text-3xl font-bold tracking-tight">
            Engineering Timeline
          </h1>
          <p className="text-muted-foreground text-sm">
            Deterministic, unified chronological log tracking every event: evidence added, rule
            modifications, reality assessments, approvals, and decisions.
          </p>
        </div>

        {/* Filter Toolbar */}
        <Section title="Search & Filter Chronological Log">
          <Panel>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input
                label="Search Keyword"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search action, entity ID..."
              />
              <Select
                label="Filter by Entity Type"
                value={entityFilter}
                onChange={(e) => {
                  setEntityFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "", label: "All Timeline Categories" },
                  { value: "EngineeringEntity", label: "Engineering Entities" },
                  { value: "Rule", label: "Validation Rules" },
                  { value: "OrchestrationRun", label: "Orchestration Pipeline Runs" },
                  { value: "IngestionDocument", label: "Ingestion & Uploads" },
                ]}
              />
              <div className="flex items-end">
                <Button className="w-full" onClick={loadTimeline}>
                  Apply Filter Constraints
                </Button>
              </div>
            </div>
          </Panel>
        </Section>

        {/* Main Chronological Stream */}
        <Section title="Engineering Event Stream">
          <Panel padding="none">
            {isLoading ? (
              <div className="text-muted-foreground p-8 text-center">
                Retrieving immutable timeline events...
              </div>
            ) : events.length === 0 ? (
              <div className="text-muted-foreground p-8 text-center">
                No matching chronological records. Try broadening your filter options.
              </div>
            ) : (
              <Stack gap={0} className="divide-border divide-y">
                {events.map((event) => {
                  // Determine icon
                  let Icon = Clock;
                  if (event.entity === "EngineeringEntity") Icon = Tags;
                  if (event.entity === "Rule") Icon = Clock;
                  if (event.entity === "OrchestrationRun") Icon = Layers;
                  if (event.entity === "IngestionDocument") Icon = FileText;

                  return (
                    <div
                      key={event.id}
                      className="hover:bg-surface-hover flex items-start gap-4 p-5 transition-colors"
                    >
                      <div className="bg-muted text-muted-foreground shrink-0 rounded-md p-2">
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between md:gap-0">
                          <span className="text-foreground text-sm font-bold capitalize">
                            {event.action.replaceAll("_", " ").toLowerCase()}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {new Date(event.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-1 font-mono text-xs">
                          Entity Type: {event.entity} · Identifier: {event.entityId}
                        </p>
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div className="bg-muted text-muted-foreground mt-2 overflow-x-auto rounded p-2 font-mono text-[11px]">
                            {JSON.stringify(event.metadata)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </Stack>
            )}
          </Panel>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                {total} total chronological entries logged
              </span>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </Section>
      </Stack>
    </PageContainer>
  );
}
