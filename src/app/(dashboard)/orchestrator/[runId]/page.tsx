import { RunDetail } from "@/features/orchestrator/components";

export default async function OrchestrationRunPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <RunDetail runId={runId} />
    </div>
  );
}
