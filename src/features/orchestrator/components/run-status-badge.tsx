import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "success" | "warning"
> = {
  QUEUED: "secondary",
  RUNNING: "default",
  COMPLETED: "success",
  FAILED: "destructive",
  CANCELLED: "warning",
};

export function RunStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "secondary"} size="sm">
      {status}
    </Badge>
  );
}

const OUTCOME_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "success" | "warning"
> = {
  PASSED: "success",
  FAILED: "destructive",
  NEEDS_REVIEW: "warning",
  BLOCKED: "secondary",
  INSUFFICIENT_EVIDENCE: "secondary",
};

export function AssessmentOutcomeBadge({ outcome }: { outcome: string }) {
  return (
    <Badge variant={OUTCOME_VARIANT[outcome] ?? "secondary"} size="sm">
      {outcome.replaceAll("_", " ")}
    </Badge>
  );
}

const STAGE_STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "success" | "warning"
> = {
  PENDING: "secondary",
  RUNNING: "default",
  SUCCEEDED: "success",
  FAILED: "destructive",
  SKIPPED: "secondary",
  RETRYING: "warning",
};

export function StageStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STAGE_STATUS_VARIANT[status] ?? "secondary"} size="sm">
      {status}
    </Badge>
  );
}
