import { Card, CardContent } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";

export interface ParserHealthItem {
  parserName: string;
  parserVersion: string;
  totalRuns: number;
  totalFailures: number;
  consecutiveFailures: number;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
}

function healthStatus(parser: ParserHealthItem): "active" | "warning" | "error" {
  if (parser.consecutiveFailures >= 3) return "error";
  if (parser.consecutiveFailures > 0) return "warning";
  return "active";
}

export function ParserHealthCards({ parsers }: { parsers: ParserHealthItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {parsers.map((parser) => (
        <Card key={parser.parserName}>
          <CardContent className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between">
              <span className="text-foreground text-sm font-medium">{parser.parserName}</span>
              <StatusIndicator status={healthStatus(parser)} showLabel={false} />
            </div>
            <span className="text-muted-foreground text-xs">v{parser.parserVersion}</span>
            <div className="text-muted-foreground flex items-center gap-3 text-xs">
              <span>{parser.totalRuns} runs</span>
              <span>{parser.totalFailures} failures</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
