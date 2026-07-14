import { Check, X } from "lucide-react";

interface TraceNode {
  type: string;
  description: string;
  result: boolean;
  children?: TraceNode[];
  detail?: Record<string, unknown>;
}

export function TraceViewer({ node, depth = 0 }: { node: TraceNode; depth?: number }) {
  return (
    <div className={depth > 0 ? "border-border ml-3 border-l pl-3" : ""}>
      <div className="flex items-start gap-2 py-1">
        {node.result ? (
          <Check className="text-success mt-0.5 size-4 shrink-0" />
        ) : (
          <X className="text-destructive mt-0.5 size-4 shrink-0" />
        )}
        <div className="flex flex-col">
          <span className="text-foreground text-sm">{node.description}</span>
          {node.detail && Object.keys(node.detail).length > 0 && (
            <span className="text-muted-foreground text-xs">
              {Object.entries(node.detail)
                .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
                .join(", ")}
            </span>
          )}
        </div>
      </div>
      {node.children && node.children.length > 0 && (
        <div className="flex flex-col">
          {node.children.map((child, index) => (
            <TraceViewer key={index} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
