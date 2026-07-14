import { AssessmentList } from "@/features/reality/components";

export default function RealityEnginePage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-3xl font-bold tracking-tight">
          Engineering Reality Engine
        </h1>
        <p className="text-muted-foreground text-sm">
          Determines Engineering Reality - the current verifiable state of an engineering system -
          by reinterpreting completed Orchestration Runs through additional deterministic signals:
          current contradiction status and Ingestion Pipeline completeness.
        </p>
      </div>
      <AssessmentList />
    </div>
  );
}
