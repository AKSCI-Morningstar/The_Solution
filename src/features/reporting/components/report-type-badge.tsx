import { Badge } from "@/components/ui/badge";
import { REPORT_TYPE_LABELS, type ReportType } from "@/server/reporting/constants";

export function ReportTypeBadge({ type }: { type: string }) {
  return (
    <Badge variant="secondary" size="sm">
      {REPORT_TYPE_LABELS[type as ReportType] ?? type}
    </Badge>
  );
}
