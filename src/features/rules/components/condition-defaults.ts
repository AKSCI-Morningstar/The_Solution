import type { RuleCondition } from "@/server/rules/condition-types";

export function defaultComparisonCondition(): RuleCondition {
  return {
    type: "comparison",
    field: { source: "subject", attribute: "status" },
    operator: "eq",
    value: "",
  };
}

export function defaultGroupCondition(): RuleCondition {
  return { type: "group", operator: "AND", conditions: [defaultComparisonCondition()] };
}

export function defaultNotCondition(): RuleCondition {
  return { type: "not", condition: defaultComparisonCondition() };
}

export function defaultExistsCondition(): RuleCondition {
  return { type: "exists", field: { source: "subject", attribute: "status" } };
}

export function defaultRelationshipCheckCondition(): RuleCondition {
  return {
    type: "relationshipCheck",
    relationshipType: "DEPENDS_ON",
    direction: "outgoing",
    expectedCount: { min: 1 },
  };
}

export function defaultFragmentRefCondition(): RuleCondition {
  return { type: "fragmentRef", fragmentId: "" };
}

export const CONDITION_TYPE_OPTIONS = [
  { value: "comparison", label: "Comparison" },
  { value: "group", label: "AND / OR Group" },
  { value: "not", label: "NOT" },
  { value: "exists", label: "Field Exists" },
  { value: "relationshipCheck", label: "Relationship Check" },
  { value: "fragmentRef", label: "Reusable Fragment" },
];

export function createDefaultCondition(type: string): RuleCondition {
  switch (type) {
    case "group":
      return defaultGroupCondition();
    case "not":
      return defaultNotCondition();
    case "exists":
      return defaultExistsCondition();
    case "relationshipCheck":
      return defaultRelationshipCheckCondition();
    case "fragmentRef":
      return defaultFragmentRefCondition();
    default:
      return defaultComparisonCondition();
  }
}
