import { describe, expect, it } from "vitest";
import {
  collectMatchedEntityIds,
  evaluateCondition,
} from "@/server/rules/engine/evaluate-condition";
import type { EvaluationContext, SubjectEntity } from "@/server/rules/engine/types";
import type { RuleCondition } from "@/server/rules/condition-types";

function makeEntity(overrides: Partial<SubjectEntity> = {}): SubjectEntity {
  return {
    id: "entity-1",
    entityType: "COMPONENT",
    identifier: "COMP-1",
    name: "Bracket",
    status: "APPROVED",
    metadata: { tensileStrength: 500 },
    tags: null,
    labels: null,
    ...overrides,
  };
}

function emptyContext(overrides: Partial<EvaluationContext> = {}): EvaluationContext {
  return { relationships: [], entitiesById: {}, fragments: {}, ...overrides };
}

describe("evaluateCondition - comparison", () => {
  it("passes an eq comparison against a top-level attribute", () => {
    const condition: RuleCondition = {
      type: "comparison",
      field: { source: "subject", attribute: "status" },
      operator: "eq",
      value: "APPROVED",
    };
    const result = evaluateCondition(condition, emptyContext(), { subject: makeEntity() });
    expect(result.result).toBe(true);
    expect(result.missingFields).toEqual([]);
  });

  it("passes a gt comparison against a dot-path metadata field", () => {
    const condition: RuleCondition = {
      type: "comparison",
      field: { source: "subject", attribute: "metadata.tensileStrength" },
      operator: "gt",
      value: 400,
    };
    const result = evaluateCondition(condition, emptyContext(), { subject: makeEntity() });
    expect(result.result).toBe(true);
  });

  it("records a missing field instead of fabricating a false comparison", () => {
    const condition: RuleCondition = {
      type: "comparison",
      field: { source: "subject", attribute: "metadata.nonexistentField" },
      operator: "eq",
      value: "anything",
    };
    const result = evaluateCondition(condition, emptyContext(), { subject: makeEntity() });
    expect(result.result).toBe(false);
    expect(result.missingFields).toEqual(["subject.metadata.nonexistentField"]);
  });

  it("supports contains against an array value", () => {
    const condition: RuleCondition = {
      type: "comparison",
      field: { source: "subject", attribute: "tags" },
      operator: "contains",
      value: "critical",
    };
    const result = evaluateCondition(condition, emptyContext(), {
      subject: makeEntity({ tags: ["critical", "reviewed"] }),
    });
    expect(result.result).toBe(true);
  });

  it("supports in / notIn against a value list", () => {
    const inCondition: RuleCondition = {
      type: "comparison",
      field: { source: "subject", attribute: "status" },
      operator: "in",
      value: ["APPROVED", "PENDING"],
    };
    const notInCondition: RuleCondition = { ...inCondition, operator: "notIn" };

    expect(evaluateCondition(inCondition, emptyContext(), { subject: makeEntity() }).result).toBe(
      true,
    );
    expect(
      evaluateCondition(notInCondition, emptyContext(), { subject: makeEntity() }).result,
    ).toBe(false);
  });
});

describe("evaluateCondition - exists", () => {
  it("is true when the field is present", () => {
    const condition: RuleCondition = {
      type: "exists",
      field: { source: "subject", attribute: "metadata.tensileStrength" },
    };
    expect(evaluateCondition(condition, emptyContext(), { subject: makeEntity() }).result).toBe(
      true,
    );
  });

  it("is false and reports missing when the field is absent", () => {
    const condition: RuleCondition = {
      type: "exists",
      field: { source: "subject", attribute: "metadata.missing" },
    };
    const result = evaluateCondition(condition, emptyContext(), { subject: makeEntity() });
    expect(result.result).toBe(false);
    expect(result.missingFields).toEqual(["subject.metadata.missing"]);
  });
});

describe("evaluateCondition - not", () => {
  it("negates the inner condition's result", () => {
    const condition: RuleCondition = {
      type: "not",
      condition: {
        type: "comparison",
        field: { source: "subject", attribute: "status" },
        operator: "eq",
        value: "APPROVED",
      },
    };
    expect(evaluateCondition(condition, emptyContext(), { subject: makeEntity() }).result).toBe(
      false,
    );
  });
});

describe("evaluateCondition - group", () => {
  const passing: RuleCondition = {
    type: "comparison",
    field: { source: "subject", attribute: "status" },
    operator: "eq",
    value: "APPROVED",
  };
  const failing: RuleCondition = {
    type: "comparison",
    field: { source: "subject", attribute: "status" },
    operator: "eq",
    value: "REJECTED",
  };

  it("AND is true only when every child is true", () => {
    const allPass: RuleCondition = {
      type: "group",
      operator: "AND",
      conditions: [passing, passing],
    };
    const onePasses: RuleCondition = {
      type: "group",
      operator: "AND",
      conditions: [passing, failing],
    };
    expect(evaluateCondition(allPass, emptyContext(), { subject: makeEntity() }).result).toBe(true);
    expect(evaluateCondition(onePasses, emptyContext(), { subject: makeEntity() }).result).toBe(
      false,
    );
  });

  it("OR is true when at least one child is true", () => {
    const condition: RuleCondition = {
      type: "group",
      operator: "OR",
      conditions: [failing, passing],
    };
    expect(evaluateCondition(condition, emptyContext(), { subject: makeEntity() }).result).toBe(
      true,
    );
  });

  it("AND short-circuits after the first failing child (only its trace is emitted)", () => {
    const condition: RuleCondition = {
      type: "group",
      operator: "AND",
      conditions: [failing, passing],
    };
    const result = evaluateCondition(condition, emptyContext(), { subject: makeEntity() });
    expect(result.trace.children).toHaveLength(1);
  });

  it("OR short-circuits after the first passing child (only its trace is emitted)", () => {
    const condition: RuleCondition = {
      type: "group",
      operator: "OR",
      conditions: [passing, failing],
    };
    const result = evaluateCondition(condition, emptyContext(), { subject: makeEntity() });
    expect(result.trace.children).toHaveLength(1);
  });

  it("an empty missingFields list propagates from nested groups", () => {
    const nested: RuleCondition = {
      type: "group",
      operator: "AND",
      conditions: [passing, { type: "group", operator: "OR", conditions: [passing] }],
    };
    expect(
      evaluateCondition(nested, emptyContext(), { subject: makeEntity() }).missingFields,
    ).toEqual([]);
  });
});

describe("evaluateCondition - relationshipCheck", () => {
  const context: EvaluationContext = {
    relationships: [
      { relationshipType: "DEPENDS_ON", sourceEntityId: "entity-1", targetEntityId: "entity-2" },
      { relationshipType: "DEPENDS_ON", sourceEntityId: "entity-3", targetEntityId: "entity-1" },
    ],
    entitiesById: {
      "entity-1": makeEntity(),
      "entity-2": makeEntity({ id: "entity-2", entityType: "MATERIAL", status: "APPROVED" }),
      "entity-3": makeEntity({ id: "entity-3", entityType: "SUPPLIER", status: "PENDING" }),
    },
    fragments: {},
  };

  it("finds an outgoing relationship of the given type", () => {
    const condition: RuleCondition = {
      type: "relationshipCheck",
      relationshipType: "DEPENDS_ON",
      direction: "outgoing",
    };
    const result = evaluateCondition(condition, context, { subject: makeEntity() });
    expect(result.result).toBe(true);
    expect(result.missingFields).toEqual([]);
  });

  it("finds an incoming relationship of the given type", () => {
    const condition: RuleCondition = {
      type: "relationshipCheck",
      relationshipType: "DEPENDS_ON",
      direction: "incoming",
    };
    expect(evaluateCondition(condition, context, { subject: makeEntity() }).result).toBe(true);
  });

  it("reports missing evidence when no relationship of that type exists", () => {
    const condition: RuleCondition = {
      type: "relationshipCheck",
      relationshipType: "CONFLICTS_WITH",
      direction: "outgoing",
    };
    const result = evaluateCondition(condition, context, { subject: makeEntity() });
    expect(result.result).toBe(false);
    expect(result.missingFields).toEqual(["relationship:CONFLICTS_WITH"]);
  });

  it("filters by targetEntityType", () => {
    const condition: RuleCondition = {
      type: "relationshipCheck",
      relationshipType: "DEPENDS_ON",
      direction: "outgoing",
      targetEntityType: "SUPPLIER",
    };
    expect(evaluateCondition(condition, context, { subject: makeEntity() }).result).toBe(false);
  });

  it("respects expectedCount.min/max", () => {
    const tooStrict: RuleCondition = {
      type: "relationshipCheck",
      relationshipType: "DEPENDS_ON",
      direction: "outgoing",
      expectedCount: { min: 2 },
    };
    expect(evaluateCondition(tooStrict, context, { subject: makeEntity() }).result).toBe(false);
  });

  it("evaluates targetCondition against each related entity", () => {
    const condition: RuleCondition = {
      type: "relationshipCheck",
      relationshipType: "DEPENDS_ON",
      direction: "outgoing",
      targetCondition: {
        type: "comparison",
        field: { source: "related", attribute: "entityType" },
        operator: "eq",
        value: "MATERIAL",
      },
    };
    expect(evaluateCondition(condition, context, { subject: makeEntity() }).result).toBe(true);
  });
});

describe("evaluateCondition - fragmentRef", () => {
  it("resolves and evaluates the referenced fragment", () => {
    const condition: RuleCondition = { type: "fragmentRef", fragmentId: "frag-1" };
    const context = emptyContext({
      fragments: {
        "frag-1": {
          type: "comparison",
          field: { source: "subject", attribute: "status" },
          operator: "eq",
          value: "APPROVED",
        },
      },
    });
    expect(evaluateCondition(condition, context, { subject: makeEntity() }).result).toBe(true);
  });

  it("reports missing evidence when the fragment doesn't resolve, never fabricating a result", () => {
    const condition: RuleCondition = { type: "fragmentRef", fragmentId: "does-not-exist" };
    const result = evaluateCondition(condition, emptyContext(), { subject: makeEntity() });
    expect(result.result).toBe(false);
    expect(result.missingFields).toEqual(["fragment:does-not-exist"]);
  });
});

describe("collectMatchedEntityIds", () => {
  it("collects matchedEntityIds from every relationshipCheck node in the trace", () => {
    const condition: RuleCondition = {
      type: "group",
      operator: "AND",
      conditions: [
        { type: "relationshipCheck", relationshipType: "DEPENDS_ON", direction: "outgoing" },
        { type: "relationshipCheck", relationshipType: "DEPENDS_ON", direction: "incoming" },
      ],
    };
    const context: EvaluationContext = {
      relationships: [
        { relationshipType: "DEPENDS_ON", sourceEntityId: "entity-1", targetEntityId: "entity-2" },
        { relationshipType: "DEPENDS_ON", sourceEntityId: "entity-3", targetEntityId: "entity-1" },
      ],
      entitiesById: {
        "entity-2": makeEntity({ id: "entity-2" }),
        "entity-3": makeEntity({ id: "entity-3" }),
      },
      fragments: {},
    };
    const evaluation = evaluateCondition(condition, context, { subject: makeEntity() });
    const ids = collectMatchedEntityIds(evaluation.trace);
    expect(ids.sort()).toEqual(["entity-2", "entity-3"]);
  });

  it("returns an empty array when nothing matched", () => {
    const evaluation = evaluateCondition(
      {
        type: "comparison",
        field: { source: "subject", attribute: "status" },
        operator: "eq",
        value: "APPROVED",
      },
      emptyContext(),
      { subject: makeEntity() },
    );
    expect(collectMatchedEntityIds(evaluation.trace)).toEqual([]);
  });
});
