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

export function AssessmentStatusBadge({ status }: { status: string }) {
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
  VERIFIED: "success",
  CONDITIONALLY_VERIFIED: "warning",
  CONTRADICTED: "destructive",
  INCOMPLETE: "secondary",
  NEEDS_REVIEW: "warning",
  INSUFFICIENT_EVIDENCE: "secondary",
};

export function RealityOutcomeBadge({ outcome }: { outcome: string }) {
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

export function RealityStageStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STAGE_STATUS_VARIANT[status] ?? "secondary"} size="sm">
      {status}
    </Badge>
  );
}
