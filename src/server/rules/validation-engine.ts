import type { RuleCondition } from "./condition-types";
import { detectCycle, type DependencyEdge } from "./engine/dependency-graph";

export interface RuleValidationIssue {
  code:
    | "DUPLICATE_RULE_NAME"
    | "MISSING_DEPENDENCY_REFERENCE"
    | "MISSING_FRAGMENT_REFERENCE"
    | "CIRCULAR_DEPENDENCY"
    | "BROKEN_CONDITION";
  message: string;
}

/** Pure structural validation - everything here operates on pre-fetched, plain data. No Prisma, no I/O. */

export function checkDuplicateName(
  name: string,
  organizationId: string,
  existingRules: { id: string; name: string; organizationId: string }[],
  excludeRuleId?: string,
): RuleValidationIssue | null {
  const normalized = name.trim().toLowerCase();
  const duplicate = existingRules.some(
    (rule) =>
      rule.organizationId === organizationId &&
      rule.id !== excludeRuleId &&
      rule.name.trim().toLowerCase() === normalized,
  );
  return duplicate
    ? {
        code: "DUPLICATE_RULE_NAME",
        message: `A rule named "${name}" already exists in this organization`,
      }
    : null;
}

/** Recursively walks a condition tree collecting every fragmentRef id it references. */
export function extractFragmentIds(condition: RuleCondition): string[] {
  switch (condition.type) {
    case "fragmentRef":
      return [condition.fragmentId];
    case "not":
      return extractFragmentIds(condition.condition);
    case "group":
      return condition.conditions.flatMap(extractFragmentIds);
    case "relationshipCheck":
      return condition.targetCondition ? extractFragmentIds(condition.targetCondition) : [];
    case "comparison":
    case "exists":
      return [];
    default:
      return [];
  }
}

export function checkMissingReferences(
  dependsOnRuleIds: string[],
  existingRuleIds: Set<string>,
  conditionRoot: RuleCondition,
  existingFragmentIds: Set<string>,
): RuleValidationIssue[] {
  const issues: RuleValidationIssue[] = [];

  for (const ruleId of dependsOnRuleIds) {
    if (!existingRuleIds.has(ruleId)) {
      issues.push({
        code: "MISSING_DEPENDENCY_REFERENCE",
        message: `Dependency rule "${ruleId}" does not exist in this organization`,
      });
    }
  }

  for (const fragmentId of extractFragmentIds(conditionRoot)) {
    if (!existingFragmentIds.has(fragmentId)) {
      issues.push({
        code: "MISSING_FRAGMENT_REFERENCE",
        message: `Referenced fragment "${fragmentId}" does not exist in this organization`,
      });
    }
  }

  return issues;
}

/**
 * Checks whether adding `dependsOnRuleIds` as dependencies of `ruleId` would
 * introduce a cycle, given the org's existing dependency edges (excluding
 * `ruleId`'s own prior edges, since they're being replaced by this save).
 */
export function checkCircularDependency(
  ruleId: string,
  dependsOnRuleIds: string[],
  existingEdges: DependencyEdge[],
): RuleValidationIssue | null {
  const otherEdges = existingEdges.filter((edge) => edge.ruleId !== ruleId);
  const proposedEdges: DependencyEdge[] = dependsOnRuleIds.map((dependsOnRuleId) => ({
    ruleId,
    dependsOnRuleId,
  }));
  const result = detectCycle([...otherEdges, ...proposedEdges]);

  return result.hasCycle
    ? {
        code: "CIRCULAR_DEPENDENCY",
        message: `Saving this rule would introduce a circular dependency: ${result.cyclePath.join(" -> ")}`,
      }
    : null;
}

/** Catches structurally-impossible conditions Zod's shape validation doesn't (e.g. an unsatisfiable count range). */
export function checkBrokenConditions(condition: RuleCondition): RuleValidationIssue[] {
  const issues: RuleValidationIssue[] = [];

  function walk(node: RuleCondition): void {
    if (node.type === "relationshipCheck") {
      const { min, max } = node.expectedCount ?? {};
      if (min !== undefined && max !== undefined && min > max) {
        issues.push({
          code: "BROKEN_CONDITION",
          message: `relationshipCheck on "${node.relationshipType}" has an impossible count range (min ${min} > max ${max})`,
        });
      }
      if (node.targetCondition) walk(node.targetCondition);
    } else if (node.type === "not") {
      walk(node.condition);
    } else if (node.type === "group") {
      node.conditions.forEach(walk);
    }
  }

  walk(condition);
  return issues;
}
