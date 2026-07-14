import { describe, expect, it } from "vitest";
import {
  createFragmentSchema,
  createRuleSchema,
  executeBatchSchema,
  executeRuleSchema,
  ruleFilterSchema,
} from "@/server/rules/validation";

const validScope = { entityType: "COMPONENT" };
const validCondition = {
  type: "comparison",
  field: { source: "subject", attribute: "status" },
  operator: "eq",
  value: "APPROVED",
};

describe("createRuleSchema", () => {
  it("accepts a minimal valid rule", () => {
    const result = createRuleSchema.safeParse({
      name: "Torque Spec Check",
      category: "ENGINEERING",
      scope: validScope,
      conditionRoot: validCondition,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.severity).toBe("WARNING");
      expect(result.data.priority).toBe(0);
    }
  });

  it("rejects a missing name", () => {
    const result = createRuleSchema.safeParse({
      category: "ENGINEERING",
      scope: validScope,
      conditionRoot: validCondition,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid severity", () => {
    const result = createRuleSchema.safeParse({
      name: "x",
      category: "ENGINEERING",
      severity: "CATASTROPHIC",
      scope: validScope,
      conditionRoot: validCondition,
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 50 dependency ids", () => {
    const result = createRuleSchema.safeParse({
      name: "x",
      category: "ENGINEERING",
      scope: validScope,
      conditionRoot: validCondition,
      dependsOnRuleIds: Array.from({ length: 51 }, (_, i) => `rule-${i}`),
    });
    expect(result.success).toBe(false);
  });
});

describe("ruleFilterSchema", () => {
  it("applies pagination defaults", () => {
    const result = ruleFilterSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects an invalid status filter", () => {
    expect(ruleFilterSchema.safeParse({ status: "NOT_A_STATUS" }).success).toBe(false);
  });
});

describe("executeRuleSchema", () => {
  it("defaults force to false", () => {
    const result = executeRuleSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.force).toBe(false);
  });

  it("coerces a string 'true' query param into a boolean", () => {
    const result = executeRuleSchema.safeParse({ force: "true" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.force).toBe(true);
  });
});

describe("executeBatchSchema", () => {
  it("requires at least one rule id", () => {
    expect(executeBatchSchema.safeParse({ ruleIds: [] }).success).toBe(false);
  });

  it("rejects more than 500 rule ids", () => {
    const result = executeBatchSchema.safeParse({
      ruleIds: Array.from({ length: 501 }, (_, i) => `rule-${i}`),
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid batch request", () => {
    expect(executeBatchSchema.safeParse({ ruleIds: ["rule-1", "rule-2"] }).success).toBe(true);
  });
});

describe("createFragmentSchema", () => {
  it("accepts a valid fragment", () => {
    const result = createFragmentSchema.safeParse({
      name: "Approved Status",
      condition: validCondition,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing condition", () => {
    expect(createFragmentSchema.safeParse({ name: "Approved Status" }).success).toBe(false);
  });
});
