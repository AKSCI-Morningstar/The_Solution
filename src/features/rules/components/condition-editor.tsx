"use client";

import { ENTITY_TYPES, RELATIONSHIP_TYPES } from "@/server/engineering/constants";
import { COMPARISON_OPERATORS } from "@/server/rules/constants";
import type {
  ComparisonCondition,
  RelationshipCheckCondition,
  RuleCondition,
} from "@/server/rules/condition-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { X } from "lucide-react";
import { CONDITION_TYPE_OPTIONS, createDefaultCondition } from "./condition-defaults";

const SOURCE_OPTIONS = [
  { value: "subject", label: "Subject entity" },
  { value: "related", label: "Related entity" },
];
const OPERATOR_OPTIONS = COMPARISON_OPERATORS.map((op) => ({ value: op, label: op }));
const ENTITY_TYPE_OPTIONS = ENTITY_TYPES.map((t) => ({ value: t, label: t.replaceAll("_", " ") }));
const RELATIONSHIP_TYPE_OPTIONS = RELATIONSHIP_TYPES.map((t) => ({
  value: t,
  label: t.replaceAll("_", " "),
}));
const DIRECTION_OPTIONS = [
  { value: "outgoing", label: "Outgoing" },
  { value: "incoming", label: "Incoming" },
];

export interface ConditionEditorProps {
  condition: RuleCondition;
  onChange: (next: RuleCondition) => void;
  onRemove?: () => void;
  fragments: { id: string; name: string }[];
}

export function ConditionEditor({
  condition,
  onChange,
  onRemove,
  fragments,
}: ConditionEditorProps) {
  return (
    <div className="border-border flex flex-col gap-3 rounded-md border p-3">
      <div className="flex items-center justify-between gap-2">
        <Select
          value={condition.type}
          onChange={(e) => onChange(createDefaultCondition(e.target.value))}
          options={CONDITION_TYPE_OPTIONS}
          className="max-w-56"
          aria-label="Condition type"
        />
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove condition"
            className="text-muted-foreground hover:text-destructive p-1"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {condition.type === "comparison" && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Select
            label="Source"
            value={condition.field.source}
            onChange={(e) =>
              onChange({
                ...condition,
                field: { ...condition.field, source: e.target.value as "subject" | "related" },
              })
            }
            options={SOURCE_OPTIONS}
          />
          <Input
            label="Attribute"
            value={condition.field.attribute}
            onChange={(e) =>
              onChange({ ...condition, field: { ...condition.field, attribute: e.target.value } })
            }
            placeholder="status, metadata.tensileStrength"
          />
          <Select
            label="Operator"
            value={condition.operator}
            onChange={(e) =>
              onChange({
                ...condition,
                operator: e.target.value as ComparisonCondition["operator"],
              })
            }
            options={OPERATOR_OPTIONS}
          />
          <Input
            label="Value"
            value={
              typeof condition.value === "string" || typeof condition.value === "number"
                ? String(condition.value)
                : ""
            }
            onChange={(e) => onChange({ ...condition, value: e.target.value })}
          />
        </div>
      )}

      {condition.type === "exists" && (
        <div className="grid grid-cols-2 gap-2">
          <Select
            label="Source"
            value={condition.field.source}
            onChange={(e) =>
              onChange({
                ...condition,
                field: { ...condition.field, source: e.target.value as "subject" | "related" },
              })
            }
            options={SOURCE_OPTIONS}
          />
          <Input
            label="Attribute"
            value={condition.field.attribute}
            onChange={(e) =>
              onChange({ ...condition, field: { ...condition.field, attribute: e.target.value } })
            }
          />
        </div>
      )}

      {condition.type === "not" && (
        <ConditionEditor
          condition={condition.condition}
          onChange={(next) => onChange({ ...condition, condition: next })}
          fragments={fragments}
        />
      )}

      {condition.type === "group" && (
        <div className="flex flex-col gap-2">
          <Select
            label="Operator"
            value={condition.operator}
            onChange={(e) => onChange({ ...condition, operator: e.target.value as "AND" | "OR" })}
            options={[
              { value: "AND", label: "AND (all must pass)" },
              { value: "OR", label: "OR (any must pass)" },
            ]}
            className="max-w-56"
          />
          <div className="flex flex-col gap-2 pl-4">
            {condition.conditions.map((child, index) => (
              <ConditionEditor
                key={index}
                condition={child}
                fragments={fragments}
                onChange={(next) => {
                  const nextConditions = [...condition.conditions];
                  nextConditions[index] = next;
                  onChange({ ...condition, conditions: nextConditions });
                }}
                onRemove={
                  condition.conditions.length > 1
                    ? () =>
                        onChange({
                          ...condition,
                          conditions: condition.conditions.filter((_, i) => i !== index),
                        })
                    : undefined
                }
              />
            ))}
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="self-start"
            onClick={() =>
              onChange({
                ...condition,
                conditions: [...condition.conditions, createDefaultCondition("comparison")],
              })
            }
          >
            Add condition
          </Button>
        </div>
      )}

      {condition.type === "relationshipCheck" && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Select
              label="Relationship type"
              value={condition.relationshipType}
              onChange={(e) =>
                onChange({
                  ...condition,
                  relationshipType: e.target
                    .value as RelationshipCheckCondition["relationshipType"],
                })
              }
              options={RELATIONSHIP_TYPE_OPTIONS}
            />
            <Select
              label="Direction"
              value={condition.direction}
              onChange={(e) =>
                onChange({ ...condition, direction: e.target.value as "outgoing" | "incoming" })
              }
              options={DIRECTION_OPTIONS}
            />
            <Select
              label="Target entity type"
              value={condition.targetEntityType ?? ""}
              onChange={(e) =>
                onChange({
                  ...condition,
                  targetEntityType: (e.target.value ||
                    undefined) as RelationshipCheckCondition["targetEntityType"],
                })
              }
              options={ENTITY_TYPE_OPTIONS}
              placeholder="Any type"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:max-w-64">
            <Input
              label="Min count"
              type="number"
              value={condition.expectedCount?.min ?? ""}
              onChange={(e) =>
                onChange({
                  ...condition,
                  expectedCount: {
                    ...condition.expectedCount,
                    min: e.target.value ? Number(e.target.value) : undefined,
                  },
                })
              }
            />
            <Input
              label="Max count"
              type="number"
              value={condition.expectedCount?.max ?? ""}
              onChange={(e) =>
                onChange({
                  ...condition,
                  expectedCount: {
                    ...condition.expectedCount,
                    max: e.target.value ? Number(e.target.value) : undefined,
                  },
                })
              }
            />
          </div>
          <div className="pl-4">
            {condition.targetCondition ? (
              <ConditionEditor
                condition={condition.targetCondition}
                fragments={fragments}
                onChange={(next) => onChange({ ...condition, targetCondition: next })}
                onRemove={() => onChange({ ...condition, targetCondition: undefined })}
              />
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  onChange({ ...condition, targetCondition: createDefaultCondition("comparison") })
                }
              >
                Add condition on related entity
              </Button>
            )}
          </div>
        </div>
      )}

      {condition.type === "fragmentRef" && (
        <Select
          label="Fragment"
          value={condition.fragmentId}
          onChange={(e) => onChange({ ...condition, fragmentId: e.target.value })}
          options={fragments.map((f) => ({ value: f.id, label: f.name }))}
          placeholder="Select a fragment"
        />
      )}
    </div>
  );
}
