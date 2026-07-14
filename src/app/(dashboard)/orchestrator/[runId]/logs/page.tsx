import Link from "next/link";
import { StageLogList } from "@/features/orchestrator/components";

export default async function OrchestrationRunLogsPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex flex-col gap-1">
        <Link
          href={`/orchestrator/${runId}`}
          className="text-muted-foreground text-sm hover:underline"
        >
          &larr; Back to evaluation
        </Link>
        <h1 className="text-foreground text-3xl font-bold tracking-tight">Stage logs</h1>
      </div>
      <StageLogList runId={runId} />
    </div>
  );
}
