import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "success" | "warning"
> = {
  QUEUED: "secondary",
  RUNNING: "warning",
  SUCCEEDED: "success",
  FAILED: "destructive",
  CANCELLED: "secondary",
};

export function JobStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "secondary"} size="sm">
      {status}
    </Badge>
  );
}
