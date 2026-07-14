import Link from "next/link";
import { RuleList } from "@/features/rules/components";

export default function RulesPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-foreground text-3xl font-bold tracking-tight">Rules</h1>
          <p className="text-muted-foreground text-sm">
            Deterministic engineering rules evaluated against the canonical entity graph.
          </p>
        </div>
        <Link href="/rules/fragments" className="text-muted-foreground text-sm hover:underline">
          Manage fragments &rarr;
        </Link>
      </div>
      <RuleList />
    </div>
  );
}
