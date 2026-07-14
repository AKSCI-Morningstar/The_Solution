import type { ComparisonValue, FieldRef, RuleCondition } from "../condition-types";
import type { ComparisonOperator } from "../constants";
import type {
  ConditionEvaluation,
  EvaluationContext,
  EvaluationFocus,
  SubjectEntity,
  TraceNode,
} from "./types";

function getPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc === null || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, value);
}

const TOP_LEVEL_ATTRIBUTES = new Set(["id", "entityType", "identifier", "name", "status", "tags"]);

function resolveAttribute(entity: SubjectEntity, attribute: string): unknown {
  if (TOP_LEVEL_ATTRIBUTES.has(attribute)) {
    return entity[attribute as keyof SubjectEntity];
  }
  if (attribute.startsWith("metadata.")) {
    return getPath(entity.metadata, attribute.slice("metadata.".length));
  }
  if (attribute.startsWith("labels.")) {
    return getPath(entity.labels, attribute.slice("labels.".length));
  }
  return undefined;
}

function resolveField(field: FieldRef, focus: EvaluationFocus): unknown {
  const entity = field.source === "related" ? focus.related : focus.subject;
  if (!entity) return undefined;
  return resolveAttribute(entity, field.attribute);
}

function describeField(field: FieldRef): string {
  return `${field.source}.${field.attribute}`;
}

function compare(
  operator: ComparisonOperator,
  actual: unknown,
  expected: ComparisonValue | ComparisonValue[],
): boolean {
  switch (operator) {
    case "eq":
      return actual === expected;
    case "neq":
      return actual !== expected;
    case "gt":
      return typeof actual === "number" && typeof expected === "number" && actual > expected;
    case "gte":
      return typeof actual === "number" && typeof expected === "number" && actual >= expected;
    case "lt":
      return typeof actual === "number" && typeof expected === "number" && actual < expected;
    case "lte":
      return typeof actual === "number" && typeof expected === "number" && actual <= expected;
    case "contains":
      if (Array.isArray(actual)) return actual.includes(expected);
      if (typeof actual === "string" && typeof expected === "string")
        return actual.includes(expected);
      return false;
    case "in":
      return Array.isArray(expected) && expected.includes(actual as ComparisonValue);
    case "notIn":
      return Array.isArray(expected) && !expected.includes(actual as ComparisonValue);
    default:
      return false;
  }
}

/**
 * Evaluates a single condition node against the given focus/context. Pure
 * and synchronous - no I/O, no randomness, no wall-clock reads. AND groups
 * short-circuit on the first FAIL, OR groups short-circuit on the first
 * PASS. Never invents a value: an unresolved field is recorded as a missing
 * field and the comparison/exists check simply evaluates to false.
 */
export function evaluateCondition(
  condition: RuleCondition,
  ctx: EvaluationContext,
  focus: EvaluationFocus,
): ConditionEvaluation {
  switch (condition.type) {
    case "comparison": {
      const actual = resolveField(condition.field, focus);
      const isMissing = actual === undefined;
      const result = !isMissing && compare(condition.operator, actual, condition.value);
      const trace: TraceNode = {
        type: "comparison",
        description: `${describeField(condition.field)} ${condition.operator} ${JSON.stringify(condition.value)}`,
        result,
        detail: { actual: actual ?? null },
      };
      return { result, missingFields: isMissing ? [describeField(condition.field)] : [], trace };
    }

    case "exists": {
      const actual = resolveField(condition.field, focus);
      const result = actual !== undefined && actual !== null;
      const trace: TraceNode = {
        type: "exists",
        description: `${describeField(condition.field)} exists`,
        result,
      };
      return { result, missingFields: result ? [] : [describeField(condition.field)], trace };
    }

    case "not": {
      const inner = evaluateCondition(condition.condition, ctx, focus);
      return {
        result: !inner.result,
        missingFields: inner.missingFields,
        trace: { type: "not", description: "NOT", result: !inner.result, children: [inner.trace] },
      };
    }

    case "group": {
      const children: TraceNode[] = [];
      const missingFields: string[] = [];
      const isAnd = condition.operator === "AND";
      let result = isAnd; // identity element: AND starts true, OR starts false

      for (const child of condition.conditions) {
        const evaluated = evaluateCondition(child, ctx, focus);
        children.push(evaluated.trace);
        missingFields.push(...evaluated.missingFields);
        result = isAnd ? result && evaluated.result : result || evaluated.result;

        if (isAnd && !evaluated.result) break; // short-circuit: AND already false
        if (!isAnd && evaluated.result) break; // short-circuit: OR already true
      }

      return {
        result,
        missingFields,
        trace: { type: "group", description: condition.operator, result, children },
      };
    }

    case "relationshipCheck": {
      const relatedIds = ctx.relationships
        .filter((edge) => edge.relationshipType === condition.relationshipType)
        .filter((edge) =>
          condition.direction === "outgoing"
            ? edge.sourceEntityId === focus.subject.id
            : edge.targetEntityId === focus.subject.id,
        )
        .map((edge) =>
          condition.direction === "outgoing" ? edge.targetEntityId : edge.sourceEntityId,
        );

      let relatedEntities = relatedIds
        .map((id) => ctx.entitiesById[id])
        .filter((entity): entity is SubjectEntity => entity !== undefined);

      if (condition.targetEntityType) {
        relatedEntities = relatedEntities.filter(
          (entity) => entity.entityType === condition.targetEntityType,
        );
      }

      const childTraces: TraceNode[] = [];
      let matching = relatedEntities;
      if (condition.targetCondition) {
        const targetCondition = condition.targetCondition;
        matching = relatedEntities.filter((related) => {
          const evaluated = evaluateCondition(targetCondition, ctx, {
            subject: focus.subject,
            related,
          });
          childTraces.push(evaluated.trace);
          return evaluated.result;
        });
      }

      const count = matching.length;
      const min = condition.expectedCount?.min ?? 1;
      const max = condition.expectedCount?.max;
      const result = count >= min && (max === undefined || count <= max);

      return {
        result,
        missingFields: count === 0 ? [`relationship:${condition.relationshipType}`] : [],
        trace: {
          type: "relationshipCheck",
          description: `${condition.direction} ${condition.relationshipType} (found ${count})`,
          result,
          children: childTraces.length > 0 ? childTraces : undefined,
          detail: { matchedEntityIds: matching.map((e) => e.id) },
        },
      };
    }

    case "fragmentRef": {
      const fragment = ctx.fragments[condition.fragmentId];
      if (!fragment) {
        return {
          result: false,
          missingFields: [`fragment:${condition.fragmentId}`],
          trace: {
            type: "fragmentRef",
            description: `fragment ${condition.fragmentId} not found`,
            result: false,
          },
        };
      }
      const evaluated = evaluateCondition(fragment, ctx, focus);
      return {
        ...evaluated,
        trace: {
          type: "fragmentRef",
          description: `fragment ${condition.fragmentId}`,
          result: evaluated.result,
          children: [evaluated.trace],
        },
      };
    }

    default: {
      const _exhaustive: never = condition;
      throw new Error(`Unknown condition type: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

/** Walks a trace tree collecting every entity id a relationshipCheck node matched against, for the execution result's supportingEntityIds field. */
export function collectMatchedEntityIds(trace: TraceNode): string[] {
  const ids = new Set<string>();

  function walk(node: TraceNode): void {
    const matched = node.detail?.matchedEntityIds;
    if (Array.isArray(matched)) {
      for (const id of matched) {
        if (typeof id === "string") ids.add(id);
      }
    }
    node.children?.forEach(walk);
  }

  walk(trace);
  return Array.from(ids);
}
