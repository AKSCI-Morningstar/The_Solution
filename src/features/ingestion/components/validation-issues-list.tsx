import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ShieldCheck } from "lucide-react";

export interface ValidationIssueItem {
  id: string;
  severity: string;
  code: string;
  message: string;
  stage: string;
}

const SEVERITY_VARIANT: Record<string, "destructive" | "warning" | "secondary"> = {
  ERROR: "destructive",
  WARNING: "warning",
  INFO: "secondary",
};

export function ValidationIssuesList({ issues }: { issues: ValidationIssueItem[] }) {
  if (issues.length === 0) {
    return (
      <EmptyState
        icon={<ShieldCheck className="size-10" />}
        title="No validation issues"
        description="This extraction run produced no warnings or errors."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {issues.map((issue) => (
        <li
          key={issue.id}
          className="border-border flex items-start gap-3 rounded-md border p-3 text-sm"
        >
          <Badge variant={SEVERITY_VARIANT[issue.severity] ?? "secondary"} size="sm">
            {issue.severity}
          </Badge>
          <div className="flex flex-col gap-0.5">
            <span className="text-foreground">{issue.message}</span>
            <span className="text-muted-foreground text-xs">
              {issue.code} · {issue.stage.replaceAll("_", " ").toLowerCase()}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
