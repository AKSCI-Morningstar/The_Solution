import { RunList } from "@/features/orchestrator/components";

export default function OrchestratorPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-3xl font-bold tracking-tight">
          Engineering Reasoning Orchestrator
        </h1>
        <p className="text-muted-foreground text-sm">
          Coordinates the Knowledge Graph, Evidence Resolution, Contradiction, Rule, and
          Traceability engines into one deterministic, auditable evaluation per run.
        </p>
      </div>
      <RunList />
    </div>
  );
}
