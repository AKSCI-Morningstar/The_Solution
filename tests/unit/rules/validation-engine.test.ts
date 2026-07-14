import { describe, expect, it } from "vitest";
import {
  checkBrokenConditions,
  checkCircularDependency,
  checkDuplicateName,
  checkMissingReferences,
  extractFragmentIds,
} from "@/server/rules/validation-engine";
import type { RuleCondition } from "@/server/rules/condition-types";

describe("checkDuplicateName", () => {
  const existingRules = [
    { id: "rule-1", name: "Torque Spec Check", organizationId: "org-1" },
    { id: "rule-2", name: "Material Cert Required", organizationId: "org-1" },
    { id: "rule-3", name: "Torque Spec Check", organizationId: "org-2" },
  ];

  it("flags a case-insensitive duplicate within the same organization", () => {
    const issue = checkDuplicateName("torque spec check", "org-1", existingRules);
    expect(issue?.code).toBe("DUPLICATE_RULE_NAME");
  });

  it("does not flag a duplicate name in a different organization", () => {
    expect(checkDuplicateName("Torque Spec Check", "org-3", existingRules)).toBeNull();
  });

  it("excludes the rule's own id (editing a rule without renaming it)", () => {
    expect(checkDuplicateName("Torque Spec Check", "org-1", existingRules, "rule-1")).toBeNull();
  });

  it("returns null when the name is unique", () => {
    expect(checkDuplicateName("Brand New Rule", "org-1", existingRules)).toBeNull();
  });
});

describe("extractFragmentIds", () => {
  it("finds a fragmentRef at the top level", () => {
    expect(extractFragmentIds({ type: "fragmentRef", fragmentId: "frag-1" })).toEqual(["frag-1"]);
  });

  it("finds fragmentRefs nested inside group/not/relationshipCheck", () => {
    const condition: RuleCondition = {
      type: "group",
      operator: "AND",
      conditions: [
        { type: "not", condition: { type: "fragmentRef", fragmentId: "frag-a" } },
        {
          type: "relationshipCheck",
          relationshipType: "DEPENDS_ON",
          direction: "outgoing",
          targetCondition: { type: "fragmentRef", fragmentId: "frag-b" },
        },
      ],
    };
    expect(extractFragmentIds(condition).sort()).toEqual(["frag-a", "frag-b"]);
  });

  it("returns an empty array for a tree with no fragment references", () => {
    const condition: RuleCondition = {
      type: "comparison",
      field: { source: "subject", attribute: "status" },
      operator: "eq",
      value: "APPROVED",
    };
    expect(extractFragmentIds(condition)).toEqual([]);
  });
});

describe("checkMissingReferences", () => {
  it("flags a dependsOnRuleId that doesn't exist", () => {
    const issues = checkMissingReferences(
      ["missing-rule"],
      new Set(["rule-1"]),
      {
        type: "comparison",
        field: { source: "subject", attribute: "status" },
        operator: "eq",
        value: "x",
      },
      new Set(),
    );
    expect(issues.some((i) => i.code === "MISSING_DEPENDENCY_REFERENCE")).toBe(true);
  });

  it("flags a fragmentRef that doesn't exist", () => {
    const issues = checkMissingReferences(
      [],
      new Set(),
      { type: "fragmentRef", fragmentId: "missing-frag" },
      new Set(["existing-frag"]),
    );
    expect(issues.some((i) => i.code === "MISSING_FRAGMENT_REFERENCE")).toBe(true);
  });

  it("returns no issues when every reference resolves", () => {
    const issues = checkMissingReferences(
      ["rule-1"],
      new Set(["rule-1"]),
      { type: "fragmentRef", fragmentId: "frag-1" },
      new Set(["frag-1"]),
    );
    expect(issues).toEqual([]);
  });
});

describe("checkCircularDependency", () => {
  it("flags a proposed dependency that would create a cycle", () => {
    const issue = checkCircularDependency(
      "rule-a",
      ["rule-b"],
      [{ ruleId: "rule-b", dependsOnRuleId: "rule-a" }],
    );
    expect(issue?.code).toBe("CIRCULAR_DEPENDENCY");
  });

  it("returns null for a proposed dependency that doesn't create a cycle", () => {
    expect(checkCircularDependency("rule-a", ["rule-b"], [])).toBeNull();
  });

  it("excludes the rule's own prior edges before checking (they're being replaced)", () => {
    const existingEdges = [{ ruleId: "rule-a", dependsOnRuleId: "rule-c" }];
    expect(checkCircularDependency("rule-a", ["rule-b"], existingEdges)).toBeNull();
  });
});

describe("checkBrokenConditions", () => {
  it("flags an impossible expectedCount range (min > max)", () => {
    const condition: RuleCondition = {
      type: "relationshipCheck",
      relationshipType: "DEPENDS_ON",
      direction: "outgoing",
      expectedCount: { min: 5, max: 2 },
    };
    const issues = checkBrokenConditions(condition);
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("BROKEN_CONDITION");
  });

  it("does not flag a valid expectedCount range", () => {
    const condition: RuleCondition = {
      type: "relationshipCheck",
      relationshipType: "DEPENDS_ON",
      direction: "outgoing",
      expectedCount: { min: 1, max: 5 },
    };
    expect(checkBrokenConditions(condition)).toEqual([]);
  });

  it("recurses into nested group/not/relationshipCheck.targetCondition", () => {
    const condition: RuleCondition = {
      type: "group",
      operator: "AND",
      conditions: [
        {
          type: "not",
          condition: {
            type: "relationshipCheck",
            relationshipType: "DEPENDS_ON",
            direction: "outgoing",
            expectedCount: { min: 3, max: 1 },
          },
        },
      ],
    };
    expect(checkBrokenConditions(condition)).toHaveLength(1);
  });
});
