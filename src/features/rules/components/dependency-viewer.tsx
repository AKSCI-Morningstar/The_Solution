import Link from "next/link";
import { RuleStatusBadge } from "./rule-status-badge";

interface DependencyRuleRef {
  id: string;
  name: string;
  status: string;
  category?: string;
}

export interface DependencyViewerProps {
  upstream: DependencyRuleRef[];
  downstream: DependencyRuleRef[];
}

function DependencyColumn({
  title,
  rules,
  emptyText,
}: {
  title: string;
  rules: DependencyRuleRef[];
  emptyText: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-foreground text-sm font-semibold">{title}</h3>
      {rules.length === 0 ? (
        <p className="text-muted-foreground text-sm">{emptyText}</p>
      ) : (
        <div className="divide-border border-border divide-y rounded-md border">
          {rules.map((rule) => (
            <Link
              key={rule.id}
              href={`/rules/${rule.id}`}
              className="hover:bg-surface-hover flex items-center justify-between px-3 py-2"
            >
              <span className="text-foreground text-sm">{rule.name}</span>
              <RuleStatusBadge status={rule.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function DependencyViewer({ upstream, downstream }: DependencyViewerProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <DependencyColumn
        title="Depends on (upstream)"
        rules={upstream}
        emptyText="This rule has no dependencies."
      />
      <DependencyColumn
        title="Depended on by (downstream)"
        rules={downstream}
        emptyText="No other rules depend on this one."
      />
    </div>
  );
}
