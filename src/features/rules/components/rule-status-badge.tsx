import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "success" | "warning"
> = {
  DRAFT: "secondary",
  ACTIVE: "success",
  DEPRECATED: "warning",
  ARCHIVED: "secondary",
};

export function RuleStatusBadge({ status }: { status: string }) {
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

export function RuleOutcomeBadge({ outcome }: { outcome: string }) {
  return (
    <Badge variant={OUTCOME_VARIANT[outcome] ?? "secondary"} size="sm">
      {outcome.replaceAll("_", " ")}
    </Badge>
  );
}

const SEVERITY_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "success" | "warning"
> = {
  INFO: "secondary",
  WARNING: "warning",
  ERROR: "destructive",
  CRITICAL: "destructive",
};

export function RuleSeverityBadge({ severity }: { severity: string }) {
  return (
    <Badge variant={SEVERITY_VARIANT[severity] ?? "secondary"} size="sm">
      {severity}
    </Badge>
  );
}
