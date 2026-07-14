"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ENTITY_TYPES } from "@/server/engineering/constants";
import { RULE_CATEGORIES, RULE_SEVERITIES } from "@/server/rules/constants";
import type { RuleCondition, RuleScope } from "@/server/rules/condition-types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConditionEditor } from "./condition-editor";
import { DependencySelector } from "./dependency-selector";
import { defaultGroupCondition } from "./condition-defaults";

const ENTITY_TYPE_OPTIONS = ENTITY_TYPES.map((t) => ({ value: t, label: t.replaceAll("_", " ") }));
const SEVERITY_OPTIONS = RULE_SEVERITIES.map((s) => ({ value: s, label: s }));

export interface RuleEditorInitialValue {
  id: string;
  name: string;
  description: string | null;
  category: string;
  priority: number;
  severity: string;
  tags: string[] | null;
  scope: RuleScope;
  conditionRoot: RuleCondition;
  dependsOnRuleIds: string[];
}

export interface RuleEditorProps {
  initialRule?: RuleEditorInitialValue;
}

export function RuleEditor({ initialRule }: RuleEditorProps) {
  const router = useRouter();
  const isEditing = !!initialRule;

  const [fragments, setFragments] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function loadFragments() {
      try {
        const res = await fetch("/api/rules/fragments?page=1&pageSize=200");
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) setFragments(json.data);
        }
      } catch {
        // fragment dropdown just stays empty; not fatal to the editor
      }
    }
    loadFragments();
    return () => {
      cancelled = true;
    };
  }, []);

  const [name, setName] = useState(initialRule?.name ?? "");
  const [description, setDescription] = useState(initialRule?.description ?? "");
  const [category, setCategory] = useState(initialRule?.category ?? RULE_CATEGORIES[0]);
  const [priority, setPriority] = useState(initialRule?.priority ?? 0);
  const [severity, setSeverity] = useState(initialRule?.severity ?? "WARNING");
  const [tagsInput, setTagsInput] = useState((initialRule?.tags ?? []).join(", "));
  const [entityType, setEntityType] = useState<string>(
    initialRule?.scope.entityType ?? ENTITY_TYPES[0],
  );
  const [hasScopeFilter, setHasScopeFilter] = useState(!!initialRule?.scope.filter);
  const [scopeFilter, setScopeFilter] = useState<RuleCondition>(
    initialRule?.scope.filter ?? defaultGroupCondition(),
  );
  const [conditionRoot, setConditionRoot] = useState<RuleCondition>(
    initialRule?.conditionRoot ?? defaultGroupCondition(),
  );
  const [dependsOnRuleIds, setDependsOnRuleIds] = useState<string[]>(
    initialRule?.dependsOnRuleIds ?? [],
  );
  const [changeDescription, setChangeDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    setErrors({});

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const scope: RuleScope = {
      entityType: entityType as RuleScope["entityType"],
      filter: hasScopeFilter ? scopeFilter : undefined,
    };

    const body = {
      name,
      description: description || undefined,
      category,
      priority,
      severity,
      tags,
      scope,
      conditionRoot,
      dependsOnRuleIds,
      ...(isEditing ? { changeDescription: changeDescription || undefined } : {}),
    };

    try {
      const res = await fetch(isEditing ? `/api/rules/${initialRule.id}` : "/api/rules", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrors(json.details ?? { general: [json.error ?? "Failed to save rule"] });
        return;
      }
      router.push(`/rules/${json.data.id}`);
      router.refresh();
    } catch {
      setErrors({ general: ["Failed to save rule"] });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {errors.general && (
        <div className="border-destructive bg-destructive/10 rounded-md border p-3">
          {errors.general.map((message, index) => (
            <p key={index} className="text-destructive text-sm">
              {message}
            </p>
          ))}
        </div>
      )}
      {Object.entries(errors)
        .filter(([key]) => key !== "general")
        .map(([key, messages]) => (
          <div key={key} className="border-destructive bg-destructive/10 rounded-md border p-3">
            {messages.map((message, index) => (
              <p key={index} className="text-destructive text-sm">
                {message}
              </p>
            ))}
          </div>
        ))}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          list="rule-category-suggestions"
        />
        <datalist id="rule-category-suggestions">
          {RULE_CATEGORIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <Input
          label="Priority"
          type="number"
          value={priority}
          onChange={(e) => setPriority(Number(e.target.value))}
        />
        <Select
          label="Severity"
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          options={SEVERITY_OPTIONS}
        />
        <Input
          label="Tags (comma-separated)"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
        />
      </div>

      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />

      <div className="flex flex-col gap-2">
        <h2 className="text-foreground text-lg font-semibold">Scope</h2>
        <Select
          label="Entity type"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          options={ENTITY_TYPE_OPTIONS}
        />
        <Checkbox
          checked={hasScopeFilter}
          onChange={(e) => setHasScopeFilter(e.target.checked)}
          label="Restrict scope with a filter condition"
        />
        {hasScopeFilter && (
          <ConditionEditor
            condition={scopeFilter}
            onChange={setScopeFilter}
            fragments={fragments}
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-foreground text-lg font-semibold">Condition</h2>
        <ConditionEditor
          condition={conditionRoot}
          onChange={setConditionRoot}
          fragments={fragments}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-foreground text-lg font-semibold">Dependencies</h2>
        <DependencySelector
          excludeRuleId={initialRule?.id}
          selected={dependsOnRuleIds}
          onChange={setDependsOnRuleIds}
        />
      </div>

      {isEditing && (
        <Input
          label="Change description (optional)"
          value={changeDescription}
          onChange={(e) => setChangeDescription(e.target.value)}
        />
      )}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isSaving || !name || !category}>
          {isSaving ? "Saving..." : isEditing ? "Save changes" : "Create rule"}
        </Button>
        <Button variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
