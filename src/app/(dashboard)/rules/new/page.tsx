import { RuleEditor } from "@/features/rules/components";

export default function NewRulePage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-3xl font-bold tracking-tight">New rule</h1>
        <p className="text-muted-foreground text-sm">
          Define a deterministic condition tree evaluated against the canonical entity graph.
        </p>
      </div>
      <RuleEditor />
    </div>
  );
}
