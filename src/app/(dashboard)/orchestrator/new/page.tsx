import { NewRunForm } from "@/features/orchestrator/components";

export default function NewOrchestrationRunPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-3xl font-bold tracking-tight">New evaluation</h1>
        <p className="text-muted-foreground text-sm">
          Start a deterministic engineering evaluation for a subject entity.
        </p>
      </div>
      <NewRunForm />
    </div>
  );
}
