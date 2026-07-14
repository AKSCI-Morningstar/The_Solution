import { FragmentList } from "@/features/rules/components";

export default function RuleFragmentsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-3xl font-bold tracking-tight">Rule fragments</h1>
        <p className="text-muted-foreground text-sm">
          Reusable condition fragments shared across rules.
        </p>
      </div>
      <FragmentList />
    </div>
  );
}
