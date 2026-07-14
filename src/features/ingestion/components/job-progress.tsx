import { CheckCircle2, XCircle, MinusCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export interface StageLogItem {
  id: string;
  stageName: string;
  stageIndex: number;
  status: string;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  errorMessage: string | null;
}

function stageIcon(status: string) {
  switch (status) {
    case "SUCCEEDED":
      return <CheckCircle2 className="text-success size-4" />;
    case "FAILED":
      return <XCircle className="text-destructive size-4" />;
    case "SKIPPED":
      return <MinusCircle className="text-muted-foreground size-4" />;
    default:
      return <Loader2 className="text-muted-foreground size-4 animate-spin" />;
  }
}

export function JobProgress({
  progressPercent,
  status,
  stageLogs,
}: {
  progressPercent: number;
  status: string;
  stageLogs: StageLogItem[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <div className="text-muted-foreground flex justify-between text-xs">
          <span>Pipeline progress</span>
          <span>{progressPercent}%</span>
        </div>
        <Progress
          value={progressPercent}
          variant={status === "FAILED" ? "warning" : status === "SUCCEEDED" ? "success" : "default"}
        />
      </div>

      <ol className="flex flex-col gap-2">
        {stageLogs.map((stage) => (
          <li key={stage.id} className="flex items-center gap-3 text-sm">
            {stageIcon(stage.status)}
            <span className="text-foreground flex-1">
              {stage.stageName.replaceAll("_", " ").toLowerCase()}
            </span>
            {stage.durationMs !== null && (
              <span className="text-muted-foreground text-xs">{stage.durationMs}ms</span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
