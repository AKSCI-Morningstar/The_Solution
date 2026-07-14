import { describe, expect, it } from "vitest";
import {
  CircularDependencyError,
  detectCycle,
  topologicalOrder,
} from "@/server/rules/engine/dependency-graph";

describe("detectCycle", () => {
  it("reports no cycle for an acyclic graph", () => {
    const result = detectCycle([
      { ruleId: "a", dependsOnRuleId: "b" },
      { ruleId: "b", dependsOnRuleId: "c" },
    ]);
    expect(result.hasCycle).toBe(false);
    expect(result.cyclePath).toEqual([]);
  });

  it("detects a direct two-node cycle", () => {
    const result = detectCycle([
      { ruleId: "a", dependsOnRuleId: "b" },
      { ruleId: "b", dependsOnRuleId: "a" },
    ]);
    expect(result.hasCycle).toBe(true);
    expect(result.cyclePath).toContain("a");
    expect(result.cyclePath).toContain("b");
  });

  it("detects a longer transitive cycle", () => {
    const result = detectCycle([
      { ruleId: "a", dependsOnRuleId: "b" },
      { ruleId: "b", dependsOnRuleId: "c" },
      { ruleId: "c", dependsOnRuleId: "a" },
    ]);
    expect(result.hasCycle).toBe(true);
  });

  it("a rule depending on itself is a cycle", () => {
    const result = detectCycle([{ ruleId: "a", dependsOnRuleId: "a" }]);
    expect(result.hasCycle).toBe(true);
  });

  it("returns no cycle for an empty edge list", () => {
    expect(detectCycle([]).hasCycle).toBe(false);
  });
});

describe("topologicalOrder", () => {
  it("orders rules so each dependency comes before its dependent", () => {
    const order = topologicalOrder(
      ["a", "b", "c"],
      [
        { ruleId: "a", dependsOnRuleId: "b" },
        { ruleId: "b", dependsOnRuleId: "c" },
      ],
    );
    expect(order.indexOf("c")).toBeLessThan(order.indexOf("b"));
    expect(order.indexOf("b")).toBeLessThan(order.indexOf("a"));
  });

  it("ignores edges to rules outside the requested set", () => {
    const order = topologicalOrder(["a", "b"], [{ ruleId: "a", dependsOnRuleId: "outside-rule" }]);
    expect(order.sort()).toEqual(["a", "b"]);
  });

  it("throws CircularDependencyError when the requested set contains a cycle", () => {
    expect(() =>
      topologicalOrder(
        ["a", "b"],
        [
          { ruleId: "a", dependsOnRuleId: "b" },
          { ruleId: "b", dependsOnRuleId: "a" },
        ],
      ),
    ).toThrow(CircularDependencyError);
  });

  it("returns rules with no dependencies in their original relative order", () => {
    const order = topologicalOrder(["a", "b", "c"], []);
    expect(order).toEqual(["a", "b", "c"]);
  });
});
