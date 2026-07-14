"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RuleEditor, type RuleEditorInitialValue } from "@/features/rules/components";

export default function EditRulePage() {
  const { ruleId } = useParams<{ ruleId: string }>();
  const [initialRule, setInitialRule] = useState<RuleEditorInitialValue | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/rules/${ruleId}`);
        const json = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(json.error ?? "Failed to load rule");
          return;
        }
        const rule = json.data;
        if (!cancelled) {
          setInitialRule({
            id: rule.id,
            name: rule.name,
            description: rule.description,
            category: rule.category,
            priority: rule.priority,
            severity: rule.severity,
            tags: rule.tags,
            scope: rule.scope,
            conditionRoot: rule.conditionRoot,
            dependsOnRuleIds: rule.dependsOn.map(
              (d: { dependsOnRuleId: string }) => d.dependsOnRuleId,
            ),
          });
        }
      } catch {
        if (!cancelled) setError("Failed to load rule");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [ruleId]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-3xl font-bold tracking-tight">Edit rule</h1>
      </div>
      {error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : !initialRule ? (
        <p className="text-muted-foreground text-sm">Loading rule...</p>
      ) : (
        <RuleEditor initialRule={initialRule} />
      )}
    </div>
  );
}
