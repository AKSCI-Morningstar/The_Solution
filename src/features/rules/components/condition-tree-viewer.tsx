import type { RuleCondition } from "@/server/rules/condition-types";

export interface ConditionTreeViewerProps {
  condition: RuleCondition;
  fragmentNames?: Record<string, string>;
  depth?: number;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) return `[${value.map(formatValue).join(", ")}]`;
  return String(value);
}

export function ConditionTreeViewer({
  condition,
  fragmentNames,
  depth = 0,
}: ConditionTreeViewerProps) {
  const indentClass = depth > 0 ? "border-border ml-3 border-l pl-3" : "";

  switch (condition.type) {
    case "comparison":
      return (
        <div className={indentClass}>
          <span className="text-foreground text-sm">
            <code className="text-xs">
              {condition.field.source}.{condition.field.attribute}
            </code>{" "}
            <span className="text-muted-foreground">{condition.operator}</span>{" "}
            <code className="text-xs">{formatValue(condition.value)}</code>
          </span>
        </div>
      );
    case "exists":
      return (
        <div className={indentClass}>
          <span className="text-foreground text-sm">
            <code className="text-xs">
              {condition.field.source}.{condition.field.attribute}
            </code>{" "}
            <span className="text-muted-foreground">exists</span>
          </span>
        </div>
      );
    case "not":
      return (
        <div className={indentClass}>
          <span className="text-muted-foreground text-sm font-medium">NOT</span>
          <ConditionTreeViewer
            condition={condition.condition}
            fragmentNames={fragmentNames}
            depth={depth + 1}
          />
        </div>
      );
    case "group":
      return (
        <div className={indentClass}>
          <span className="text-muted-foreground text-sm font-medium">{condition.operator}</span>
          <div className="flex flex-col gap-1.5">
            {condition.conditions.map((child, index) => (
              <ConditionTreeViewer
                key={index}
                condition={child}
                fragmentNames={fragmentNames}
                depth={depth + 1}
              />
            ))}
          </div>
        </div>
      );
    case "relationshipCheck":
      return (
        <div className={indentClass}>
          <span className="text-foreground text-sm">
            {condition.direction === "outgoing" ? "Has outgoing" : "Has incoming"}{" "}
            <code className="text-xs">{condition.relationshipType}</code>
            {condition.targetEntityType && (
              <>
                {" "}
                to <code className="text-xs">{condition.targetEntityType}</code>
              </>
            )}
            {condition.expectedCount && (
              <span className="text-muted-foreground">
                {" "}
                (count{" "}
                {condition.expectedCount.min !== undefined
                  ? `>= ${condition.expectedCount.min}`
                  : ""}
                {condition.expectedCount.max !== undefined
                  ? ` <= ${condition.expectedCount.max}`
                  : ""}
                )
              </span>
            )}
          </span>
          {condition.targetCondition && (
            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">where related entity:</span>
              <ConditionTreeViewer
                condition={condition.targetCondition}
                fragmentNames={fragmentNames}
                depth={depth + 1}
              />
            </div>
          )}
        </div>
      );
    case "fragmentRef":
      return (
        <div className={indentClass}>
          <span className="text-foreground text-sm">
            Fragment:{" "}
            <code className="text-xs">
              {fragmentNames?.[condition.fragmentId] ?? condition.fragmentId}
            </code>
          </span>
        </div>
      );
    default:
      return null;
  }
}
