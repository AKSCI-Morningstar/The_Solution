import { describe, expect, it } from "vitest";
import { ruleConditionSchema, ruleScopeSchema } from "@/server/rules/condition-types";

describe("ruleConditionSchema", () => {
  it("accepts a valid comparison condition", () => {
    const result = ruleConditionSchema.safeParse({
      type: "comparison",
      field: { source: "subject", attribute: "status" },
      operator: "eq",
      value: "APPROVED",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid operator", () => {
    const result = ruleConditionSchema.safeParse({
      type: "comparison",
      field: { source: "subject", attribute: "status" },
      operator: "greaterThanOrWhatever",
      value: "APPROVED",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid source on a field ref", () => {
    const result = ruleConditionSchema.safeParse({
      type: "exists",
      field: { source: "somewhere-else", attribute: "status" },
    });
    expect(result.success).toBe(false);
  });

  it("recursively validates nested group conditions", () => {
    const result = ruleConditionSchema.safeParse({
      type: "group",
      operator: "AND",
      conditions: [
        { type: "exists", field: { source: "subject", attribute: "status" } },
        {
          type: "comparison",
          field: { source: "subject", attribute: "status" },
          operator: "eq",
          value: "x",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a group with an invalid nested condition", () => {
    const result = ruleConditionSchema.safeParse({
      type: "group",
      operator: "AND",
      conditions: [
        {
          type: "comparison",
          field: { source: "subject", attribute: "status" },
          operator: "bogus",
          value: "x",
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty conditions array on a group", () => {
    const result = ruleConditionSchema.safeParse({
      type: "group",
      operator: "AND",
      conditions: [],
    });
    expect(result.success).toBe(false);
  });

  it("validates a relationshipCheck with a nested targetCondition", () => {
    const result = ruleConditionSchema.safeParse({
      type: "relationshipCheck",
      relationshipType: "DEPENDS_ON",
      direction: "outgoing",
      targetCondition: { type: "exists", field: { source: "related", attribute: "status" } },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown condition type", () => {
    const result = ruleConditionSchema.safeParse({ type: "somethingElse" });
    expect(result.success).toBe(false);
  });
});

describe("ruleScopeSchema", () => {
  it("accepts a scope with just an entity type", () => {
    expect(ruleScopeSchema.safeParse({ entityType: "COMPONENT" }).success).toBe(true);
  });

  it("accepts a scope with an optional filter condition", () => {
    const result = ruleScopeSchema.safeParse({
      entityType: "COMPONENT",
      filter: { type: "exists", field: { source: "subject", attribute: "status" } },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid entity type", () => {
    expect(ruleScopeSchema.safeParse({ entityType: "NOT_A_REAL_TYPE" }).success).toBe(false);
  });
});
